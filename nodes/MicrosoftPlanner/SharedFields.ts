import type { INodeProperties } from 'n8n-workflow';

const operationModeField = (subject: string): INodeProperties => ({
	displayName: 'Operation Mode',
	name: 'operationMode',
	type: 'options',
	options: [
		{
			name: 'Append',
			value: 'append',
			description: `Appends the given ${subject} to the existing ones, updating existing ones with matching IDs`,
		},
		{
			name: 'Replace',
			value: 'replace',
			description: `Removes all existing ${subject} and sets the given ones`,
		},
	],
	default: 'append',
	description: `Choose how to update the ${subject}`,
});

const inputModeField = (subject: string): INodeProperties => ({
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
	description: `Choose how to provide ${subject}`,
});

export function attachmentsField(isUpdate: boolean): INodeProperties {
	const values: INodeProperties[] = [
		inputModeField('attachments'),
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
								{ name: 'Excel', value: 'Excel' },
								{ name: 'Other', value: 'Other' },
								{ name: 'PowerPoint', value: 'PowerPoint' },
								{ name: 'Word', value: 'Word' },
							],
							default: 'Other',
						},
						{
							displayName: 'Preview Priority',
							name: 'previewPriority',
							type: 'string',
							default: '',
							description:
								'Order hint used to determine which reference is shown as task preview (optional)',
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
			description:
				'Attachments as a JSON array of objects with URL, alias (optional), type (optional) and previewPriority (optional) keys',
		},
	];

	if (isUpdate) {
		values.push(operationModeField('attachments'));
	}

	return {
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
				values,
			},
		],
		description: 'Add attachments (external references / links) to the task',
	};
}

export function checklistField(isUpdate: boolean): INodeProperties {
	const values: INodeProperties[] = [
		inputModeField('checklist items'),
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
						{
							displayName: 'Order Hint',
							name: 'orderHint',
							type: 'string',
							default: '',
							description: 'Order hint used to sort the checklist item (optional)',
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
			description:
				'Checklist items as a JSON array of objects with title, ID (optional), isChecked (optional) and orderHint (optional) keys',
		},
	];

	if (isUpdate) {
		values.push(operationModeField('checklist items'));
	}

	return {
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
				values,
			},
		],
		description: 'Add checklist items to the task (Planner allows up to 20 per task)',
	};
}

export const previewTypeField: INodeProperties = {
	displayName: 'Preview Type',
	name: 'previewType',
	type: 'options',
	options: [
		{ name: 'Automatic', value: 'automatic' },
		{ name: 'Checklist', value: 'checklist' },
		{ name: 'Description', value: 'description' },
		{ name: 'No Preview', value: 'noPreview' },
		{ name: 'Reference', value: 'reference' },
	],
	default: 'automatic',
	description: 'What is shown on the task card in the board view',
};

export const assigneePriorityField: INodeProperties = {
	displayName: 'Assignee Priority',
	name: 'assigneePriority',
	type: 'string',
	default: '',
	description: 'Order hint used to sort the task in the "My Tasks" list view',
};

export const orderHintField: INodeProperties = {
	displayName: 'Order Hint',
	name: 'orderHint',
	type: 'string',
	default: '',
	description: 'Order hint used to sort the task in list view (see Microsoft Planner order hints)',
};

export const conversationThreadIdField: INodeProperties = {
	displayName: 'Conversation Thread ID',
	name: 'conversationThreadId',
	type: 'string',
	default: '',
	description: 'ID of the group conversation thread used for the task comments',
};

export const percentCompleteField: INodeProperties = {
	displayName: 'Percent Complete',
	name: 'percentComplete',
	type: 'number',
	typeOptions: {
		minValue: 0,
		maxValue: 100,
	},
	default: 0,
	description:
		'Percentage of task completion. Planner uses 0 (Not Started), 50 (In Progress) and 100 (Completed).',
};

export const priorityField: INodeProperties = {
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
};

export const labelsField = (displayName: string, name: string): INodeProperties => ({
	displayName,
	name,
	type: 'multiOptions',
	typeOptions: {
		loadOptionsMethod: 'getCategories',
		loadOptionsDependsOn: ['planId', 'taskId.value'],
	},
	default: [],
	description:
		'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
});
