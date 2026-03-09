import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

export async function microsoftApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	uri?: string,
	headers: IDataObject = {},
): Promise<any> {
	const options: IHttpRequestOptions = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		url: uri || `https://graph.microsoft.com/v1.0${resource}`,
		json: true,
	};

	try {
		if (Object.keys(headers).length !== 0) {
			options.headers = Object.assign({}, options.headers, headers);
		}

		if (Object.keys(body).length === 0) {
			delete options.body;
		}

		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'microsoftPlannerOAuth2Api',
			options,
		);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function microsoftApiRequestAllItems(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	propertyName: string,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;
	let uri: string | undefined;

	do {
		const activeQuery = uri ? {} : query;
		responseData = await microsoftApiRequest.call(this, method, endpoint, body, activeQuery, uri);
		uri = responseData['@odata.nextLink'];
		returnData.push.apply(returnData, responseData[propertyName] as IDataObject[]);
	} while (responseData['@odata.nextLink'] !== undefined);

	return returnData;
}

export function cleanETag(eTag: string): string {
	if (eTag.startsWith('W/"') || eTag.startsWith("W/'")) {
		return eTag.substring(2);
	}
	return eTag;
}

export function formatDateTime(dateTime: string | undefined): string | undefined {
	if (!dateTime) {
		return undefined;
	}

	// If already in ISO format with timezone, return as is
	if (dateTime.includes('T') && (dateTime.endsWith('Z') || dateTime.includes('+'))) {
		return dateTime;
	}

	// Convert to ISO 8601 format with UTC timezone
	const date = new Date(dateTime);
	if (isNaN(date.getTime())) {
		return undefined;
	}

	return date.toISOString();
}

export async function getUserIdByEmail(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	email: string,
): Promise<string> {
	// 1. Check if it's already a UUID
	if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(email)) {
		return email;
	}

	try {
		// 2. Try direct lookup (fastest)
		const response = await microsoftApiRequest.call(
			this,
			'GET',
			`/users/${encodeURIComponent(email)}`,
			{},
			{ $select: 'id' }
		);
		return response.id;
	} catch (error: any) {
		// 3. Try filter lookup (handling UPN mismatch or restricted visibility)
		try {
			const users = await microsoftApiRequestAllItems.call(
				this,
				'value',
				'GET',
				'/users',
				{},
				{ $filter: `mail eq '${email}' or userPrincipalName eq '${email}'`, $select: 'id' }
			);
			if (users && users.length > 0) {
				return users[0].id;
			}
		} catch (filterError) {
			// Ignore filter error, throw original or new error
		}

		throw new NodeOperationError(this.getNode(), `Could not find user with email/ID: ${email}`);
	}
}

export function parseAssignments(assignments: string | string[]): string[] {
	if (Array.isArray(assignments)) {
		return assignments;
	}
	if (!assignments || assignments.trim() === '') {
		return [];
	}
	return assignments
		.split(',')
		.map((email) => email.trim())
		.filter((email) => email.length > 0);
}

export function createAssignmentsObject(userIds: string[]): IDataObject {
	const assignments: IDataObject = {};
	for (const userId of userIds) {
		assignments[userId] = {
			'@odata.type': '#microsoft.graph.plannerAssignment',
			orderHint: ' !',
		};
	}
	return assignments;
}

/**
 * Encodes a URL for use as a key in plannerExternalReferences.
 * OData requires keys in open types to be free of certain special characters like '.',
 * which must be encoded.
 */
export function encodeReferenceKey(url: string): string {
	// Use encodeURI to handle spaces and % but preserve URI structure (/, ?, &, =)
	let encoded = encodeURI(url);

	// Manually replace OData forbidden characters that encodeURI preserves
	// Forbidden: . : % @ #
	// encodeURI handles % (encodes to %25 unless it's a valid escape sequence)
	encoded = encoded
		.replace(/\./g, '%2E')
		.replace(/:/g, '%3A')
		.replace(/@/g, '%40')
		.replace(/#/g, '%23');

	return encoded;
}

/**
 * Generates a GUID/UUID v4.
 * Useful for creating new ID keys for checklist items.
 */
export function generateGuid(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Formats comment content for Microsoft Graph API conversation posts.
 * Wraps plain text in HTML paragraph tags if needed.
 */
export function formatCommentContent(content: string, contentType: string = 'text'): IDataObject {
	// When we wrap text in HTML tags, we need to set contentType to 'html'
	// Otherwise the tags will be displayed as literal text in Planner
	const isHtml = contentType === 'html';
	const formattedContent = isHtml ? content : `<p>${content}</p>`;

	return {
		body: {
			contentType: 'html', // Always use 'html' since we're wrapping in tags
			content: formattedContent,
		},
	};
}

