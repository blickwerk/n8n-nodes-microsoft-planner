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
				name: 'Delete',
				value: 'delete',
				description: 'Delete a plan',
				action: 'Delete a plan',
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
				operation: ['get', 'update', 'delete'],
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
				description: 'Whether to include plan details (label names and members)',
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
			{
				name: 'User',
				value: 'user',
				description: 'Plans a specific user is a member of',
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
		displayName: 'User',
		name: 'userId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['plan'],
				operation: ['getAll'],
				scope: ['user'],
			},
		},
		default: '',
		required: true,
		placeholder: 'user@domain.com',
		description: 'Email address, user principal name or ID of the user',
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
				description:
					'Comma-separated list of properties to specify which fields to return (e.g. title,createdDateTime). The ID is always returned.',
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
					{
						displayName: 'Category 01 (Pink)',
						name: 'category1',
						type: 'string',
						default: '',
						description: 'Name of label category1. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 02 (Red)',
						name: 'category2',
						type: 'string',
						default: '',
						description: 'Name of label category2. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 03 (Yellow)',
						name: 'category3',
						type: 'string',
						default: '',
						description: 'Name of label category3. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 04 (Green)',
						name: 'category4',
						type: 'string',
						default: '',
						description: 'Name of label category4. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 05 (Blue)',
						name: 'category5',
						type: 'string',
						default: '',
						description: 'Name of label category5. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 06 (Purple)',
						name: 'category6',
						type: 'string',
						default: '',
						description: 'Name of label category6. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 07 (Bronze)',
						name: 'category7',
						type: 'string',
						default: '',
						description: 'Name of label category7. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 08 (Lime)',
						name: 'category8',
						type: 'string',
						default: '',
						description: 'Name of label category8. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 09 (Aqua)',
						name: 'category9',
						type: 'string',
						default: '',
						description: 'Name of label category9. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 10 (Gray)',
						name: 'category10',
						type: 'string',
						default: '',
						description: 'Name of label category10. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 11 (Silver)',
						name: 'category11',
						type: 'string',
						default: '',
						description: 'Name of label category11. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 12 (Brown)',
						name: 'category12',
						type: 'string',
						default: '',
						description: 'Name of label category12. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 13 (Cranberry)',
						name: 'category13',
						type: 'string',
						default: '',
						description: 'Name of label category13. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 14 (Orange)',
						name: 'category14',
						type: 'string',
						default: '',
						description: 'Name of label category14. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 15 (Peach)',
						name: 'category15',
						type: 'string',
						default: '',
						description: 'Name of label category15. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 16 (Marigold)',
						name: 'category16',
						type: 'string',
						default: '',
						description: 'Name of label category16. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 17 (Light Green)',
						name: 'category17',
						type: 'string',
						default: '',
						description: 'Name of label category17. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 18 (Dark Green)',
						name: 'category18',
						type: 'string',
						default: '',
						description: 'Name of label category18. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 19 (Teal)',
						name: 'category19',
						type: 'string',
						default: '',
						description: 'Name of label category19. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 20 (Light Blue)',
						name: 'category20',
						type: 'string',
						default: '',
						description: 'Name of label category20. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 21 (Dark Blue)',
						name: 'category21',
						type: 'string',
						default: '',
						description: 'Name of label category21. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 22 (Lavender)',
						name: 'category22',
						type: 'string',
						default: '',
						description: 'Name of label category22. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 23 (Plum)',
						name: 'category23',
						type: 'string',
						default: '',
						description: 'Name of label category23. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 24 (Light Gray)',
						name: 'category24',
						type: 'string',
						default: '',
						description: 'Name of label category24. Leave empty to remove the name.',
					},
					{
						displayName: 'Category 25 (Dark Gray)',
						name: 'category25',
						type: 'string',
						default: '',
						description: 'Name of label category25. Leave empty to remove the name.',
					},
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
					'JSON object mapping user IDs to booleans (e.g. {"6463a5ce-...": true}). Use false to remove a user. Only relevant for plans that are not owned by a group.',
			},
		],
	},
];
