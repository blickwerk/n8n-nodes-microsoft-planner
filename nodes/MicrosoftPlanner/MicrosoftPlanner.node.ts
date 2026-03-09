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
	encodeReferenceKey,
	formatCommentContent,
	formatDateTime,
	generateGuid,
	getUserIdByEmail,
	microsoftApiRequest,
	microsoftApiRequestAllItems,
	parseAssignments,
} from './GenericFunctions';
import { taskFields, taskOperations } from './TaskDescription';
import { planFields, planOperations } from './PlanDescription';
import { bucketFields, bucketOperations } from './BucketDescription';
import { commentFields, commentOperations } from './CommentDescription';

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
					{
						name: 'Plan',
						value: 'plan',
					},
					{
						name: 'Bucket',
						value: 'bucket',
					},
					{
						name: 'Comment',
						value: 'comment',
					},
				],
				default: 'task',
			},
			// Grouped by resource so they appear nicely in the n8n UI
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
			async getBuckets(this: ILoadOptionsFunctions) {
				try {
					const planId = this.getNodeParameter('planId', 0) as string;
					if (!planId) {
						return { results: [] };
					}

					const buckets = await microsoftApiRequestAllItems.call(
						this,
						'value',
						'GET',
						`/planner/plans/${planId}/buckets`,
					);

					if (!buckets || buckets.length === 0) {
						return { results: [] };
					}

					return {
						results: buckets.map((bucket: any) => ({
							name: bucket.name || bucket.id,
							value: bucket.id,
						})),
					};
				} catch (error) {
					return { results: [] };
				}
			},

			async getTasks(this: ILoadOptionsFunctions) {
				try {
					const planId = this.getNodeParameter('planId', 0) as string;

					// Try to get bucketId - might be undefined or an object
					let bucketIdValue = '';
					try {
						const bucketId = this.getNodeParameter('bucketId', 0);
						if (typeof bucketId === 'string') {
							bucketIdValue = bucketId;
						} else if (bucketId && typeof bucketId === 'object' && 'value' in bucketId) {
							bucketIdValue = (bucketId as any).value;
						}
					} catch (error) {
						// bucketId might not exist yet, that's ok
					}

					let endpoint = '';
					if (bucketIdValue) {
						endpoint = `/planner/buckets/${bucketIdValue}/tasks`;
					} else if (planId) {
						endpoint = `/planner/plans/${planId}/tasks`;
					} else {
						return { results: [] };
					}

					const tasks = await microsoftApiRequestAllItems.call(
						this,
						'value',
						'GET',
						endpoint,
					);

					if (!tasks || tasks.length === 0) {
						return { results: [] };
					}

					return {
						results: tasks.map((task: any) => ({
							name: task.title || task.id,
							value: task.id,
						})),
					};
				} catch (error) {
					return { results: [] };
				}
			},

			async getGroups(this: ILoadOptionsFunctions) {
				try {
					const groups = await microsoftApiRequestAllItems.call(
						this,
						'value',
						'GET',
						'/me/memberOf/$/microsoft.graph.group',
					);

					if (!groups || groups.length === 0) {
						return { results: [] };
					}

					// Filter for Microsoft 365 Groups (Unified Groups)
					// Security groups are not supported for Planner plans
					const unifiedGroups = groups.filter((group: any) =>
						group.groupTypes?.includes('Unified'),
					);

					return {
						results: unifiedGroups.map((group: any) => ({
							name: group.displayName || group.id,
							value: group.id,
						})),
					};
				} catch (error) {
					return { results: [] };
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'task') {
					// ----------------------------------
					//         task:create
					// ----------------------------------
					if (operation === 'create') {
						const planId = this.getNodeParameter('planId', i) as string;
						const bucketIdParam = this.getNodeParameter('bucketId', i);
						const bucketId = typeof bucketIdParam === 'string'
							? bucketIdParam
							: (bucketIdParam as IDataObject).value as string;
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
							const emails = parseAssignments(additionalFields.assignments as string | string[]);
							const userIds: string[] = [];

							for (const email of emails) {
								const userId = await getUserIdByEmail.call(this, email);
								userIds.push(userId);
							}

							if (userIds.length > 0) {
								body.assignments = createAssignmentsObject(userIds);
							}
						}

						const responseData = await microsoftApiRequest.call(
							this,
							'POST',
							'/planner/tasks',
							body,
						);

						// Add description, references, or checklist if provided
						if (
							additionalFields.description ||
							additionalFields.attachmentsUi ||
							additionalFields.checklistUi
						) {
							const details = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/tasks/${responseData.id}/details`,
							);

							const eTag = cleanETag(details['@odata.etag']);
							const detailsBody: IDataObject = {};

							if (additionalFields.description) {
								detailsBody.description = additionalFields.description;
								responseData.description = additionalFields.description;
							}

							// Handle Attachments (Manual or JSON)
							const referencesBody: IDataObject = {};
							const attachmentsUi = additionalFields.attachmentsUi as IDataObject;
							if (attachmentsUi && attachmentsUi.attachments) {
								const attachments = attachmentsUi.attachments as IDataObject;
								const mode = attachments.mode as string;
								if (mode === 'manual' && attachments.items) {
									const items = attachments.items as IDataObject;
									if (items && items.reference) {
										const referenceList = items.reference as IDataObject[];
										for (const reference of referenceList) {
											const url = reference.url as string;
											const alias = reference.alias as string;
											const type = reference.type as string;
											const encodedUrl = encodeReferenceKey(url);
											referencesBody[encodedUrl] = {
												'@odata.type': '#microsoft.graph.plannerExternalReference',
												alias,
												type,
											};
										}
									}
								} else if (mode === 'json' && attachments.json) {
									const referencesJson = attachments.json;
									let referenceList: any[];
									try {
										referenceList = typeof referencesJson === 'string'
											? JSON.parse(referencesJson)
											: referencesJson;
										if (!Array.isArray(referenceList)) throw new Error('Not an array');
									} catch (error) {
										throw new NodeOperationError(this.getNode(), 'Invalid JSON in Attachments (JSON) field. It must be an array of objects.', { itemIndex: i });
									}

									for (const reference of referenceList) {
										const url = reference.url;
										if (!url) continue;
										const encodedUrl = encodeReferenceKey(url);
										referencesBody[encodedUrl] = {
											'@odata.type': '#microsoft.graph.plannerExternalReference',
											alias: reference.alias || '',
											type: reference.type || 'Other',
										};
									}
								}
							}

							if (Object.keys(referencesBody).length > 0) {
								detailsBody.references = referencesBody;
							}

							// Handle Checklist (Manual or JSON)
							const checklistBody: IDataObject = {};
							const checklistUi = additionalFields.checklistUi as IDataObject;
							if (checklistUi && checklistUi.checklist) {
								const checklist = checklistUi.checklist as IDataObject;
								const mode = checklist.mode as string;
								if (mode === 'manual' && checklist.items) {
									const items = checklist.items as IDataObject;
									if (items && items.item) {
										const checklistList = items.item as IDataObject[];
										for (const item of checklistList) {
											const id = (item.id as string) || generateGuid();
											checklistBody[id] = {
												'@odata.type': '#microsoft.graph.plannerChecklistItem',
												title: item.title,
												isChecked: item.isChecked,
											};
										}
									}
								} else if (mode === 'json' && checklist.json) {
									const checklistJson = checklist.json;
									let checklistList: any[];
									try {
										checklistList = typeof checklistJson === 'string'
											? JSON.parse(checklistJson)
											: checklistJson;
										if (!Array.isArray(checklistList)) throw new Error('Not an array');
									} catch (error) {
										throw new NodeOperationError(this.getNode(), 'Invalid JSON in Checklist (JSON) field. It must be an array of objects.', { itemIndex: i });
									}

									for (const item of checklistList) {
										const title = item.title;
										if (!title) continue;
										const id = item.id || generateGuid();
										checklistBody[id] = {
											'@odata.type': '#microsoft.graph.plannerChecklistItem',
											title,
											isChecked: !!item.isChecked,
										};
									}
								}
							}

							if (Object.keys(checklistBody).length > 0) {
								detailsBody.checklist = checklistBody;
							}

							await microsoftApiRequest.call(
								this,
								'PATCH',
								`/planner/tasks/${responseData.id}/details`,
								detailsBody,
								{},
								undefined,
								{
									'If-Match': eTag,
								},
							);

							// Fetch latest details to return in response
							const finalDetails = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/tasks/${responseData.id}/details`,
							);
							(responseData as IDataObject).details = finalDetails;
						}

						returnData.push(responseData);
					}

					// ----------------------------------
					//         task:get
					// ----------------------------------
					if (operation === 'get') {
						const taskIdParam = this.getNodeParameter('taskId', i);
						const taskId = typeof taskIdParam === 'string' ? taskIdParam : (taskIdParam as IDataObject).value as string;
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
					// Always return all tasks for the given scope; Graph does not honor $top/$limit
					if (operation === 'getAll') {
						const filterBy = this.getNodeParameter('filterBy', i) as string;
						const planId = this.getNodeParameter('planId', i) as string;

						let endpoint = '';

						if (filterBy === 'plan') {
							endpoint = `/planner/plans/${planId}/tasks`;
						} else if (filterBy === 'bucket') {
							const bucketIdParam = this.getNodeParameter('bucketId', i);
							const bucketIdValue = typeof bucketIdParam === 'string'
								? bucketIdParam
								: (bucketIdParam as IDataObject).value as string;
							endpoint = `/planner/buckets/${bucketIdValue}/tasks`;
						} else {
							throw new NodeOperationError(
								this.getNode(),
								'You must specify either a Plan ID or Bucket ID to retrieve tasks',
								{ itemIndex: i },
							);
						}

						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						const qs: IDataObject = {};
						if (additionalFields?.select) {
							qs.$select = additionalFields.select;
						}

						const responseData = await microsoftApiRequestAllItems.call(
							this,
							'value',
							'GET',
							endpoint,
							{},
							qs,
						);
						returnData.push(...responseData);
					}

					// ----------------------------------
					//         task:update
					// ----------------------------------
					if (operation === 'update') {
						const taskIdParam = this.getNodeParameter('taskId', i);
						const taskId = typeof taskIdParam === 'string' ? taskIdParam : (taskIdParam as IDataObject).value as string;
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
							const emails = parseAssignments(updateFields.assignments as string | string[]);
							const userIds: string[] = [];

							for (const email of emails) {
								const userId = await getUserIdByEmail.call(this, email);
								userIds.push(userId);
							}

							if (userIds.length > 0) {
								body.assignments = createAssignmentsObject(userIds);
							}
						}

						// Only send PATCH request if there are fields to update (excluding description)
						if (Object.keys(body).length > 0) {
							await microsoftApiRequest.call(
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
						}

						// Update description, references, or checklist if provided
						if (
							updateFields.description ||
							updateFields.attachmentsUi ||
							updateFields.checklistUi
						) {
							const details = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/tasks/${taskId}/details`,
							);

							const detailsETag = cleanETag(details['@odata.etag']);
							const detailsBody: IDataObject = {};

							if (updateFields.description) {
								detailsBody.description = updateFields.description;
							}

							const referencesBody: IDataObject = {};

							// 1. If operationMode is 'replace', set all existing references to null
							const attachmentsUiForReplace = updateFields.attachmentsUi as IDataObject;
							const attachmentsForReplace = attachmentsUiForReplace?.attachments as IDataObject;
							const attachmentsOperationMode = attachmentsForReplace?.operationMode as string;
							if (attachmentsOperationMode === 'replace' && details.references) {
								for (const key of Object.keys(details.references)) {
									referencesBody[key] = null;
								}
							}

							// 2. Add new/updated references (Manual or JSON)
							const attachmentsUi = updateFields.attachmentsUi as IDataObject;
							if (attachmentsUi && attachmentsUi.attachments) {
								const attachments = attachmentsUi.attachments as IDataObject;
								const mode = attachments.mode as string;
								if (mode === 'manual' && attachments.items) {
									const items = attachments.items as IDataObject;
									if (items && items.reference) {
										const referenceList = items.reference as IDataObject[];

										for (const reference of referenceList) {
											const url = reference.url as string;
											const alias = reference.alias as string;
											const type = reference.type as string;
											const encodedUrl = encodeReferenceKey(url);
											referencesBody[encodedUrl] = {
												'@odata.type': '#microsoft.graph.plannerExternalReference',
												alias,
												type,
											};
										}
									}
								} else if (mode === 'json' && attachments.json) {
									const referencesJson = attachments.json;
									let referenceList: any[];
									try {
										referenceList = typeof referencesJson === 'string'
											? JSON.parse(referencesJson)
											: referencesJson;
										if (!Array.isArray(referenceList)) throw new Error('Not an array');
									} catch (error) {
										throw new NodeOperationError(this.getNode(), 'Invalid JSON in Attachments (JSON) field. It must be an array of objects.', { itemIndex: i });
									}

									for (const reference of referenceList) {
										const url = reference.url;
										if (!url) continue;
										const encodedUrl = encodeReferenceKey(url);
										referencesBody[encodedUrl] = {
											'@odata.type': '#microsoft.graph.plannerExternalReference',
											alias: reference.alias || '',
											type: reference.type || 'Other',
										};
									}
								}
							}

							if (Object.keys(referencesBody).length > 0) {
								detailsBody.references = referencesBody;
							}

							const checklistBody: IDataObject = {};

							// 1. If operationMode is 'replace', set all existing checklist items to null
							const checklistUiForReplace = updateFields.checklistUi as IDataObject;
							const checklistForReplace = checklistUiForReplace?.checklist as IDataObject;
							const checklistOperationMode = checklistForReplace?.operationMode as string;
							if (checklistOperationMode === 'replace' && details.checklist) {
								for (const key of Object.keys(details.checklist)) {
									checklistBody[key] = null;
								}
							}

							// 2. Add new/updated checklist items (Manual or JSON)
							const checklistUi = updateFields.checklistUi as IDataObject;
							if (checklistUi && checklistUi.checklist) {
								const checklist = checklistUi.checklist as IDataObject;
								const mode = checklist.mode as string;
								if (mode === 'manual' && checklist.items) {
									const items = checklist.items as IDataObject;
									if (items && items.item) {
										const checklistList = items.item as IDataObject[];

										for (const item of checklistList) {
											const id = (item.id as string) || generateGuid();
											checklistBody[id] = {
												'@odata.type': '#microsoft.graph.plannerChecklistItem',
												title: item.title,
												isChecked: item.isChecked,
											};
										}
									}
								} else if (mode === 'json' && checklist.json) {
									const checklistJson = checklist.json;
									let checklistList: any[];
									try {
										checklistList = typeof checklistJson === 'string'
											? JSON.parse(checklistJson)
											: checklistJson;
										if (!Array.isArray(checklistList)) throw new Error('Not an array');
									} catch (error) {
										throw new NodeOperationError(this.getNode(), 'Invalid JSON in Checklist (JSON) field. It must be an array of objects.', { itemIndex: i });
									}

									for (const item of checklistList) {
										const title = item.title;
										if (!title) continue;
										const id = item.id || generateGuid();
										checklistBody[id] = {
											'@odata.type': '#microsoft.graph.plannerChecklistItem',
											title,
											isChecked: !!item.isChecked,
										};
									}
								}
							}

							if (Object.keys(checklistBody).length > 0) {
								detailsBody.checklist = checklistBody;
							}

							await microsoftApiRequest.call(
								this,
								'PATCH',
								`/planner/tasks/${taskId}/details`,
								detailsBody,
								{},
								undefined,
								{
									'If-Match': detailsETag,
								},
							);
						}

						// Fetch updated task to return complete data
						const responseData = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/tasks/${taskId}`,
						);

						// If description (task details) was updated, also return latest details
						if (
							Object.prototype.hasOwnProperty.call(updateFields, 'description') ||
							Object.prototype.hasOwnProperty.call(updateFields, 'attachmentsUi') ||
							Object.prototype.hasOwnProperty.call(updateFields, 'checklistUi')
						) {
							const details = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/tasks/${taskId}/details`,
							);
							(responseData as IDataObject).details = details;
						}

						returnData.push(responseData);
					}

					// ----------------------------------
					//         task:delete
					// ----------------------------------
					if (operation === 'delete') {
						const taskIdParam = this.getNodeParameter('taskId', i);
						const taskId = typeof taskIdParam === 'string' ? taskIdParam : (taskIdParam as IDataObject).value as string;

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


					// ----------------------------------
					//         task:getFiles
					// ----------------------------------
					if (operation === 'getFiles') {
						const taskIdParam = this.getNodeParameter('taskId', i);
						const taskId = typeof taskIdParam === 'string' ? taskIdParam : (taskIdParam as IDataObject).value as string;

						// Get task details
						const details = await microsoftApiRequest.call(this, 'GET', `/planner/tasks/${taskId}/details`);

						const references = details.references || {};
						const files = Object.keys(references).map((encodedUrl) => {
							// Decode the URL
							const url = decodeURIComponent(encodedUrl);
							return {
								url,
								alias: references[encodedUrl].alias,
								type: references[encodedUrl].type,
								previewPriority: references[encodedUrl].previewPriority,
								lastModifiedDateTime: references[encodedUrl].lastModifiedDateTime,
								lastModifiedBy: references[encodedUrl].lastModifiedBy,
							};
						});

						returnData.push({
							taskId,
							fileCount: files.length,
							files,
						});
					}
				}
				// ----------------------------------
				//         plan resource
				// ----------------------------------
				if (resource === 'plan') {
					// plan:create -> POST /planner/plans
					if (operation === 'create') {
						const ownerParam = this.getNodeParameter('owner', i);
						const owner = typeof ownerParam === 'string'
							? ownerParam
							: (ownerParam as IDataObject).value as string;
						const title = this.getNodeParameter('title', i) as string;

						const body: IDataObject = { owner, title };

						const responseData = await microsoftApiRequest.call(
							this,
							'POST',
							'/planner/plans',
							body,
						);

						returnData.push(responseData);
					}

					// plan:get -> GET /planner/plans/{planId}
					if (operation === 'get') {
						const planId = this.getNodeParameter('planId', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						const responseData = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/plans/${planId}`,
						);

						if (additionalFields.includeDetails) {
							const details = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/plans/${planId}/details`,
							);
							(responseData as IDataObject).details = details;
						}

						returnData.push(responseData);
					}

					// plan:getAll -> list plans scoped to current user or a specific group
					// Always return all plans; Graph does not honor $top/$limit for Planner.
					if (operation === 'getAll') {
						const scope = this.getNodeParameter('scope', i) as string;
						let endpoint = '';

						if (scope === 'my') {
							// List plans for the current user
							endpoint = '/me/planner/plans';
						} else if (scope === 'group') {
							// List plans owned by a specific Microsoft 365 group
							const groupId = this.getNodeParameter('groupId', i) as string;
							endpoint = `/groups/${groupId}/planner/plans`;
						} else {
							throw new NodeOperationError(this.getNode(), 'Invalid scope for plan getAll operation', {
								itemIndex: i,
							});
						}

						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						const qs: IDataObject = {};
						if (additionalFields?.select) {
							qs.$select = additionalFields.select;
						}

						const responseData = await microsoftApiRequestAllItems.call(
							this,
							'value',
							'GET',
							endpoint,
							{},
							qs,
						);
						returnData.push(...responseData);
					}

					// plan:update -> PATCH /planner/plans/{planId} with ETag, and optionally /details
					if (operation === 'update') {
						const planId = this.getNodeParameter('planId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

						// Get current plan to obtain ETag
						const currentPlan = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/plans/${planId}`,
						);
						const eTag = cleanETag(currentPlan['@odata.etag']);

						const body: IDataObject = {};
						if (updateFields.title) {
							body.title = updateFields.title;
						}

						if (Object.keys(body).length > 0) {
							await microsoftApiRequest.call(
								this,
								'PATCH',
								`/planner/plans/${planId}`,
								body,
								{},
								undefined,
								{
									'If-Match': eTag,
								},
							);
						}

						// Optionally update plan details if provided
						const detailsBody: IDataObject = {};
						if (updateFields.categoryDescriptions) {
							const categories = updateFields.categoryDescriptions as IDataObject;
							const cleanedCategories: IDataObject = {};
							for (const key of Object.keys(categories)) {
								const value = categories[key] as string | null | undefined;
								// Empty string in the UI means "unset" → send null to Graph
								if (value === '') {
									cleanedCategories[key] = null;
								} else if (value !== undefined) {
									cleanedCategories[key] = value;
								}
							}
							if (Object.keys(cleanedCategories).length > 0) {
								detailsBody.categoryDescriptions = cleanedCategories;
							}
						}

						if (updateFields.sharedWithJson) {
							let sharedWithParsed: IDataObject;
							try {
								sharedWithParsed = JSON.parse(updateFields.sharedWithJson as string) as IDataObject;
							} catch (error) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in Shared With (plannerUserIds JSON) field', {
									itemIndex: i,
								});
							}
							if (Object.keys(sharedWithParsed).length > 0) {
								detailsBody.sharedWith = sharedWithParsed;
							}
						}

						if (Object.keys(detailsBody).length > 0) {
							const currentDetails = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/plans/${planId}/details`,
							);
							const detailsETag = cleanETag(currentDetails['@odata.etag']);

							await microsoftApiRequest.call(
								this,
								'PATCH',
								`/planner/plans/${planId}/details`,
								detailsBody,
								{},
								undefined,
								{
									'If-Match': detailsETag,
								},
							);
						}

						const responseData = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/plans/${planId}`,
						);

						// If plan details were updated, also include latest details in the response
						if (Object.keys(detailsBody).length > 0) {
							const details = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/plans/${planId}/details`,
							);
							(responseData as IDataObject).details = details;
						}

						returnData.push(responseData);
					}

					// plan:delete -> DELETE /planner/plans/{planId} with ETag
					if (operation === 'delete') {
						const planId = this.getNodeParameter('planId', i) as string;

						const currentPlan = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/plans/${planId}`,
						);
						const eTag = cleanETag(currentPlan['@odata.etag']);

						await microsoftApiRequest.call(
							this,
							'DELETE',
							`/planner/plans/${planId}`,
							{},
							{},
							undefined,
							{
								'If-Match': eTag,
							},
						);

						returnData.push({ success: true, planId });
					}
				}

				// ----------------------------------
				//         bucket resource
				// ----------------------------------
				if (resource === 'bucket') {
					// bucket:create -> POST /planner/buckets
					if (operation === 'create') {
						const planId = this.getNodeParameter('planId', i) as string;
						const name = this.getNodeParameter('name', i) as string;
						const upsert = this.getNodeParameter('upsert', i, false) as boolean;

						if (upsert) {
							// Check if bucket already exists
							const buckets = await microsoftApiRequestAllItems.call(
								this,
								'value',
								'GET',
								`/planner/plans/${planId}/buckets`,
							);

							const existingBucket = buckets.find((b: any) => b.name === name);
							if (existingBucket) {
								returnData.push(existingBucket);
								continue;
							}
						}

						const body: IDataObject = {
							name,
							planId,
						};

						const responseData = await microsoftApiRequest.call(
							this,
							'POST',
							'/planner/buckets',
							body,
						);

						returnData.push(responseData);
					}

					// bucket:get -> GET /planner/buckets/{bucketId}
					if (operation === 'get') {
						const bucketId = this.getNodeParameter('bucketId', i) as string;

						const responseData = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/buckets/${bucketId}`,
						);

						returnData.push(responseData);
					}

					// bucket:getAll -> GET /planner/plans/{planId}/buckets
					// Always return all buckets for the plan; Graph does not honor $top/$limit for Planner.
					if (operation === 'getAll') {
						const planId = this.getNodeParameter('planId', i) as string;
						const endpoint = `/planner/plans/${planId}/buckets`;

						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						const qs: IDataObject = {};
						if (additionalFields?.select) {
							qs.$select = additionalFields.select;
						}

						const responseData = await microsoftApiRequestAllItems.call(
							this,
							'value',
							'GET',
							endpoint,
							{},
							qs,
						);
						returnData.push(...responseData);
					}

					// bucket:update -> PATCH /planner/buckets/{bucketId} with ETag
					if (operation === 'update') {
						const bucketId = this.getNodeParameter('bucketId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

						const currentBucket = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/buckets/${bucketId}`,
						);
						const eTag = cleanETag(currentBucket['@odata.etag']);

						const body: IDataObject = {};
						if (updateFields.name) {
							body.name = updateFields.name;
						}
						if (updateFields.orderHint) {
							body.orderHint = updateFields.orderHint;
						}

						if (Object.keys(body).length > 0) {
							await microsoftApiRequest.call(
								this,
								'PATCH',
								`/planner/buckets/${bucketId}`,
								body,
								{},
								undefined,
								{
									'If-Match': eTag,
								},
							);
						}

						const responseData = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/buckets/${bucketId}`,
						);

						returnData.push(responseData);
					}

					// bucket:delete -> DELETE /planner/buckets/{bucketId} with ETag
					if (operation === 'delete') {
						const bucketId = this.getNodeParameter('bucketId', i) as string;

						const currentBucket = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/buckets/${bucketId}`,
						);
						const eTag = cleanETag(currentBucket['@odata.etag']);

						await microsoftApiRequest.call(
							this,
							'DELETE',
							`/planner/buckets/${bucketId}`,
							{},
							{},
							undefined,
							{
								'If-Match': eTag,
							},
						);

						returnData.push({ success: true, bucketId });
					}
				}

				// ----------------------------------
				//         comment resource
				// ----------------------------------
				if (resource === 'comment') {
					// ----------------------------------
					//         comment:create
					// ----------------------------------
					if (operation === 'create') {
						const taskIdParam = this.getNodeParameter('taskId', i);
						const taskId = typeof taskIdParam === 'string' ? taskIdParam : (taskIdParam as IDataObject).value as string;
						const content = this.getNodeParameter('content', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						const contentType = (additionalFields.contentType as string) || 'text';

						// Get the task to retrieve planId and conversationThreadId
						const task = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/tasks/${taskId}`,
						);

						// Get the plan to retrieve the group ID
						const plan = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/plans/${task.planId}`,
						);

						const groupId = plan.container.containerId;
						const commentBody = formatCommentContent(content, contentType);

						let conversationId: string;
						let threadId: string;

						if (!task.conversationThreadId) {
							// Create a new conversation thread
							const conversation = await microsoftApiRequest.call(
								this,
								'POST',
								`/groups/${groupId}/conversations`,
								{
									topic: `Comments on task "${task.title}"`,
									threads: [
										{
											posts: [commentBody],
										},
									],
								},
							);

							conversationId = conversation.id;
							threadId = conversation.threads[0].id;

							// Update the task with the new conversationThreadId
							const taskETag = cleanETag(task['@odata.etag']);
							await microsoftApiRequest.call(
								this,
								'PATCH',
								`/planner/tasks/${taskId}`,
								{
									conversationThreadId: threadId,
								},
								{},
								undefined,
								{
									'If-Match': taskETag,
								},
							);
						} else {
							// Add a reply to the existing conversation thread
							threadId = task.conversationThreadId;

							// Get the conversation ID from the thread
							const thread = await microsoftApiRequest.call(
								this,
								'GET',
								`/groups/${groupId}/threads/${threadId}`,
							);
							conversationId = thread.conversationId || thread.id;

							// Add reply to the thread
							await microsoftApiRequest.call(
								this,
								'POST',
								`/groups/${groupId}/conversations/${conversationId}/threads/${threadId}/reply`,
								{
									post: commentBody,
								},
							);
						}

						returnData.push({
							success: true,
							taskId,
							conversationId,
							threadId,
							content,
						});
					}

					// ----------------------------------
					//         comment:getAll
					// ----------------------------------
					if (operation === 'getAll') {
						const taskIdParam = this.getNodeParameter('taskId', i);
						const taskId = typeof taskIdParam === 'string' ? taskIdParam : (taskIdParam as IDataObject).value as string;

						// Get the task to retrieve conversationThreadId
						const task = await microsoftApiRequest.call(
							this,
							'GET',
							`/planner/tasks/${taskId}`,
						);

						if (!task.conversationThreadId) {
							// No comments on this task
							returnData.push({
								taskId,
								comments: [],
								commentCount: 0,
							});
						} else {
							// Get the plan to retrieve the group ID
							const plan = await microsoftApiRequest.call(
								this,
								'GET',
								`/planner/plans/${task.planId}`,
							);

							const groupId = plan.container.containerId;
							const threadId = task.conversationThreadId;

							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
							const qs: IDataObject = {};
							if (additionalFields?.select) {
								qs.$select = additionalFields.select;
							}

							// Get all posts from the conversation thread
							const posts = await microsoftApiRequest.call(
								this,
								'GET',
								`/groups/${groupId}/threads/${threadId}/posts`,
								{},
								qs
							);

							const comments = posts.value.map((post: IDataObject) => ({
								id: post.id,
								content: post.body,
								from: post.from,
								createdDateTime: post.createdDateTime,
								lastModifiedDateTime: post.lastModifiedDateTime,
							}));

							returnData.push({
								taskId,
								comments,
								commentCount: comments.length,
							});
						}
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


