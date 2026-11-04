import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	CATEGORY_COLORS,
	microsoftApiRequest,
	microsoftApiRequestAllItems,
} from './GenericFunctions';
import { taskFields, taskOperations } from './TaskDescription';
import { planFields, planOperations } from './PlanDescription';
import { bucketFields, bucketOperations } from './BucketDescription';
import { commentFields, commentOperations } from './CommentDescription';
import { executeTask } from './actions/task';
import { executePlan } from './actions/plan';
import { executeBucket } from './actions/bucket';
import { executeComment } from './actions/comment';

function matchesFilter(name: string, filter?: string): boolean {
	return !filter || name.toLowerCase().includes(filter.toLowerCase());
}

export class MicrosoftPlanner implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Microsoft Planner',
		name: 'microsoftPlanner',
		icon: { light: 'file:planner.svg', dark: 'file:planner.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage plans, buckets, tasks and comments in Microsoft Planner',
		defaults: {
			name: 'Microsoft Planner',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'microsoftPlannerOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Bucket',
						value: 'bucket',
					},
					{
						name: 'Comment',
						value: 'comment',
					},
					{
						name: 'Plan',
						value: 'plan',
					},
					{
						name: 'Task',
						value: 'task',
					},
				],
				default: 'task',
			},
			...taskOperations,
			...taskFields,
			...planOperations,
			...planFields,
			...bucketOperations,
			...bucketFields,
			...commentOperations,
			...commentFields,
		],
	};

	methods = {
		listSearch: {
			async getBuckets(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const planId = this.getCurrentNodeParameter('planId') as string | undefined;
				if (!planId) {
					return { results: [] };
				}

				try {
					const buckets = await microsoftApiRequestAllItems.call(
						this,
						'value',
						'GET',
						`/planner/plans/${planId}/buckets`,
					);

					return {
						results: buckets
							.map((bucket) => ({
								name: (bucket.name as string) || (bucket.id as string),
								value: bucket.id as string,
							}))
							.filter((bucket) => matchesFilter(bucket.name, filter)),
					};
				} catch {
					return { results: [] };
				}
			},

			async getGroups(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				try {
					const groups = await microsoftApiRequestAllItems.call(
						this,
						'value',
						'GET',
						'/me/memberOf/$/microsoft.graph.group',
						{},
						{ $select: 'id,displayName,groupTypes' },
					);

					// Only Microsoft 365 groups ("Unified") can own plans
					return {
						results: groups
							.filter((group) => (group.groupTypes as string[] | undefined)?.includes('Unified'))
							.map((group) => ({
								name: (group.displayName as string) || (group.id as string),
								value: group.id as string,
							}))
							.filter((group) => matchesFilter(group.name, filter))
							.sort((a, b) => a.name.localeCompare(b.name)),
					};
				} catch {
					return { results: [] };
				}
			},
		},

		loadOptions: {
			/** Returns the 25 label slots, named after the plan's label descriptions if available. */
			async getCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				let descriptions: IDataObject = {};

				try {
					let planId = this.getCurrentNodeParameter('planId') as string | undefined;
					if (!planId) {
						const taskId = this.getCurrentNodeParameter('taskId', { extractValue: true }) as
							| string
							| undefined;
						if (taskId) {
							const task = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/tasks/${taskId}`,
								{},
								{ $select: 'planId' },
							);
							planId = task.planId as string;
						}
					}
					if (planId) {
						const details = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/plans/${planId}/details`,
						);
						descriptions = (details.categoryDescriptions as IDataObject) ?? {};
					}
				} catch {
					// Fall back to the generic label names
				}

				return Object.keys(CATEGORY_COLORS).map((category) => {
					const label = descriptions[category] as string | null | undefined;
					const color = CATEGORY_COLORS[category];
					return {
						name: label ? `${label} (${color})` : `${color} (${category})`,
						value: category,
					};
				});
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		// Cache e-mail -> user ID lookups for the whole execution
		const userCache = new Map<string, string>();

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[];

				switch (resource) {
					case 'task':
						responseData = await executeTask.call(this, operation, i, userCache);
						break;
					case 'plan':
						responseData = await executePlan.call(this, operation, i, userCache);
						break;
					case 'bucket':
						responseData = await executeBucket.call(this, operation, i);
						break;
					case 'comment':
						responseData = await executeComment.call(this, operation, i);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unsupported resource "${resource}"`, {
							itemIndex: i,
						});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				const context = (error as { context?: IDataObject }).context;
				if (context && context.itemIndex === undefined) {
					context.itemIndex = i;
				}
				// Both constructors return the error unchanged if it already is of that type
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
