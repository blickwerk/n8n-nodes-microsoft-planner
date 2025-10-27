import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	NodeApiError,
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

		return await this.helpers.requestOAuth2.call(this, 'microsoftPlannerOAuth2Api', options);
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
		responseData = await microsoftApiRequest.call(this, method, endpoint, body, query, uri);
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
): Promise<string | null> {
	try {
		const response = await microsoftApiRequest.call(
			this,
			'GET',
			`/users/${encodeURIComponent(email)}`,
		);
		return response.id;
	} catch (error: any) {
		// Log error for debugging
		console.error(`Failed to get user ID for email ${email}:`, error.message || error);
		return null;
	}
}

export function parseAssignments(assignmentsString: string): string[] {
	if (!assignmentsString || assignmentsString.trim() === '') {
		return [];
	}
	return assignmentsString
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
