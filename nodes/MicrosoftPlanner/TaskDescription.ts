import { INodeProperties } from 'n8n-workflow';

export const taskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['task'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new task',
				action: 'Create a task',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a task',
				action: 'Get a task',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many tasks',
				action: 'Get many tasks',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a task',
				action: 'Update a task',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a task',
				action: 'Delete a task',
			},
			{
				name: 'Get Files',
				value: 'getFiles',
				description: 'Get files attached to a task',
				action: 'Get files from a task',
			},
		],
		default: 'create',
	},
];

export const taskFields: INodeProperties[] = [
	// ----------------------------------
	//         task:create
	// ----------------------------------
	{
		displayName: 'Plan ID',
		name: 'planId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'The ID of the plan to which the task belongs',
		placeholder: 'Enter Plan ID',
	},
	{
		displayName: 'Bucket',
		name: 'bucketId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getBuckets',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. FTmIDbes6UyAjh1k0suR3JgACHty',
			},
		],
		description: 'The bucket to which the task belongs',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Title of the task',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				description: 'Description of the task',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{
						name: 'Urgent',
						value: 1,
					},
					{
						name: 'Important',
						value: 3,
					},
					{
						name: 'Medium',
						value: 5,
					},
					{
						name: 'Low',
						value: 9,
					},
				],
				default: 5,
				description: 'Priority of the task',
			},
			{
				displayName: 'Assigned To (User IDs)',
				name: 'assignments',
				type: 'string',
				default: '',
				placeholder: 'user1@domain.com, user2@domain.com',
				description: 'Comma-separated list of user emails or IDs to assign the task to',
			},
			{
				displayName: 'Due Date Time',
				name: 'dueDateTime',
				type: 'dateTime',
				default: '',
				description: 'Due date and time for the task',
			},
			{
				displayName: 'Start Date Time',
				name: 'startDateTime',
				type: 'dateTime',
				default: '',
				description: 'Start date and time for the task',
			},
			{
				displayName: 'Percent Complete',
				name: 'percentComplete',
				type: 'number',
				default: 0,
				description: 'Percentage of task completion (0-100)',
			},
		],
	},

	// ----------------------------------
	//         task:get
	// ----------------------------------
	{
		displayName: 'Task',
		name: 'taskId',
		type: 'resourceLocator',
		default: { mode: 'id', value: '' },
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['get', 'delete', 'update'],
			},
		},
		modes: [
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. rz1EH6N_a0aLpRm-2QifxZgAF5OL',
			},
		],
		description: 'The task to operate on',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['get'],
			},
		},
		options: [
			{
				displayName: 'Include Details',
				name: 'includeDetails',
				type: 'boolean',
				default: false,
				description: 'Whether to include task details (description, checklist, etc.)',
			},
		],
	},

	// ----------------------------------
	//         task:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAll'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 500,
		},
		default: 100,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filter By',
		name: 'filterBy',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				name: 'Plan',
				value: 'plan',
			},
			{
				name: 'Bucket',
				value: 'bucket',
			},
		],
		default: 'plan',
		description: 'Choose whether to filter by Plan or Bucket',
	},
	{
		displayName: 'Plan ID',
		name: 'planId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAll'],
				filterBy: ['plan', 'bucket'],
			},
		},
		default: '',
		required: true,
		description: 'The Plan ID to filter tasks',
		placeholder: 'Enter Plan ID',
	},
	{
		displayName: 'Bucket',
		name: 'bucketId',
		type: 'resourceLocator',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAll'],
				filterBy: ['bucket'],
			},
		},
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The Bucket to filter tasks',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getBuckets',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. FTmIDbes6UyAjh1k0suR3JgACHty',
			},
		],
	},

	// ----------------------------------
	//         task:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title of the task',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				description: 'Description of the task',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{
						name: 'Urgent',
						value: 0,
					},
					{
						name: 'Important',
						value: 1,
					},
					{
						name: 'Medium',
						value: 5,
					},
					{
						name: 'Low',
						value: 9,
					},
				],
				default: 5,
				description: 'Priority of the task',
			},
			{
				displayName: 'Assigned To (User IDs)',
				name: 'assignments',
				type: 'string',
				default: '',
				placeholder: 'user1@domain.com, user2@domain.com',
				description: 'Comma-separated list of user emails or IDs to assign the task to',
			},
			{
				displayName: 'Due Date Time',
				name: 'dueDateTime',
				type: 'dateTime',
				default: '',
				description: 'Due date and time for the task',
			},
			{
				displayName: 'Start Date Time',
				name: 'startDateTime',
				type: 'dateTime',
				default: '',
				description: 'Start date and time for the task',
			},
			{
				displayName: 'Percent Complete',
				name: 'percentComplete',
				type: 'number',
				default: 0,
				description: 'Percentage of task completion (0-100)',
			},
			{
				displayName: 'Bucket ID',
				name: 'bucketId',
				type: 'string',
				default: '',
				description: 'Move task to a different bucket',
			},
		],
	},
	// ----------------------------------
	//         task:getFiles
	// ----------------------------------
	{
		displayName: 'Task',
		name: 'taskId',
		type: 'resourceLocator',
		default: { mode: 'id', value: '' },
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getFiles'],
			},
		},
		modes: [
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. rz1EH6N_a0aLpRm-2QifxZgAF5OL',
			},
		],
		description: 'The Task ID to get files from',
	},
];
