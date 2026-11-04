import type { INodeProperties } from 'n8n-workflow';
import {
	assigneePriorityField,
	attachmentsField,
	checklistField,
	conversationThreadIdField,
	labelsField,
	orderHintField,
	percentCompleteField,
	previewTypeField,
	priorityField,
} from './SharedFields';

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
				name: 'Delete',
				value: 'delete',
				description: 'Delete a task',
				action: 'Delete a task',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a task',
				action: 'Get a task',
			},
			{
				name: 'Get Board Format',
				value: 'getBoardFormat',
				description: 'Get the ordering of a task in one of the board views',
				action: 'Get the board format of a task',
			},
			{
				name: 'Get Files',
				value: 'getFiles',
				description: 'Get files attached to a task',
				action: 'Get files from a task',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many tasks of a plan, a bucket, the current user or another user',
				action: 'Get many tasks',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a task',
				action: 'Update a task',
			},
			{
				name: 'Update Board Format',
				value: 'updateBoardFormat',
				description: 'Change the ordering of a task in one of the board views',
				action: 'Update the board format of a task',
			},
		],
		default: 'create',
	},
];

const taskIdField: INodeProperties = {
	displayName: 'Task',
	name: 'taskId',
	type: 'resourceLocator',
	default: { mode: 'id', value: '' },
	required: true,
	displayOptions: {
		show: {
			resource: ['task'],
			operation: ['get', 'delete', 'update', 'getFiles', 'getBoardFormat', 'updateBoardFormat'],
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
};

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
		placeholder: 'e.g. xqQg5FS2LkCp935s-FIFm2QAFkHM',
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
			assigneePriorityField,
			{
				displayName: 'Assigned To (User IDs)',
				name: 'assignments',
				type: 'string',
				default: '',
				placeholder: 'user1@domain.com, user2@domain.com',
				description: 'Comma-separated list of user emails or IDs to assign the task to',
			},
			attachmentsField(false),
			checklistField(false),
			conversationThreadIdField,
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
			labelsField('Label Names or IDs', 'appliedCategories'),
			orderHintField,
			percentCompleteField,
			previewTypeField,
			priorityField,
			{
				displayName: 'Start Date Time',
				name: 'startDateTime',
				type: 'dateTime',
				default: '',
				description: 'Start date and time for the task',
			},
		],
	},

	// ----------------------------------
	//   task:get / update / delete / getFiles / board formats
	// ----------------------------------
	taskIdField,
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
				description: 'Whether to include task details (description, checklist, attachments, etc.)',
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
				description: 'All tasks of a plan',
			},
			{
				name: 'Bucket',
				value: 'bucket',
				description: 'All tasks of a bucket',
			},
			{
				name: 'My Tasks',
				value: 'my',
				description: 'Tasks assigned to the authenticated user',
			},
			{
				name: 'User',
				value: 'user',
				description: 'Tasks assigned to a specific user',
			},
		],
		default: 'plan',
		description: 'Which set of tasks to return',
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
		placeholder: 'e.g. xqQg5FS2LkCp935s-FIFm2QAFkHM',
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
		displayName: 'User',
		name: 'userId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAll'],
				filterBy: ['user'],
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
				resource: ['task'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Exclude Completed Tasks',
				name: 'excludeCompleted',
				type: 'boolean',
				default: false,
				description: 'Whether to leave out tasks that are 100% complete',
			},
			{
				displayName: 'Include Details',
				name: 'includeDetails',
				type: 'boolean',
				default: false,
				description:
					'Whether to include task details (description, checklist, attachments) for every task',
			},
			{
				displayName: 'Select Properties',
				name: 'select',
				type: 'string',
				default: '',
				description:
					'Comma-separated list of properties to specify which fields to return (e.g. title,percentComplete). The ID is always returned.',
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
			assigneePriorityField,
			{
				displayName: 'Assigned To (User IDs)',
				name: 'assignments',
				type: 'string',
				default: '',
				placeholder: 'user1@domain.com, user2@domain.com',
				description: 'Comma-separated list of user emails or IDs to assign the task to',
			},
			{
				displayName: 'Assignment Mode',
				name: 'assignmentsMode',
				type: 'options',
				options: [
					{
						name: 'Append',
						value: 'append',
						description: 'Add the given users to the existing assignees',
					},
					{
						name: 'Replace',
						value: 'replace',
						description: 'The given users become the only assignees',
					},
				],
				default: 'append',
				description: 'How "Assigned To" is applied to the existing assignees',
			},
			attachmentsField(true),
			{
				displayName: 'Bucket ID',
				name: 'bucketId',
				type: 'string',
				default: '',
				description: 'Move task to a different bucket',
			},
			checklistField(true),
			conversationThreadIdField,
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				description: 'Description of the task. Leave empty to clear the description.',
			},
			{
				displayName: 'Due Date Time',
				name: 'dueDateTime',
				type: 'dateTime',
				default: '',
				description: 'Due date and time for the task',
			},
			labelsField('Label Names or IDs to Add', 'labelsToAdd'),
			labelsField('Label Names or IDs to Remove', 'labelsToRemove'),
			orderHintField,
			percentCompleteField,
			previewTypeField,
			priorityField,
			{
				displayName: 'Remove Assignees',
				name: 'removeAssignments',
				type: 'string',
				default: '',
				placeholder: 'user1@domain.com, user2@domain.com',
				description: 'Comma-separated list of user emails or IDs to unassign from the task',
			},
			{
				displayName: 'Remove Attachments (URLs)',
				name: 'removeAttachmentUrls',
				type: 'string',
				default: '',
				description: 'Comma-separated list of attachment URLs to remove from the task',
			},
			{
				displayName: 'Remove Checklist Items (IDs)',
				name: 'removeChecklistItemIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of checklist item IDs to remove from the task',
			},
			{
				displayName: 'Remove Due Date',
				name: 'clearDueDateTime',
				type: 'boolean',
				default: false,
				description: 'Whether to remove the due date of the task',
			},
			{
				displayName: 'Remove Start Date',
				name: 'clearStartDateTime',
				type: 'boolean',
				default: false,
				description: 'Whether to remove the start date of the task',
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
		],
	},

	// ----------------------------------
	//   task:getBoardFormat / updateBoardFormat
	// ----------------------------------
	{
		displayName: 'Board View',
		name: 'boardFormatType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getBoardFormat', 'updateBoardFormat'],
			},
		},
		options: [
			{
				name: 'Assigned To',
				value: 'assignedToTaskBoardFormat',
				description: 'Board grouped by assignee',
			},
			{
				name: 'Bucket',
				value: 'bucketTaskBoardFormat',
				description: 'Board grouped by bucket',
			},
			{
				name: 'Progress',
				value: 'progressTaskBoardFormat',
				description: 'Board grouped by progress',
			},
		],
		default: 'bucketTaskBoardFormat',
		description: 'The board view whose task ordering should be used',
	},
	{
		displayName: 'Order Hint',
		name: 'boardOrderHint',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['updateBoardFormat'],
				boardFormatType: ['bucketTaskBoardFormat', 'progressTaskBoardFormat'],
			},
		},
		default: '',
		required: true,
		description: 'Order hint for the task in this board view (e.g. " !" to move it to the top)',
	},
	{
		displayName: 'Unassigned Order Hint',
		name: 'unassignedOrderHint',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['updateBoardFormat'],
				boardFormatType: ['assignedToTaskBoardFormat'],
			},
		},
		default: '',
		description: 'Order hint for the task in the "Unassigned" column',
	},
	{
		displayName: 'Order Hints by Assignee (JSON)',
		name: 'orderHintsByAssignee',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['updateBoardFormat'],
				boardFormatType: ['assignedToTaskBoardFormat'],
			},
		},
		default: '{}',
		description:
			'JSON object mapping user IDs to order hints (e.g. {"6463a5ce-2119-4198-9f2a-628761df4a62": " !"})',
	},
];
