import {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	cleanETag,
	createAssignmentsObject,
	formatDateTime,
	getUserIdByEmail,
	microsoftApiRequest,
	microsoftApiRequestAllItems,
	parseAssignments,
} from './GenericFunctions';
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

	methods = {
		loadOptions: {
			async getPlans(this: ILoadOptionsFunctions) {
				const plans = await microsoftApiRequestAllItems.call(
					this,
					'value',
					'GET',
					'/me/planner/plans',
				);

				return plans.map((plan: any) => ({
					name: plan.title,
					value: plan.id,
				}));
			},

			async getBuckets(this: ILoadOptionsFunctions) {
				const planId = this.getNodeParameter('planId', 0) as string;
				if (!planId) {
					return [];
				}

				const buckets = await microsoftApiRequestAllItems.call(
					this,
					'value',
					'GET',
					`/planner/plans/${planId}/buckets`,
				);

				return buckets.map((bucket: any) => ({
					name: bucket.name,
					value: bucket.id,
				}));
			},

			async getTasks(this: ILoadOptionsFunctions) {
				const planId = this.getNodeParameter('planId', 0) as string;
				const bucketId = this.getNodeParameter('bucketId', 0) as string;

				let endpoint = '';
				if (bucketId) {
					endpoint = `/planner/buckets/${bucketId}/tasks`;
				} else if (planId) {
					endpoint = `/planner/plans/${planId}/tasks`;
				} else {
					return [];
				}

				const tasks = await microsoftApiRequestAllItems.call(
					this,
					'value',
					'GET',
					endpoint,
				);

				return tasks.map((task: any) => ({
					name: task.title,
					value: task.id,
				}));
			},
		},
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

						const formattedDueDateTime = formatDateTime(additionalFields.dueDateTime as string);
						if (formattedDueDateTime) {
							body.dueDateTime = formattedDueDateTime;
						}

						const formattedStartDateTime = formatDateTime(additionalFields.startDateTime as string);
						if (formattedStartDateTime) {
							body.startDateTime = formattedStartDateTime;
						}

						if (additionalFields.percentComplete !== undefined) {
							body.percentComplete = additionalFields.percentComplete;
						}

						// Handle assignments
						if (additionalFields.assignments) {
							const emails = parseAssignments(additionalFields.assignments as string);
							const userIds: string[] = [];

							for (const email of emails) {
								const userId = await getUserIdByEmail.call(this, email);
								if (userId) {
									userIds.push(userId);
								} else {
									console.warn(`Could not find user ID for email: ${email}`);
								}
							}

							if (userIds.length > 0) {
								body.assignments = createAssignmentsObject(userIds);
							} else if (emails.length > 0) {
								console.warn('No valid user IDs found for assignment. Check if User.Read.All permission is granted.');
							}
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

						const formattedDueDateTime = formatDateTime(updateFields.dueDateTime as string);
						if (formattedDueDateTime) {
							body.dueDateTime = formattedDueDateTime;
						}

						const formattedStartDateTime = formatDateTime(updateFields.startDateTime as string);
						if (formattedStartDateTime) {
							body.startDateTime = formattedStartDateTime;
						}

						if (updateFields.percentComplete !== undefined) {
							body.percentComplete = updateFields.percentComplete;
						}

						if (updateFields.bucketId) {
							body.bucketId = updateFields.bucketId;
						}

						// Handle assignments
						if (updateFields.assignments) {
							const emails = parseAssignments(updateFields.assignments as string);
							const userIds: string[] = [];

							for (const email of emails) {
								const userId = await getUserIdByEmail.call(this, email);
								if (userId) {
									userIds.push(userId);
								} else {
									console.warn(`Could not find user ID for email: ${email}`);
								}
							}

							if (userIds.length > 0) {
								body.assignments = createAssignmentsObject(userIds);
							} else if (emails.length > 0) {
								console.warn('No valid user IDs found for assignment. Check if User.Read.All permission is granted.');
							}
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
