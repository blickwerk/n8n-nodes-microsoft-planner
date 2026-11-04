import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	deleteWithETag,
	GRAPH_BASE_URL,
	microsoftApiRequest,
	microsoftApiRequestAllItems,
	parseJson,
	patchWithETag,
	resolveUserIds,
} from '../GenericFunctions';

type UserCache = Map<string, string>;

async function create(this: IExecuteFunctions, i: number) {
	const groupId = this.getNodeParameter('owner', i, '', { extractValue: true }) as string;
	const title = this.getNodeParameter('title', i) as string;

	// "owner" is deprecated in Graph v1.0, plans are created inside a container (group)
	const body: IDataObject = {
		container: {
			url: `${GRAPH_BASE_URL}/groups/${groupId}`,
		},
		title,
	};

	return (await microsoftApiRequest.call(this, 'POST', '/planner/plans', body)) as IDataObject;
}

async function get(this: IExecuteFunctions, i: number) {
	const planId = this.getNodeParameter('planId', i) as string;
	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

	const plan = (await microsoftApiRequest.call(
		this,
		'GET',
		`/planner/plans/${planId}`,
	)) as IDataObject;

	if (additionalFields.includeDetails) {
		plan.details = await microsoftApiRequest.call(this, 'GET', `/planner/plans/${planId}/details`);
	}

	return plan;
}

async function getAll(this: IExecuteFunctions, i: number, userCache: UserCache) {
	const scope = this.getNodeParameter('scope', i) as string;

	let endpoint: string;
	if (scope === 'my') {
		endpoint = '/me/planner/plans';
	} else if (scope === 'group') {
		endpoint = `/groups/${this.getNodeParameter('groupId', i) as string}/planner/plans`;
	} else if (scope === 'user') {
		const [userId] = await resolveUserIds.call(
			this,
			this.getNodeParameter('userId', i) as string,
			userCache,
		);
		endpoint = `/users/${userId}/planner/plans`;
	} else {
		throw new NodeOperationError(this.getNode(), 'Invalid scope for plan getAll operation', {
			itemIndex: i,
		});
	}

	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
	const qs: IDataObject = {};
	if (additionalFields.select) {
		qs.$select = additionalFields.select;
	}

	return await microsoftApiRequestAllItems.call(this, 'value', 'GET', endpoint, {}, qs);
}

async function update(this: IExecuteFunctions, i: number) {
	const planId = this.getNodeParameter('planId', i) as string;
	const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

	const body: IDataObject = {};
	if (updateFields.title) {
		body.title = updateFields.title;
	}

	const plan = await patchWithETag.call(this, `/planner/plans/${planId}`, () => body);

	const detailsBody: IDataObject = {};
	if (updateFields.categoryDescriptions) {
		const categories = updateFields.categoryDescriptions as IDataObject;
		const cleanedCategories: IDataObject = {};
		for (const key of Object.keys(categories)) {
			const value = categories[key] as string | null | undefined;
			// Empty string in the UI means "unset" -> send null to Graph
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
		const sharedWith = parseJson.call(
			this,
			updateFields.sharedWithJson,
			'Shared With (plannerUserIds JSON)',
			i,
		) as IDataObject;
		if (!sharedWith || typeof sharedWith !== 'object' || Array.isArray(sharedWith)) {
			throw new NodeOperationError(
				this.getNode(),
				'Shared With must be a JSON object mapping user IDs to true/false',
				{ itemIndex: i },
			);
		}
		if (Object.keys(sharedWith).length > 0) {
			detailsBody.sharedWith = sharedWith;
		}
	}

	if (Object.keys(detailsBody).length === 0) {
		return plan;
	}

	return {
		...plan,
		details: await patchWithETag.call(this, `/planner/plans/${planId}/details`, () => detailsBody),
	};
}

async function remove(this: IExecuteFunctions, i: number) {
	const planId = this.getNodeParameter('planId', i) as string;
	await deleteWithETag.call(this, `/planner/plans/${planId}`);
	return { success: true, planId };
}

export async function executePlan(
	this: IExecuteFunctions,
	operation: string,
	i: number,
	userCache: UserCache,
): Promise<IDataObject | IDataObject[]> {
	switch (operation) {
		case 'create':
			return await create.call(this, i);
		case 'get':
			return await get.call(this, i);
		case 'getAll':
			return await getAll.call(this, i, userCache);
		case 'update':
			return await update.call(this, i);
		case 'delete':
			return await remove.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Unsupported plan operation "${operation}"`, {
				itemIndex: i,
			});
	}
}
