import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	createAssignmentsObject,
	decodeReferenceKey,
	deleteWithETag,
	encodeReferenceKey,
	formatDateTime,
	generateGuid,
	microsoftApiRequest,
	microsoftApiRequestAllItems,
	parseJson,
	parseList,
	patchWithETag,
	resolveUserIds,
} from '../GenericFunctions';

type UserCache = Map<string, string>;

const has = (obj: IDataObject, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

function getLocatorValue(this: IExecuteFunctions, name: string, i: number): string {
	return this.getNodeParameter(name, i, '', { extractValue: true }) as string;
}

// ----------------------------------
//   Task details helpers
// ----------------------------------

/** Builds a plannerExternalReferences object from the Attachments UI. */
function buildReferences(this: IExecuteFunctions, ui: unknown, i: number): IDataObject {
	const references: IDataObject = {};
	const attachments = (ui as IDataObject | undefined)?.attachments as IDataObject | undefined;
	if (!attachments) {
		return references;
	}

	let list: IDataObject[] = [];
	if ((attachments.mode ?? 'manual') === 'manual') {
		list = ((attachments.items as IDataObject | undefined)?.reference as IDataObject[]) ?? [];
	} else if (attachments.json) {
		const parsed = parseJson.call(this, attachments.json, 'Attachments (JSON)', i);
		if (!Array.isArray(parsed)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid JSON in Attachments (JSON) field. It must be an array of objects.',
				{ itemIndex: i },
			);
		}
		list = parsed as IDataObject[];
	}

	for (const reference of list) {
		const url = reference.url as string | undefined;
		if (!url) continue;
		const value: IDataObject = {
			'@odata.type': '#microsoft.graph.plannerExternalReference',
			alias: (reference.alias as string) || '',
			type: (reference.type as string) || 'Other',
		};
		if (reference.previewPriority) {
			value.previewPriority = reference.previewPriority;
		}
		references[encodeReferenceKey(url)] = value;
	}

	return references;
}

/** Builds a plannerChecklistItems object from the Checklist UI. */
function buildChecklist(this: IExecuteFunctions, ui: unknown, i: number): IDataObject {
	const checklistItems: IDataObject = {};
	const checklist = (ui as IDataObject | undefined)?.checklist as IDataObject | undefined;
	if (!checklist) {
		return checklistItems;
	}

	let list: IDataObject[] = [];
	if ((checklist.mode ?? 'manual') === 'manual') {
		list = ((checklist.items as IDataObject | undefined)?.item as IDataObject[]) ?? [];
	} else if (checklist.json) {
		const parsed = parseJson.call(this, checklist.json, 'Checklist (JSON)', i);
		if (!Array.isArray(parsed)) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid JSON in Checklist (JSON) field. It must be an array of objects.',
				{ itemIndex: i },
			);
		}
		list = parsed as IDataObject[];
	}

	for (const item of list) {
		if (!item.title) continue;
		const value: IDataObject = {
			'@odata.type': '#microsoft.graph.plannerChecklistItem',
			title: item.title,
			isChecked: !!item.isChecked,
		};
		if (item.orderHint) {
			value.orderHint = item.orderHint;
		}
		checklistItems[(item.id as string) || generateGuid()] = value;
	}

	return checklistItems;
}

/**
 * Builds the PATCH body for /planner/tasks/{id}/details.
 * `current` is the current details object (required for replace / remove operations).
 */
