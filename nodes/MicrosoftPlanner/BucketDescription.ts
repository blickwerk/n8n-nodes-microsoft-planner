import { INodeProperties } from 'n8n-workflow';

// ----------------------------------
//         Bucket operations
// ----------------------------------
export const bucketOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['bucket'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new bucket in a plan',
				action: 'Create a bucket',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a bucket',
				action: 'Get a bucket',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many buckets in a plan',
				action: 'Get many buckets',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a bucket',
				action: 'Update a bucket',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a bucket',
				action: 'Delete a bucket',
			},
		],
		default: 'getAll',
	},
];

// ----------------------------------
//         Bucket fields
// ----------------------------------
export const bucketFields: INodeProperties[] = [
	// ----------------------------------
	//         bucket:create
	// ----------------------------------
	{
		displayName: 'Plan ID',
		name: 'planId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bucket'],
				operation: ['create', 'getAll'],
			},
		},
		default: '',
		description: 'The ID of the plan this bucket belongs to',
	},

	// ----------------------------------
	//         bucket:getAll
	// ----------------------------------
	// No Return All / Limit options; Graph does not support $top/$limit for Planner.
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bucket'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name of the bucket',
	},
	{
		displayName: 'Upsert',
		name: 'upsert',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['bucket'],
				operation: ['create'],
			},
		},
		description: 'Whether to return the existing bucket if one with the same name already exists in the plan',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['bucket'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Select Properties',
				name: 'select',
				type: 'string',
				default: '',
				description: 'Comma-separated list of properties to specify which fields to return (e.g. id,name)',
			},
		],
	},

	// ----------------------------------
	//         bucket:get / bucket:update / bucket:delete
	// ----------------------------------
	{
		displayName: 'Bucket ID',
		name: 'bucketId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bucket'],
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
		description: 'The ID of the bucket',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['bucket'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name of the bucket',
			},
			{
				displayName: 'Order Hint',
				name: 'orderHint',
				type: 'string',
				default: '',
				description: 'Used to sort buckets in the plan',
			},
		],
	},
];
