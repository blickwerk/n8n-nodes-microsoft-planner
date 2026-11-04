import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	deleteWithETag,
	microsoftApiRequest,
	microsoftApiRequestAllItems,
	patchWithETag,
} from '../GenericFunctions';

async function create(this: IExecuteFunctions, i: number) {
	const planId = this.getNodeParameter('planId', i) as string;
	const name = this.getNodeParameter('name', i) as string;
	const upsert = this.getNodeParameter('upsert', i, false) as boolean;
	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

	if (upsert) {
		const buckets = await microsoftApiRequestAllItems.call(
			this,
			'value',
			'GET',
			`/planner/plans/${planId}/buckets`,
		);
		const existingBucket = buckets.find((bucket) => bucket.name === name);
		if (existingBucket) {
			return existingBucket;
		}
	}

	const body: IDataObject = { name, planId };
	if (additionalFields.orderHint) {
		body.orderHint = additionalFields.orderHint;
	}

	return (await microsoftApiRequest.call(this, 'POST', '/planner/buckets', body)) as IDataObject;
}

async function get(this: IExecuteFunctions, i: number) {
	const bucketId = this.getNodeParameter('bucketId', i) as string;
	return (await microsoftApiRequest.call(
		this,
		'GET',
		`/planner/buckets/${bucketId}`,
	)) as IDataObject;
}

async function getAll(this: IExecuteFunctions, i: number) {
	const planId = this.getNodeParameter('planId', i) as string;
	const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

	const qs: IDataObject = {};
	if (additionalFields.select) {
		qs.$select = additionalFields.select;
	}

	return await microsoftApiRequestAllItems.call(
		this,
		'value',
		'GET',
		`/planner/plans/${planId}/buckets`,
		{},
		qs,
	);
}

async function update(this: IExecuteFunctions, i: number) {
	const bucketId = this.getNodeParameter('bucketId', i) as string;
	const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

	const body: IDataObject = {};
	if (updateFields.name) {
		body.name = updateFields.name;
	}
	if (updateFields.orderHint) {
		body.orderHint = updateFields.orderHint;
	}

	return await patchWithETag.call(this, `/planner/buckets/${bucketId}`, () => body);
}

async function remove(this: IExecuteFunctions, i: number) {
	const bucketId = this.getNodeParameter('bucketId', i) as string;
	await deleteWithETag.call(this, `/planner/buckets/${bucketId}`);
	return { success: true, bucketId };
}

export async function executeBucket(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	switch (operation) {
		case 'create':
			return await create.call(this, i);
		case 'get':
			return await get.call(this, i);
		case 'getAll':
			return await getAll.call(this, i);
		case 'update':
			return await update.call(this, i);
		case 'delete':
			return await remove.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Unsupported bucket operation "${operation}"`, {
				itemIndex: i,
			});
	}
}