function buildDetailsBody(
	this: IExecuteFunctions,
	fields: IDataObject,
	current: IDataObject,
	i: number,
	isUpdate: boolean,
): IDataObject {
	const body: IDataObject = {};

	if (isUpdate ? has(fields, 'description') : fields.description) {
		body.description = fields.description;
	}

	if (fields.previewType) {
		body.previewType = fields.previewType;
	}

	// --- References / attachments
	const references: IDataObject = {};
	const currentReferences = (current.references as IDataObject | undefined) ?? {};
	const attachments = (fields.attachmentsUi as IDataObject | undefined)?.attachments as
		| IDataObject
		| undefined;

	if (isUpdate && attachments?.operationMode === 'replace') {
		for (const key of Object.keys(currentReferences)) {
			references[key] = null;
		}
	}

	for (const url of parseList(fields.removeAttachmentUrls)) {
		const existingKey = Object.keys(currentReferences).find(
			(key) => key === url || decodeReferenceKey(key) === url || key === encodeReferenceKey(url),
		);
		references[existingKey ?? encodeReferenceKey(url)] = null;
	}

	Object.assign(references, buildReferences.call(this, fields.attachmentsUi, i));

	if (Object.keys(references).length > 0) {
		body.references = references;
	}

	// --- Checklist
	const checklistItems: IDataObject = {};
	const currentChecklist = (current.checklist as IDataObject | undefined) ?? {};
	const checklist = (fields.checklistUi as IDataObject | undefined)?.checklist as
		| IDataObject
		| undefined;

	if (isUpdate && checklist?.operationMode === 'replace') {
		for (const key of Object.keys(currentChecklist)) {
			checklistItems[key] = null;
		}
	}

	for (const id of parseList(fields.removeChecklistItemIds)) {
		checklistItems[id] = null;
	}

	Object.assign(checklistItems, buildChecklist.call(this, fields.checklistUi, i));

	if (Object.keys(checklistItems).length > 0) {
		body.checklist = checklistItems;
	}

	return body;
}

const DETAILS_FIELDS = [
	'description',
	'previewType',
	'attachmentsUi',
	'checklistUi',
	'removeAttachmentUrls',
	'removeChecklistItemIds',
];

function hasDetailsFields(fields: IDataObject): boolean {
	return DETAILS_FIELDS.some((key) => has(fields, key));
}

function buildAppliedCategories(add: unknown, remove: unknown): IDataObject {
	const categories: IDataObject = {};
	for (const category of parseList(remove)) {
		categories[category] = false;
	}
	for (const category of parseList(add)) {
		categories[category] = true;
	}
	return categories;
}

// ----------------------------------
//   Operations
// ----------------------------------

async function create(this: IExecuteFunctions, i: number, userCache: UserCache) {
	const planId = this.getNodeParameter('planId', i) as string;
	const bucketId = getLocatorValue.call(this, 'bucketId', i);
	const title = this.getNodeParameter('title', i) as string;
	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

	const body: IDataObject = { planId, bucketId, title };

	if (additionalFields.priority !== undefined) {
		body.priority = additionalFields.priority;
	}
	if (additionalFields.percentComplete !== undefined) {
		body.percentComplete = additionalFields.percentComplete;
	}
	const dueDateTime = formatDateTime(additionalFields.dueDateTime);
	if (dueDateTime) {
		body.dueDateTime = dueDateTime;
	}
	const startDateTime = formatDateTime(additionalFields.startDateTime);
	if (startDateTime) {
		body.startDateTime = startDateTime;
	}
	for (const key of ['orderHint', 'assigneePriority', 'conversationThreadId']) {
		if (additionalFields[key]) {
			body[key] = additionalFields[key];
		}
	}

	const categories = buildAppliedCategories(additionalFields.appliedCategories, undefined);
	if (Object.keys(categories).length > 0) {
		body.appliedCategories = categories;
	}

	if (additionalFields.assignments) {
		const userIds = await resolveUserIds.call(this, additionalFields.assignments, userCache);
		if (userIds.length > 0) {
			body.assignments = createAssignmentsObject(userIds);
		}
	}

	const task = (await microsoftApiRequest.call(
		this,
		'POST',
		'/planner/tasks',
		body,
	)) as IDataObject;

	if (
		additionalFields.description ||
		additionalFields.previewType ||
		additionalFields.attachmentsUi ||
		additionalFields.checklistUi
	) {
		let detailsChanged = false;
		const details = await patchWithETag.call(
			this,
			`/planner/tasks/${task.id}/details`,
			(current) => {
				const detailsBody = buildDetailsBody.call(this, additionalFields, current, i, false);
				detailsChanged = Object.keys(detailsBody).length > 0;
				return detailsBody;
			},
		);

		if (detailsChanged) {
			if (additionalFields.description) {
				task.description = additionalFields.description;
			}
			task.details = details;
		}
	}

	return task;
}

