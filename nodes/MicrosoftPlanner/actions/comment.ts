import type { IDataObject, IExecuteFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import {
	formatCommentContent,
	getPlanGroupId,
	microsoftApiRequest,
	microsoftApiRequestAllItems,
	patchWithETag,
} from '../GenericFunctions';

function getTaskId(this: IExecuteFunctions, i: number): string {
	return this.getNodeParameter('taskId', i, '', { extractValue: true }) as string;
}

/** Starts a new conversation thread in the group and links it to the task. */
async function startThread(
	this: IExecuteFunctions,
	groupId: string,
	task: IDataObject,
	post: IDataObject,
): Promise<IDataObject> {
	// POST /groups/{id}/threads creates conversation, thread and first post in one call
	const thread = (await microsoftApiRequest.call(this, 'POST', `/groups/${groupId}/threads`, {
		topic: `Comments on task "${task.title as string}"`,
		posts: [post],
	})) as IDataObject;

	await patchWithETag.call(this, `/planner/tasks/${task.id as string}`, () => ({
		conversationThreadId: thread.id,
	}));

	return thread;
}

async function create(this: IExecuteFunctions, i: number) {
	const taskId = getTaskId.call(this, i);
	const content = this.getNodeParameter('content', i) as string;
	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
	const contentType = (additionalFields.contentType as string) || 'text';

	const task = (await microsoftApiRequest.call(
		this,
		'GET',
		`/planner/tasks/${taskId}`,
	)) as IDataObject;
	const groupId = await getPlanGroupId.call(this, task.planId as string);
	const post = formatCommentContent(content, contentType);

	let threadId = task.conversationThreadId as string | undefined;
	let conversationId: string | undefined;
	let newThread = false;

	if (threadId) {
		try {
			await microsoftApiRequest.call(this, 'POST', `/groups/${groupId}/threads/${threadId}/reply`, {
				post,
			});
		} catch (error) {
			// The linked thread was deleted -> start a new one
			if ((error as NodeApiError).httpCode !== '404') {
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
			threadId = undefined;
		}
	}

	if (!threadId) {
		const thread = await startThread.call(this, groupId, task, post);
		threadId = thread.id as string;
		conversationId = thread.conversationId as string | undefined;
		newThread = true;
	}

	return {
		success: true,
		taskId,
		groupId,
		...(conversationId ? { conversationId } : {}),
		threadId,
		newThread,
		content,
	};
}

async function getAll(this: IExecuteFunctions, i: number) {
	const taskId = getTaskId.call(this, i);
	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

	const task = (await microsoftApiRequest.call(
		this,
		'GET',
		`/planner/tasks/${taskId}`,
	)) as IDataObject;

	let comments: IDataObject[] = [];

	if (task.conversationThreadId) {
		const groupId = await getPlanGroupId.call(this, task.planId as string);
		const qs: IDataObject = {};
		if (additionalFields.select) {
			qs.$select = additionalFields.select;
		}

		const posts = await microsoftApiRequestAllItems.call(
			this,
			'value',
			'GET',
			`/groups/${groupId}/threads/${task.conversationThreadId as string}/posts`,
			{},
			qs,
		);

		comments = posts.map((post) => ({
			id: post.id,
			content: post.body,
			from: post.from,
			createdDateTime: post.createdDateTime,
			lastModifiedDateTime: post.lastModifiedDateTime,
		}));
	}

	if (additionalFields.splitIntoItems) {
		return comments.map((comment) => ({ taskId, ...comment }));
	}

	return {
		taskId,
		comments,
		commentCount: comments.length,
	};
}

export async function executeComment(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	switch (operation) {
		case 'create':
			return await create.call(this, i);
		case 'getAll':
			return await getAll.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Unsupported comment operation "${operation}"`, {
				itemIndex: i,
			});
	}
}
