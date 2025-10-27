import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { cleanETag, microsoftApiRequest, microsoftApiRequestAllItems } from './GenericFunctions';
import { taskFields, taskOperations } from './TaskDescription';

export class MicrosoftPlanner implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Microsoft Planner',
		name: 'microsoftPlanner',
		icon: 'file:planner.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create and retrieve tasks in Microsoft Planner',
		defaults: {
			name: 'Microsoft Planner',
		},
		inputs: ['main'],
		outputs: ['main'],
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
						name: 'Task',
						value: 'task',
					},
				],
				default: 'task',
			},
			...taskOperations,
			...taskFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'task') {
					// ----------------------------------
					//         task:create
					// ----------------------------------
					if (operation === 'create') {
						const planId = this.getNodeParameter('planId', i) as string;
						const bucketId = this.getNodeParameter('bucketId', i) as string;
						const title = this.getNodeParameter('title', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const body: IDataObject = {
							planId,
							bucketId,
							title,
						};

						if (additionalFields.priority !== undefined) {
							body.priority = additionalFields.priority;
						}

						if (additionalFields.dueDateTime) {
							body.dueDateTime = additionalFields.dueDateTime;
						}

						if (additionalFields.startDateTime) {
							body.startDateTime = additionalFields.startDateTime;
						}

						if (additionalFields.percentComplete !== undefined) {
							body.percentComplete = additionalFields.percentComplete;
						}

						const responseData = await microsoftApiRequest.call(
							this,
							'POST',
							'/planner/tasks',
							body,
						);

						// Add description if provided
						if (additionalFields.description) {
							const details = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/tasks/${responseData.id}/details`,
							);

							const eTag = cleanETag(details['@odata.etag']);

							await microsoftApiRequest.call(
								this,
								'PATCH',
								`/planner/tasks/${responseData.id}/details`,
								{
									description: additionalFields.description,
								},
								{},
								undefined,
								{
									'If-Match': eTag,
								},
							);

							responseData.description = additionalFields.description;
						}

						returnData.push(responseData);
					}

					// ----------------------------------
					//         task:get
					// ----------------------------------
					if (operation === 'get') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const responseData = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/tasks/${taskId}`,
						);

						if (additionalFields.includeDetails) {
							const details = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/tasks/${taskId}/details`,
							);
							responseData.details = details;
						}

						returnData.push(responseData);
					}

					// ----------------------------------
					//         task:getAll
					// ----------------------------------
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i);
						const filters = this.getNodeParameter('filters', i) as IDataObject;

						let endpoint = '';

						if (filters.planId) {
							endpoint = `/planner/plans/${filters.planId}/tasks`;
						} else if (filters.bucketId) {
							endpoint = `/planner/buckets/${filters.bucketId}/tasks`;
						} else {
							throw new NodeOperationError(
								this.getNode(),
								'You must specify either a Plan ID or Bucket ID to retrieve tasks',
								{ itemIndex: i },
							);
						}

						if (returnAll) {
							const responseData = await microsoftApiRequestAllItems.call(
								this,
								'value',
								'GET',
								endpoint,
							);
							returnData.push(...responseData);
						} else {
							const limit = this.getNodeParameter('limit', i);
							const responseData = await microsoftApiRequest.call(this, 'GET', endpoint, {}, {
								$top: limit,
							});
							returnData.push(...(responseData.value as IDataObject[]));
						}
					}

					// ----------------------------------
					//         task:update
					// ----------------------------------
					if (operation === 'update') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

						// Get current task to retrieve eTag
						const currentTask = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/tasks/${taskId}`,
						);

						const eTag = cleanETag(currentTask['@odata.etag']);

						const body: IDataObject = {};

						if (updateFields.title) {
							body.title = updateFields.title;
						}

						if (updateFields.priority !== undefined) {
							body.priority = updateFields.priority;
						}

						if (updateFields.dueDateTime) {
							body.dueDateTime = updateFields.dueDateTime;
						}

						if (updateFields.startDateTime) {
							body.startDateTime = updateFields.startDateTime;
						}

						if (updateFields.percentComplete !== undefined) {
							body.percentComplete = updateFields.percentComplete;
						}

						if (updateFields.bucketId) {
							body.bucketId = updateFields.bucketId;
						}

						const responseData = await microsoftApiRequest.call(
							this,
							'PATCH',
							`/planner/tasks/${taskId}`,
							body,
							{},
							undefined,
							{
								'If-Match': eTag,
							},
						);

						// Update description if provided
						if (updateFields.description) {
							const details = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/tasks/${taskId}/details`,
							);

							const detailsETag = cleanETag(details['@odata.etag']);

							await microsoftApiRequest.call(
								this,
								'PATCH',
								`/planner/tasks/${taskId}/details`,
								{
									description: updateFields.description,
								},
								{},
								undefined,
								{
									'If-Match': detailsETag,
								},
							);
						}

						returnData.push(responseData);
					}

					// ----------------------------------
					//         task:delete
					// ----------------------------------
					if (operation === 'delete') {
						const taskId = this.getNodeParameter('taskId', i) as string;

						// Get current task to retrieve eTag
						const currentTask = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/tasks/${taskId}`,
						);

						const eTag = cleanETag(currentTask['@odata.etag']);

						await microsoftApiRequest.call(
							this,
							'DELETE',
							`/planner/tasks/${taskId}`,
							{},
							{},
							undefined,
							{
								'If-Match': eTag,
							},
						);

						returnData.push({ success: true, taskId });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({ error: errorMessage });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