async function get(this: IExecuteFunctions, i: number) {
	const taskId = getLocatorValue.call(this, 'taskId', i);
	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

	const task = (await microsoftApiRequest.call(
		this,
		'GET',
		`/planner/tasks/${taskId}`,
	)) as IDataObject;

	if (additionalFields.includeDetails) {
		task.details = await microsoftApiRequest.call(this, 'GET', `/planner/tasks/${taskId}/details`);
	}

	return task;
}

async function getAll(this: IExecuteFunctions, i: number, userCache: UserCache) {
	const filterBy = this.getNodeParameter('filterBy', i) as string;
	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

	let endpoint: string;
	if (filterBy === 'plan') {
		endpoint = `/planner/plans/${this.getNodeParameter('planId', i) as string}/tasks`;
	} else if (filterBy === 'bucket') {
		endpoint = `/planner/buckets/${getLocatorValue.call(this, 'bucketId', i)}/tasks`;
	} else if (filterBy === 'my') {
		endpoint = '/me/planner/tasks';
	} else if (filterBy === 'user') {
		const [userId] = await resolveUserIds.call(
			this,
			this.getNodeParameter('userId', i) as string,
			userCache,
		);
		endpoint = `/users/${userId}/planner/tasks`;
	} else {
		throw new NodeOperationError(this.getNode(), `Unknown filter "${filterBy}"`, {
			itemIndex: i,
		});
	}

	const qs: IDataObject = {};
	if (additionalFields.select) {
		const select = parseList(additionalFields.select);
		// percentComplete is needed to filter out completed tasks
		if (additionalFields.excludeCompleted && !select.includes('percentComplete')) {
			select.push('percentComplete');
		}
		qs.$select = select.join(',');
	}
	if (additionalFields.includeDetails) {
		qs.$expand = 'details';
	}

	let tasks = await microsoftApiRequestAllItems.call(this, 'value', 'GET', endpoint, {}, qs);

	if (additionalFields.excludeCompleted) {
		tasks = tasks.filter((task) => (task.percentComplete as number) !== 100);
	}

	return tasks;
}

async function update(this: IExecuteFunctions, i: number, userCache: UserCache) {
	const taskId = getLocatorValue.call(this, 'taskId', i);
	const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

	const body: IDataObject = {};

	if (updateFields.title) {
		body.title = updateFields.title;
	}
	if (updateFields.priority !== undefined) {
		body.priority = updateFields.priority;
	}
	if (updateFields.percentComplete !== undefined) {
		body.percentComplete = updateFields.percentComplete;
	}
	if (updateFields.bucketId) {
		body.bucketId = updateFields.bucketId;
	}
	for (const key of ['orderHint', 'assigneePriority', 'conversationThreadId']) {
		if (updateFields[key]) {
			body[key] = updateFields[key];
		}
	}

	if (updateFields.clearDueDateTime) {
		body.dueDateTime = null;
	} else {
		const dueDateTime = formatDateTime(updateFields.dueDateTime);
		if (dueDateTime) body.dueDateTime = dueDateTime;
	}

	if (updateFields.clearStartDateTime) {
		body.startDateTime = null;
	} else {
		const startDateTime = formatDateTime(updateFields.startDateTime);
		if (startDateTime) body.startDateTime = startDateTime;
	}

	const categories = buildAppliedCategories(updateFields.labelsToAdd, updateFields.labelsToRemove);
	if (Object.keys(categories).length > 0) {
		body.appliedCategories = categories;
	}

	const assignUserIds = updateFields.assignments
		? await resolveUserIds.call(this, updateFields.assignments, userCache)
		: [];
	const unassignUserIds = updateFields.removeAssignments
		? await resolveUserIds.call(this, updateFields.removeAssignments, userCache)
		: [];
	const replaceAssignments =
		updateFields.assignmentsMode === 'replace' && has(updateFields, 'assignments');

	let task = await patchWithETag.call(this, `/planner/tasks/${taskId}`, (current) => {
		const patchBody: IDataObject = { ...body };
		const assignments: IDataObject = {};

		if (replaceAssignments) {
			for (const userId of Object.keys((current.assignments as IDataObject) ?? {})) {
				if (!assignUserIds.includes(userId)) {
					assignments[userId] = null;
				}
			}
		}
		for (const userId of unassignUserIds) {
			assignments[userId] = null;
		}
		Object.assign(assignments, createAssignmentsObject(assignUserIds));

		if (Object.keys(assignments).length > 0) {
			patchBody.assignments = assignments;
		}

		return patchBody;
	});

	if (hasDetailsFields(updateFields)) {
		task = { ...task };
		task.details = await patchWithETag.call(this, `/planner/tasks/${taskId}/details`, (current) =>
			buildDetailsBody.call(this, updateFields, current, i, true),
		);
	}

	return task;
}

