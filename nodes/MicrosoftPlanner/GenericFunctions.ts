import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

export type PlannerContext = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions;

export const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

const CREDENTIAL_NAME = 'microsoftPlannerOAuth2Api';

/** Number of attempts for ETag protected writes (a 412 means someone else changed the item). */
const MAX_ETAG_ATTEMPTS = 3;

export async function microsoftApiRequest(
	this: PlannerContext,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	uri?: string,
	headers: IDataObject = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	const options: IHttpRequestOptions = {
		method,
		url: uri ?? `${GRAPH_BASE_URL}${resource}`,
		json: true,
		headers: {
			'Content-Type': 'application/json',
			...(headers as Record<string, string>),
		},
	};

	if (Object.keys(body).length !== 0) {
		options.body = body;
	}

	if (Object.keys(qs).length !== 0) {
		options.qs = qs;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, CREDENTIAL_NAME, options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function microsoftApiRequestAllItems(
	this: PlannerContext,
	propertyName: string,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];

	let responseData: IDataObject;
	let uri: string | undefined;

	do {
		// The nextLink already contains all query parameters ($select, $expand, $skiptoken, ...)
		const activeQuery = uri ? {} : query;
		responseData = await microsoftApiRequest.call(this, method, endpoint, body, activeQuery, uri);
		uri = responseData['@odata.nextLink'] as string | undefined;
		const page = responseData[propertyName] as IDataObject[] | undefined;
		if (Array.isArray(page)) {
			returnData.push(...page);
		}
	} while (uri !== undefined);

	return returnData;
}

export function cleanETag(eTag: string): string {
	if (eTag.startsWith('W/"') || eTag.startsWith("W/'")) {
		return eTag.substring(2);
	}
	return eTag;
}

function isPreconditionFailed(error: unknown): boolean {
	const httpCode = (error as NodeApiError)?.httpCode;
	return httpCode === '412';
}

/**
 * PATCHes a Planner object that requires an If-Match header.
 * The current object is loaded first so the body builder can use the current state
 * (e.g. to remove all existing checklist items). On a 412 (ETag mismatch) the whole
 * read-modify-write cycle is retried.
 *
 * Returns the updated object, or the unchanged current object if the builder returned
 * an empty body.
 */
export async function patchWithETag(
	this: PlannerContext,
	endpoint: string,
	buildBody: (current: IDataObject) => IDataObject | Promise<IDataObject>,
): Promise<IDataObject> {
	for (let attempt = 1; ; attempt++) {
		const current = (await microsoftApiRequest.call(this, 'GET', endpoint)) as IDataObject;
		const body = await buildBody(current);

		if (Object.keys(body).length === 0) {
			return current;
		}

		try {
			const response = (await microsoftApiRequest.call(
				this,
				'PATCH',
				endpoint,
				body,
				{},
				undefined,
				{
					'If-Match': cleanETag(current['@odata.etag'] as string),
					Prefer: 'return=representation',
				},
			)) as IDataObject | undefined | string;

			if (response && typeof response === 'object' && Object.keys(response).length > 0) {
				return response;
			}

			return (await microsoftApiRequest.call(this, 'GET', endpoint)) as IDataObject;
		} catch (error) {
			if (attempt < MAX_ETAG_ATTEMPTS && isPreconditionFailed(error)) {
				continue;
			}
			// microsoftApiRequest already throws NodeApiErrors, the constructor returns them unchanged
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}
}

/** DELETEs a Planner object that requires an If-Match header (retries on ETag mismatch). */
export async function deleteWithETag(this: PlannerContext, endpoint: string): Promise<void> {
	for (let attempt = 1; ; attempt++) {
		const current = (await microsoftApiRequest.call(this, 'GET', endpoint)) as IDataObject;
		try {
			await microsoftApiRequest.call(this, 'DELETE', endpoint, {}, {}, undefined, {
				'If-Match': cleanETag(current['@odata.etag'] as string),
			});
			return;
		} catch (error) {
			if (attempt < MAX_ETAG_ATTEMPTS && isPreconditionFailed(error)) {
				continue;
			}
			// microsoftApiRequest already throws NodeApiErrors, the constructor returns them unchanged
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}
}

/**
 * Converts the different date representations n8n can hand over (ISO string, Date,
 * Luxon DateTime, timestamp) into the ISO 8601 UTC string Microsoft Graph expects.
 */
export function formatDateTime(dateTime: unknown): string | undefined {
	if (dateTime === undefined || dateTime === null || dateTime === '') {
		return undefined;
	}

	if (dateTime instanceof Date) {
		return isNaN(dateTime.getTime()) ? undefined : dateTime.toISOString();
	}

	if (typeof dateTime === 'object') {
		// Luxon DateTime (e.g. from {{ $now }})
		const luxonLike = dateTime as { toISO?: () => string | null; toUTC?: () => unknown };
		if (typeof luxonLike.toISO === 'function') {
			const utc = (typeof luxonLike.toUTC === 'function' ? luxonLike.toUTC() : luxonLike) as {
				toISO: () => string | null;
			};
			return utc.toISO() ?? undefined;
		}
		return undefined;
	}

	if (typeof dateTime === 'number') {
		const date = new Date(dateTime);
		return isNaN(date.getTime()) ? undefined : date.toISOString();
	}

	if (typeof dateTime !== 'string') {
		return undefined;
	}

	const value = dateTime.trim();

	// Already ISO 8601 with time zone information
	if (/T.*(Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
		return value;
	}

	const date = new Date(value);
	if (isNaN(date.getTime())) {
		return undefined;
	}

	return date.toISOString();
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves an e-mail address / user principal name / user ID to an Entra ID user ID.
 * Results are cached per execution via the optional cache map.
 */
export async function getUserIdByEmail(
	this: PlannerContext,
	email: string,
	cache?: Map<string, string>,
): Promise<string> {
	const value = email.trim();

	if (UUID_REGEX.test(value)) {
		return value;
	}

	const cacheKey = value.toLowerCase();
	const cached = cache?.get(cacheKey);
	if (cached) {
		return cached;
	}

	let userId: string | undefined;

	try {
		// Direct lookup works for user principal names
		const response = await microsoftApiRequest.call(
			this,
			'GET',
			`/users/${encodeURIComponent(value)}`,
			{},
			{ $select: 'id' },
		);
		userId = response.id as string;
	} catch {
		// Fallback: e-mail address differs from the UPN (or the UPN contains special characters)
		try {
			const escaped = value.replace(/'/g, "''");
			const users = await microsoftApiRequest.call(
				this,
				'GET',
				'/users',
				{},
				{
					$filter: `mail eq '${escaped}' or userPrincipalName eq '${escaped}'`,
					$select: 'id',
					$top: 1,
				},
			);
			userId = (users?.value as IDataObject[] | undefined)?.[0]?.id as string | undefined;
		} catch {
			// handled below
		}
	}

	if (!userId) {
		throw new NodeOperationError(this.getNode(), `Could not find user with email/ID: ${value}`, {
			description:
				'Make sure the user exists in your tenant and the credential has the User.ReadBasic.All permission (reconnect the credential after updating the node).',
		});
	}

	cache?.set(cacheKey, userId);
	return userId;
}

/** Resolves a list of e-mail addresses / user IDs to user IDs. */
export async function resolveUserIds(
	this: PlannerContext,
	input: unknown,
	cache?: Map<string, string>,
): Promise<string[]> {
	const userIds: string[] = [];
	for (const entry of parseList(input)) {
		userIds.push(await getUserIdByEmail.call(this, entry, cache));
	}
	return [...new Set(userIds)];
}

/** Parses a comma separated string or an array into a list of trimmed non-empty strings. */
export function parseList(value: unknown): string[] {
	if (value === undefined || value === null) {
		return [];
	}

	const entries = Array.isArray(value) ? value : String(value).split(',');

	return entries
		.map((entry) => {
			if (entry && typeof entry === 'object') {
				// Allow [{ id: '...' }] or [{ email: '...' }] style input from expressions
				const obj = entry as IDataObject;
				return String(obj.id ?? obj.email ?? obj.mail ?? obj.userPrincipalName ?? '');
			}
			return String(entry);
		})
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

/** @deprecated kept for backwards compatibility, use parseList */
export function parseAssignments(assignments: string | string[]): string[] {
	return parseList(assignments);
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
	// encodeURI handles spaces and % but preserves the URI structure (/, ?, &, =)
	return encodeURI(url)
		.replace(/\./g, '%2E')
		.replace(/:/g, '%3A')
		.replace(/@/g, '%40')
		.replace(/#/g, '%23');
}

/** Decodes a plannerExternalReferences key back into a URL (never throws). */
export function decodeReferenceKey(key: string): string {
	try {
		return decodeURIComponent(key);
	} catch {
		return key;
	}
}

/** Generates a GUID/UUID v4, used as key for new checklist items. */
export function generateGuid(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Formats comment content for Microsoft Graph conversation posts.
 * Plain text is HTML escaped and wrapped in a paragraph (line breaks are preserved).
 */
export function formatCommentContent(content: string, contentType = 'text'): IDataObject {
	const formattedContent =
		contentType === 'html' ? content : `<p>${escapeHtml(content).replace(/\r?\n/g, '<br>')}</p>`;

	return {
		body: {
			contentType: 'html',
			content: formattedContent,
		},
	};
}

/** Parses a JSON value that may already be an object/array (from an expression). */
export function parseJson<T>(
	this: PlannerContext,
	value: unknown,
	fieldName: string,
	itemIndex: number,
): T {
	if (typeof value !== 'string') {
		return value as T;
	}
	try {
		return JSON.parse(value) as T;
	} catch {
		throw new NodeOperationError(this.getNode(), `Invalid JSON in "${fieldName}"`, {
			itemIndex,
		});
	}
}

/** Planner's 25 label slots with the colors the Planner UI uses for them. */
export const CATEGORY_COLORS: Record<string, string> = {
	category1: 'Pink',
	category2: 'Red',
	category3: 'Yellow',
	category4: 'Green',
	category5: 'Blue',
	category6: 'Purple',
	category7: 'Bronze',
	category8: 'Lime',
	category9: 'Aqua',
	category10: 'Gray',
	category11: 'Silver',
	category12: 'Brown',
	category13: 'Cranberry',
	category14: 'Orange',
	category15: 'Peach',
	category16: 'Marigold',
	category17: 'Light Green',
	category18: 'Dark Green',
	category19: 'Teal',
	category20: 'Light Blue',
	category21: 'Dark Blue',
	category22: 'Lavender',
	category23: 'Plum',
	category24: 'Light Gray',
	category25: 'Dark Gray',
};

/** Returns the group ID that owns a plan (required for comments / conversations). */
export async function getPlanGroupId(this: PlannerContext, planId: string): Promise<string> {
	const plan = (await microsoftApiRequest.call(
		this,
		'GET',
		`/planner/plans/${planId}`,
	)) as IDataObject;

	const container = plan.container as IDataObject | undefined;
	if (container?.containerId && (!container.type || container.type === 'group')) {
		return container.containerId as string;
	}

	if (!container && plan.owner) {
		return plan.owner as string;
	}

	throw new NodeOperationError(
		this.getNode(),
		'Comments are only supported for plans that belong to a Microsoft 365 group',
	);
}
