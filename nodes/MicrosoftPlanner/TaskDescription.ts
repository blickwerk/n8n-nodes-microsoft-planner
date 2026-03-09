import { INodeProperties } from 'n8n-workflow';

// ----------------------------------
//         Task operations
// ----------------------------------
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

// ----------------------------------
//         Task fields
// ----------------------------------
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
				displayName: 'Assigned To (User IDs)',
				name: 'assignments',
				type: 'string',
				default: '',
				placeholder: 'user1@domain.com, user2@domain.com',
				description: 'Comma-separated list of user emails or IDs to assign the task to',
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
				displayName: 'Due Date Time',
				name: 'dueDateTime',
				type: 'dateTime',
				default: '',
				description: 'Due date and time for the task',
			},
			{
				displayName: 'Percent Complete',
				name: 'percentComplete',
				type: 'number',
				default: 0,
				description: 'Percentage of task completion (0-100)',
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
				displayName: 'Start Date Time',
				name: 'startDateTime',
				type: 'dateTime',
				default: '',
				description: 'Start date and time for the task',
			},
			{
				displayName: 'Attachments',
				name: 'attachmentsUi',
				placeholder: 'Add Attachments',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					attachments: {},
				},
				options: [
					{
						displayName: 'Attachments',
						name: 'attachments',
						values: [
							{
								displayName: 'Input Mode',
								name: 'mode',
								type: 'options',
								options: [
									{
										name: 'Manual',
										value: 'manual',
									},
									{
										name: 'JSON',
										value: 'json',
									},
								],
								default: 'manual',
								description: 'Choose how to provide attachments',
							},
							{
								displayName: 'Items',
								name: 'items',
								type: 'fixedCollection',
								default: {},
								placeholder: 'Add Attachment',
								displayOptions: {
									show: {
										mode: ['manual'],
									},
								},
								typeOptions: {
									multipleValues: true,
								},
								options: [
									{
										name: 'reference',
										displayName: 'Attachment',
										values: [
											{
												displayName: 'URL',
												name: 'url',
												type: 'string',
												default: '',
												required: true,
												description: 'The URL of the attachment',
											},
											{
												displayName: 'Alias',
												name: 'alias',
												type: 'string',
												default: '',
												description: 'A friendly name for the attachment',
											},
											{
												displayName: 'Type',
												name: 'type',
												type: 'options',
												options: [
													{
														name: 'Excel',
														value: 'Excel',
													},
													{
														name: 'Other',
														value: 'Other',
													},
													{
														name: 'PowerPoint',
														value: 'PowerPoint',
													},
													{
														name: 'Word',
														value: 'Word',
													},
												],
												default: 'Other',
											},
										],
									},
								],
							},
							{
								displayName: 'JSON',
								name: 'json',
								type: 'string',
								default: '',
								placeholder: '[{"url": "https://example.com", "alias": "Example", "type": "Other"}]',
								displayOptions: {
									show: {
										mode: ['json'],
									},
								},
								description: 'Add attachments as a JSON array of objects with url, alias (optional), and type (optional) keys',
							},
						],
					},
				],
				description: 'Add attachments to the task',
			},
			{
				displayName: 'Checklist',
				name: 'checklistUi',
				placeholder: 'Add Checklist',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					checklist: {},
				},
				options: [
					{
						displayName: 'Checklist',
						name: 'checklist',
						values: [
							{
								displayName: 'Input Mode',
								name: 'mode',
								type: 'options',
								options: [
									{
										name: 'Manual',
										value: 'manual',
									},
									{
										name: 'JSON',
										value: 'json',
									},
								],
								default: 'manual',
								description: 'Choose how to provide checklist items',
							},
							{
								displayName: 'Items',
								name: 'items',
								type: 'fixedCollection',
								default: {},
								placeholder: 'Add Checklist Item',
								displayOptions: {
									show: {
										mode: ['manual'],
									},
								},
								typeOptions: {
									multipleValues: true,
								},
								options: [
									{
										name: 'item',
										displayName: 'Checklist Item',
										values: [
											{
												displayName: 'ID',
												name: 'id',
												type: 'string',
												default: '',
												description: 'ID of the checklist item. Leave empty to generate a new ID.',
											},
											{
												displayName: 'Title',
												name: 'title',
												type: 'string',
												default: '',
												required: true,
												description: 'The title of the checklist item',
											},
											{
												displayName: 'Is Checked',
												name: 'isChecked',
												type: 'boolean',
												default: false,
												description: 'Whether the item is checked',
											},
										],
									},
								],
							},
							{
								displayName: 'JSON',
								name: 'json',
								type: 'string',
								default: '',
								placeholder: '[{"title": "My Item", "isChecked": false}]',
								displayOptions: {
									show: {
										mode: ['json'],
									},
								},
								description: 'Add checklist items as a JSON array of objects with title and isChecked (optional) keys',
							},
						],
					},
				],
				description: 'Add checklist items to the task',
			},
		],
	},

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
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Select Properties',
				name: 'select',
				type: 'string',
				default: '',
				description: 'Comma-separated list of properties to specify which fields to return (e.g. id,title,percentComplete)',
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
				displayName: 'Assigned To (User IDs)',
				name: 'assignments',
				type: 'string',
				default: '',
				placeholder: 'user1@domain.com, user2@domain.com',
				description: 'Comma-separated list of user emails or IDs to assign the task to',
			},
			{
				displayName: 'Bucket ID',
				name: 'bucketId',
				type: 'string',
				default: '',
				description: 'Move task to a different bucket',
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
				displayName: 'Due Date Time',
				name: 'dueDateTime',
				type: 'dateTime',
				default: '',
				description: 'Due date and time for the task',
			},
			{
				displayName: 'Percent Complete',
				name: 'percentComplete',
				type: 'number',
				default: 0,
				description: 'Percentage of task completion (0-100)',
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
				displayName: 'Start Date Time',
				name: 'startDateTime',
				type: 'dateTime',
				default: '',
				description: 'Start date and time for the task',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title of the task',
			},
			{
				displayName: 'Attachments',
				name: 'attachmentsUi',
				placeholder: 'Add Attachments',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					attachments: {},
				},
				options: [
					{
						displayName: 'Attachments',
						name: 'attachments',
						values: [
							{
								displayName: 'Input Mode',
								name: 'mode',
								type: 'options',
								options: [
									{
										name: 'Manual',
										value: 'manual',
									},
									{
										name: 'JSON',
										value: 'json',
									},
								],
								default: 'manual',
								description: 'Choose how to provide attachments',
							},
							{
								displayName: 'Items',
								name: 'items',
								type: 'fixedCollection',
								default: {},
								placeholder: 'Add Attachment',
								displayOptions: {
									show: {
										mode: ['manual'],
									},
								},
								typeOptions: {
									multipleValues: true,
								},
								options: [
									{
										name: 'reference',
										displayName: 'Attachment',
										values: [
											{
												displayName: 'URL',
												name: 'url',
												type: 'string',
												default: '',
												required: true,
												description: 'The URL of the attachment',
											},
											{
												displayName: 'Alias',
												name: 'alias',
												type: 'string',
												default: '',
												description: 'A friendly name for the attachment',
											},
											{
												displayName: 'Type',
												name: 'type',
												type: 'options',
												options: [
													{
														name: 'Excel',
														value: 'Excel',
													},
													{
														name: 'Other',
														value: 'Other',
													},
													{
														name: 'PowerPoint',
														value: 'PowerPoint',
													},
													{
														name: 'Word',
														value: 'Word',
													},
												],
												default: 'Other',
											},
										],
									},
								],
							},
							{
								displayName: 'JSON',
								name: 'json',
								type: 'string',
								default: '',
								placeholder: '[{"url": "https://example.com", "alias": "Example", "type": "Other"}]',
								displayOptions: {
									show: {
										mode: ['json'],
									},
								},
								description: 'Add attachments as a JSON array of objects with url, alias (optional), and type (optional) keys',
							},
							{
								displayName: 'Operation Mode',
								name: 'operationMode',
								type: 'options',
								options: [
									{
										name: 'Append',
										value: 'append',
										description: 'Appends the new given attachment items to the existing ones, potentially updating existing ones with matching ids',
									},
									{
										name: 'Replace',
										value: 'replace',
										description: 'Sets the given attachment items and replaces potentially existing ones',
									},
								],
								default: 'append',
								description: 'Choose how to update the attachments',
							},
						],
					},
				],
				description: 'Add attachments to the task',
			},
			{
				displayName: 'Checklist',
				name: 'checklistUi',
				placeholder: 'Add Checklist',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					checklist: {},
				},
				options: [
					{
						displayName: 'Checklist',
						name: 'checklist',
						values: [
							{
								displayName: 'Input Mode',
								name: 'mode',
								type: 'options',
								options: [
									{
										name: 'Manual',
										value: 'manual',
									},
									{
										name: 'JSON',
										value: 'json',
									},
								],
								default: 'manual',
								description: 'Choose how to provide checklist items',
							},
							{
								displayName: 'Items',
								name: 'items',
								type: 'fixedCollection',
								default: {},
								placeholder: 'Add Checklist Item',
								displayOptions: {
									show: {
										mode: ['manual'],
									},
								},
								typeOptions: {
									multipleValues: true,
								},
								options: [
									{
										name: 'item',
										displayName: 'Checklist Item',
										values: [
											{
												displayName: 'ID',
												name: 'id',
												type: 'string',
												default: '',
												description: 'ID of the checklist item. Leave empty to generate a new ID.',
											},
											{
												displayName: 'Title',
												name: 'title',
												type: 'string',
												default: '',
												required: true,
												description: 'The title of the checklist item',
											},
											{
												displayName: 'Is Checked',
												name: 'isChecked',
												type: 'boolean',
												default: false,
												description: 'Whether the item is checked',
											},
										],
									},
								],
							},
							{
								displayName: 'JSON',
								name: 'json',
								type: 'string',
								default: '',
								placeholder: '[{"title": "My Item", "isChecked": false}]',
								displayOptions: {
									show: {
										mode: ['json'],
									},
								},
								description: 'Add checklist items as a JSON array of objects with title and isChecked (optional) keys',
							},
							{
								displayName: 'Operation Mode',
								name: 'operationMode',
								type: 'options',
								options: [
									{
										name: 'Append',
										value: 'append',
										description: 'Appends the new given checklist items to the existing ones, potentially updating existing ones with matching ids',
									},
									{
										name: 'Replace',
										value: 'replace',
										description: 'Sets the given checklist items and replaces potentially existing ones',
									},
								],
								default: 'append',
								description: 'Choose how to update the checklist',
							},
						],
					},
				],
				description: 'Add checklist items to the task',
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
