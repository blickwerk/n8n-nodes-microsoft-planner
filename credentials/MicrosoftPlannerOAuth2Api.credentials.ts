import type { ICredentialTestRequest, ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

// Same pattern as n8n's built-in Microsoft credentials (e.g. Microsoft Azure Monitor)
const LOGIN_BASE_URL = 'https://login.microsoftonline.com/{{$self["tenantId"]}}/oauth2/v2.0';

export class MicrosoftPlannerOAuth2Api implements ICredentialType {
	name = 'microsoftPlannerOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Microsoft Planner OAuth2 API';

	icon: Icon = {
		light: 'file:../nodes/MicrosoftPlanner/planner.svg',
		dark: 'file:../nodes/MicrosoftPlanner/planner.svg',
	};

	documentationUrl =
		'https://github.com/blickwerk/n8n-nodes-microsoft-planner?tab=readme-ov-file#setup';

	properties: INodeProperties[] = [
		{
			displayName:
				'Copy the three values from your app registration in Microsoft Entra ID (Overview page and "Certificates & secrets"). Step-by-step guide: <a href="https://github.com/blickwerk/n8n-nodes-microsoft-planner?tab=readme-ov-file#setup" target="_blank">Setup in 4 steps</a>',
			name: 'setupNotice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Tenant ID',
			name: 'tenantId',
			type: 'string',
			default: 'common',
			required: true,
			placeholder: 'e.g. 72f988bf-86f1-41af-91ab-2d7cd011db47',
			description:
				'The "Directory (tenant) ID" from the Overview page of your app registration. Only multi-tenant apps can keep "common".',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: `=${LOGIN_BASE_URL}/authorize`,
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: `=${LOGIN_BASE_URL}/token`,
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default:
				'openid offline_access User.Read User.ReadBasic.All Tasks.ReadWrite Group.ReadWrite.All',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'response_mode=query',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://graph.microsoft.com/v1.0',
			url: '/me',
		},
	};
}