async function remove(this: IExecuteFunctions, i: number) {
	const taskId = getLocatorValue.call(this, 'taskId', i);
	await deleteWithETag.call(this, `/planner/tasks/${taskId}`);
	return { success: true, taskId };
}

async function getFiles(this: IExecuteFunctions, i: number) {
	const taskId = getLocatorValue.call(this, 'taskId', i);
	const details = (await microsoftApiRequest.call(
		this,
		'GET',
		`/planner/tasks/${taskId}/details`,
	)) as IDataObject;

	const references = (details.references as Record<string, IDataObject> | undefined) ?? {};
	const files = Object.keys(references).map((encodedUrl) => ({
		url: decodeReferenceKey(encodedUrl),
		alias: references[encodedUrl].alias,
		type: references[encodedUrl].type,
		previewPriority: references[encodedUrl].previewPriority,
		lastModifiedDateTime: references[encodedUrl].lastModifiedDateTime,
		lastModifiedBy: references[encodedUrl].lastModifiedBy,
	}));

	return {
		taskId,
		fileCount: files.length,
		files,
	};
}

async function getBoardFormat(this: IExecuteFunctions, i: number) {
	const taskId = getLocatorValue.call(this, 'taskId', i);
	const formatType = this.getNodeParameter('boardFormatType', i) as string;
	return (await microsoftApiRequest.call(
		this,
		'GET',
		`/planner/tasks/${taskId}/${formatType}`,
	)) as IDataObject;
}

async function updateBoardFormat(this: IExecuteFunctions, i: number) {
	const taskId = getLocatorValue.call(this, 'taskId', i);
	const formatType = this.getNodeParameter('boardFormatType', i) as string;

	const body: IDataObject = {};
	if (formatType === 'assignedToTaskBoardFormat') {
		const unassignedOrderHint = this.getNodeParameter('unassignedOrderHint', i, '') as string;
		if (unassignedOrderHint) {
			body.unassignedOrderHint = unassignedOrderHint;
		}
		const orderHints = parseJson.call(
			this,
			this.getNodeParameter('orderHintsByAssignee', i, '{}'),
			'Order Hints by Assignee (JSON)',
			i,
		) as IDataObject | undefined;
		if (orderHints && typeof orderHints === 'object' && Object.keys(orderHints).length > 0) {
			body.orderHintsByAssignee = orderHints;
		}
	} else {
		body.orderHint = this.getNodeParameter('boardOrderHint', i) as string;
	}

	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(this.getNode(), 'Nothing to update', { itemIndex: i });
	}

	return await patchWithETag.call(this, `/planner/tasks/${taskId}/${formatType}`, () => body);
}

export async function executeTask(
	this: IExecuteFunctions,
	operation: string,
	i: number,
	userCache: UserCache,
): Promise<IDataObject | IDataObject[]> {
	switch (operation) {
		case 'create':
			return await create.call(this, i, userCache);
		case 'get':
			return await get.call(this, i);
		case 'getAll':
			return await getAll.call(this, i, userCache);
		case 'update':
			return await update.call(this, i, userCache);
		case 'delete':
			return await remove.call(this, i);
		case 'getFiles':
			return await getFiles.call(this, i);
		case 'getBoardFormat':
			return await getBoardFormat.call(this, i);
		case 'updateBoardFormat':
			return await updateBoardFormat.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Unsupported task operation "${operation}"`, {
				itemIndex: i,
			});
	}
}
