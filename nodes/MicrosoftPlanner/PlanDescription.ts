import { INodeProperties } from 'n8n-workflow';

// ----------------------------------
//         Plan operations
// ----------------------------------
export const planOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['plan'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new plan',
				action: 'Create a plan',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a plan',
				action: 'Get a plan',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many plans',
				action: 'Get many plans',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a plan',
				action: 'Update a plan',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a plan',
				action: 'Delete a plan',
			},
		],
		default: 'getAll',
	},
];

// ----------------------------------
//         Plan fields
// ----------------------------------
export const planFields: INodeProperties[] = [
	// ----------------------------------
	//         plan:create
	// ----------------------------------
	{
		displayName: 'Owner Group',
		name: 'owner',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: ['create'],
			},
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getGroups',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 02bd9fd6-8f93-4758-87c3-1fb73740a315',
			},
		],
		description: 'The Microsoft 365 group that will own the plan',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Title of the plan',
	},

	// ----------------------------------
	//         plan:get
	// ----------------------------------
	{
		displayName: 'Plan ID',
		name: 'planId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: [
					'get',
					'update',
					'delete',
				],
			},
		},
		default: '',
		description: 'The ID of the plan',
		placeholder: 'e.g. xqQg5FS2LkCp935s-FIFm2QAFkHM',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: ['get'],
			},
		},
		options: [
			{
				displayName: 'Include Details',
				name: 'includeDetails',
				type: 'boolean',
				default: false,
				description: 'Whether to include plan details (labels, metadata, etc.)',
			},
		],
	},

	// ----------------------------------
	//         plan:getAll
	// ----------------------------------
	{
		displayName: 'Scope',
		name: 'scope',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				name: 'My Plans',
				value: 'my',
				description: 'Plans the current user is a member of',
			},
			{
				name: 'Group',
				value: 'group',
				description: 'Plans that belong to a specific Microsoft 365 group (owner)',
			},
		],
		default: 'my',
		description: 'Which set of plans to list',
	},
	{
		displayName: 'Group ID',
		name: 'groupId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: ['getAll'],
				scope: ['group'],
			},
		},
		default: '',
		required: true,
		description: 'The Microsoft 365 group ID whose plans to list (owner)',
		placeholder: 'e.g. 6ff15978-94d4-414f-a497-295a245718bc',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Select Properties',
				name: 'select',
				type: 'string',
				default: '',
				description: 'Comma-separated list of properties to specify which fields to return (e.g. id,title)',
			},
		],
	},

	// ----------------------------------
	//         plan:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title of the plan',
			},
			{
				displayName: 'Category Descriptions',
				name: 'categoryDescriptions',
				type: 'collection',
				placeholder: 'Add Category',
				default: {},
				description: 'Labels for up to 25 categories on the plan',
				options: [
					{ displayName: 'Category 1', name: 'category1', type: 'string', default: '', description: 'Label for category1' },
					{ displayName: 'Category 2', name: 'category2', type: 'string', default: '', description: 'Label for category2' },
					{ displayName: 'Category 3', name: 'category3', type: 'string', default: '', description: 'Label for category3' },
					{ displayName: 'Category 4', name: 'category4', type: 'string', default: '', description: 'Label for category4' },
					{ displayName: 'Category 5', name: 'category5', type: 'string', default: '', description: 'Label for category5' },
					{ displayName: 'Category 6', name: 'category6', type: 'string', default: '', description: 'Label for category6' },
					{ displayName: 'Category 7', name: 'category7', type: 'string', default: '', description: 'Label for category7' },
					{ displayName: 'Category 8', name: 'category8', type: 'string', default: '', description: 'Label for category8' },
					{ displayName: 'Category 9', name: 'category9', type: 'string', default: '', description: 'Label for category9' },
					{ displayName: 'Category 10', name: 'category10', type: 'string', default: '', description: 'Label for category10' },
					{ displayName: 'Category 11', name: 'category11', type: 'string', default: '', description: 'Label for category11' },
					{ displayName: 'Category 12', name: 'category12', type: 'string', default: '', description: 'Label for category12' },
					{ displayName: 'Category 13', name: 'category13', type: 'string', default: '', description: 'Label for category13' },
					{ displayName: 'Category 14', name: 'category14', type: 'string', default: '', description: 'Label for category14' },
					{ displayName: 'Category 15', name: 'category15', type: 'string', default: '', description: 'Label for category15' },
					{ displayName: 'Category 16', name: 'category16', type: 'string', default: '', description: 'Label for category16' },
					{ displayName: 'Category 17', name: 'category17', type: 'string', default: '', description: 'Label for category17' },
					{ displayName: 'Category 18', name: 'category18', type: 'string', default: '', description: 'Label for category18' },
					{ displayName: 'Category 19', name: 'category19', type: 'string', default: '', description: 'Label for category19' },
					{ displayName: 'Category 20', name: 'category20', type: 'string', default: '', description: 'Label for category20' },
					{ displayName: 'Category 21', name: 'category21', type: 'string', default: '', description: 'Label for category21' },
					{ displayName: 'Category 22', name: 'category22', type: 'string', default: '', description: 'Label for category22' },
					{ displayName: 'Category 23', name: 'category23', type: 'string', default: '', description: 'Label for category23' },
					{ displayName: 'Category 24', name: 'category24', type: 'string', default: '', description: 'Label for category24' },
					{ displayName: 'Category 25', name: 'category25', type: 'string', default: '', description: 'Label for category25' },
				],
			},
			{
				displayName: 'Shared With (plannerUserIds JSON)',
				name: 'sharedWithJson',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				description:
					'JSON object mapping user IDs to booleans (e.g. {"6463a5ce-...": true})',
			},
		],
	},

];
