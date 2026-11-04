import type { ICredentialTestRequest, ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

export class MicrosoftPlannerOAuth2Api implements ICredentialType {
	name = 'microsoftPlannerOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Microsoft Planner OAuth2 API';

	icon: Icon = {
		light: 'file:../nodes/MicrosoftPlanner/planner.svg',
		dark: 'file:../nodes/MicrosoftPlanner/planner.svg',
	};

	documentationUrl =
		'https://github.com/blickwerk/n8n-nodes-microsoft-planner?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'string',
			default: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
			description:
				'For single-tenant app registrations, replace "common" with your Directory (tenant) ID',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'string',
			default: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
			description:
				'For single-tenant app registrations, replace "common" with your Directory (tenant) ID',
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
