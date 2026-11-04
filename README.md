# n8n-nodes-microsoft-planner

This is an n8n community node that allows you to interact with Microsoft Planner in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Microsoft Planner](https://www.microsoft.com/en-us/microsoft-365/business/task-management-software) is a task management tool that helps teams organize, assign, and collaborate on tasks.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Node

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `@blickwerk/n8n-nodes-microsoft-planner` in **Enter npm package name**
4. Agree to the [risks](https://docs.n8n.io/integrations/community-nodes/risks/) of using community nodes
5. Select **Install**

After installing the node, you can use it like any other node in your workflows.

### Manual Installation

To install manually:

```bash
npm install @blickwerk/n8n-nodes-microsoft-planner
```

## Setup

Takes about 5 minutes. You need a Microsoft 365 work or school account. For step 2 you also need an admin (or someone allowed to grant admin consent) - if that's not you, send them steps 1-3.

### 1. Register an app in Microsoft Entra ID

1. In n8n, go to **Credentials → Add credential → Microsoft Planner OAuth2 API** and copy the **OAuth Redirect URL** shown at the top. Leave the dialog open.
2. Open the [Microsoft Entra admin center → App registrations](https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) and click **New registration**.
3. Fill in:
   - **Name:** `n8n` (anything works)
   - **Supported account types:** *Accounts in this organizational directory only*
   - **Redirect URI:** platform **Web**, paste the OAuth Redirect URL from n8n
4. Click **Register**. You're now on the app's **Overview** page.

### 2. Add permissions

1. Open **API permissions → Add a permission → Microsoft Graph → Delegated permissions**.
2. Search and tick these four, then click **Add permissions**:

   | Permission | Needed for |
   |---|---|
   | `User.Read` | Signing in |
   | `User.ReadBasic.All` | Assigning tasks by email address |
   | `Tasks.ReadWrite` | Plans, buckets and tasks |
   | `Group.ReadWrite.All` | Group plans and comments |

3. Click **Grant admin consent for &lt;your organization&gt;** and confirm. All four rows should show a green check mark.

### 3. Create a client secret

1. Open **Certificates & secrets → Client secrets → New client secret**, pick an expiry and click **Add**.
2. Copy the **Value** right away (it is only shown once). Don't copy the *Secret ID*.

> Set a reminder for the expiry date. When the secret expires, create a new one and paste it into the credential.

### 4. Connect n8n

Back in the n8n credential dialog, fill in three fields:

| n8n field | Where to find it in Entra ID |
|---|---|
| **Client ID** | Overview → *Application (client) ID* |
| **Client Secret** | The *Value* from step 3 |
| **Tenant ID** | Overview → *Directory (tenant) ID* |

Click **Connect my account**, sign in with your Microsoft account and accept. Done - the credential shows *Account connected*.

### Troubleshooting

| Error | Fix |
|---|---|
| `AADSTS50194` … *not configured as a multi-tenant application* … */common endpoint* | Enter your **Tenant ID** instead of `common`. If the credential was created with an older version of this node and still shows this error, create a new credential. |
| `AADSTS50011` … *redirect URI* … *does not match* | The Redirect URI in Entra ID must be exactly the **OAuth Redirect URL** from n8n (watch `http` vs. `https`). Behind a reverse proxy, set n8n's `WEBHOOK_URL` to your public URL. |
| `AADSTS65001` / *Need admin approval* | Admin consent is missing - repeat step 2.3 or ask your admin. |
| `AADSTS7000215` … *invalid client secret* | You copied the *Secret ID* instead of the *Value*, or the secret expired. Create a new secret (step 3). |
| *Could not find user with email/ID* | `User.ReadBasic.All` is missing or was added after connecting: add it, grant consent and click **Reconnect** on the credential. |
| `403 Forbidden` on comments or group plans | `Group.ReadWrite.All` is missing or not consented. |

### Upgrading from 1.5.x

Existing credentials keep working. Version 1.6 additionally uses `User.Read` and `User.ReadBasic.All`: add both in step 2, grant consent and click **Reconnect** on your credential once.

## Features

- **Resource Locator UI**: Choose between "From List" (dropdown) or "By ID" (manual input) for Buckets
- **User Assignment**: Assign tasks to users by email address
- **Priority Management**: Easy-to-use priority dropdown (Urgent, Important, Medium, Low)
- **Comprehensive Task Support**: Full support for Task details including Checklist items and Attachments
- **Labels**: Apply and remove Planner labels (category1 - category25), the dropdown shows the label names of your plan
- **Full CRUD Support**: Manage Tasks, Plans, and Buckets
- **Comment Support**: Create and retrieve comments on tasks
- **AI Agent Tool**: The node can be used as a tool by n8n AI agents
- **Concurrency Handling**: ETag conflicts (HTTP 412) are retried automatically

## Operations

### Task

- **Create** - Create a new task (supports Checklist, Attachments, Labels, Preview Type, Order Hints)
- **Delete** - Delete a task
- **Get** - Get a task by ID (optionally include details)
- **Get Board Format** - Get the ordering of a task in the Bucket, Progress or Assigned To board view
- **Get Files** - Get all files attached to a task
- **Get Many** - Get multiple tasks from a plan, a bucket, the current user ("My Tasks") or another user (optionally with details, optionally excluding completed tasks)
- **Update** - Update an existing task (supports Checklist, Attachments, Labels, replacing/removing assignees, removing dates)
- **Update Board Format** - Change the ordering of a task in a board view

### Plan

- **Create** - Create a new plan in a group
- **Delete** - Delete a plan
- **Get** - Get a plan by ID (optionally include details)
- **Get Many** - Get all plans (My Plans, Group Plans or the plans of a specific user)
- **Update** - Update a plan (supports Title, Label Names, and Sharing)

### Bucket

- **Create** - Create a new bucket in a plan (optionally with order hint, optionally upsert by name)
- **Delete** - Delete a bucket
- **Get** - Get a bucket by ID
- **Get Many** - Get all buckets in a plan
- **Update** - Update a bucket name and order

### Comment

- **Create** - Create a new comment on a task
- **Get Many** - Get all comments from a task

## Usage

### Creating a Task

To create a task:
1. Enter the **Plan ID** (you can find this in Microsoft Planner URL or via Graph Explorer)
2. Select a **Bucket** from the dropdown (loads automatically based on the Plan ID)
3. Enter the **Title** of the task

Optional fields:
- **Description**: Detailed task description
- **Priority**: Select from dropdown
  - Urgent (highest priority)
  - Important
  - Medium (default)
  - Low
- **Assigned To**: Comma-separated list of user emails or IDs (e.g., `user1@domain.com, user2@domain.com`)
- **Labels**: Labels to apply (the list shows the label names defined in the plan)
- **Due Date Time**: When the task should be completed
- **Start Date Time**: When work on the task should begin
- **Percent Complete**: Task completion percentage (0-100)
- **Checklist**: Add multiple checklist items with titles and checked status
- **Attachments**: Add external references/attachments with URLs, aliases, and types (Word, Excel, etc.)
- **Description**: Detailed task description (stored in task details)

### Getting Tasks

**Get a single task:**
- Enter the **Task ID** manually (no dropdown available for single task lookups)

**Get many tasks:**
- Choose filter type: **Plan**, **Bucket**, **My Tasks** or **User**
- Enter the **Plan ID** (Plan / Bucket) or the **User** (email or ID)
- If filtering by Bucket: Select bucket from dropdown or enter Bucket ID manually
- Optional: **Include Details** (description, checklist, attachments for every task), **Exclude Completed Tasks**, **Select Properties**

Microsoft Graph does not support `$top`/`$filter` for Planner, so all tasks of the selected scope are returned (pagination is handled automatically).

### Updating a Task

To update a task:
1. Enter the **Task ID** manually
2. Update any of these fields:
- Title
- Description
- Priority (via dropdown)
- Assigned users (via email list)
- **Due Date Time**
- **Start Date Time**
- **Percent Complete**
- **Move to different bucket**
- **Checklist**: Add new items or update existing ones (Operation Mode: Append / Replace), or remove items by ID
- **Attachments**: Add new references (Operation Mode: Append / Replace), or remove references by URL
- **Description**: Update the task description (an empty value clears it)
- **Labels to Add / Labels to Remove**
- **Assignment Mode**: Append (default) or Replace the assignees; **Remove Assignees** unassigns users
- **Remove Due Date / Remove Start Date**
- **Order Hint**, **Assignee Priority**, **Preview Type**, **Conversation Thread ID**

### Getting Files from a Task

To get all files attached to a task:
1. Enter the **Task ID** manually
2. The operation returns:
   - **taskId**: The task ID
   - **fileCount**: Number of attached files
   - **files**: Array of file objects with:
     - **url**: Decoded SharePoint URL (ready to use)
     - **alias**: Display name of the file
     - **type**: File type (e.g., PowerPoint, Word, Excel, PDF, Other)
     - **previewPriority**: Priority for preview display
     - **lastModifiedDateTime**: When the file reference was last modified
     - **lastModifiedBy**: Who last modified the reference

### Creating a Comment

To create a comment on a task:
1. Select **Comment** as the resource
2. Choose **Create** operation
3. Enter the **Task ID** manually
4. Enter the **Content** of the comment
5. Optionally select **Content Type**:
   - **Text** (default): Plain text that will be wrapped in HTML
   - **HTML**: Custom HTML content

The comment will be created as a conversation thread in the Microsoft 365 Group associated with the plan. If the task doesn't have a conversation thread yet (or the linked thread was deleted), one will be created automatically. Plain text is HTML-escaped and line breaks are preserved.

### Getting Comments from a Task

To get all comments from a task:
1. Select **Comment** as the resource
2. Choose **Get Many** operation
3. Enter the **Task ID** manually
4. The operation returns:
   - **taskId**: The task ID
   - **commentCount**: Number of comments
   - **comments**: Array of comment objects with:
     - **id**: Comment ID
     - **content**: Comment body (HTML)
     - **from**: Author information
     - **createdDateTime**: When the comment was created
     - **lastModifiedDateTime**: When the comment was last modified
5. Enable **Split Into Items** to get one output item per comment instead

**Note**: Once a comment is posted in Planner, it cannot be deleted or edited via the Microsoft Graph API or the Planner UI (for Basic plans). This is a limitation of the Microsoft 365 Groups conversation system that Planner uses.

### Working with Plans

The **Plan** resource allows you to manage Microsoft Planner plans:

- **Create**: Requires an **Owner Group** (selected from dropdown or entered as ID) and a **Title**.
- **Get Many**:
  - **My Plans**: Lists plans the authenticated user is a member of.
  - **Group Plans**: Requires a **Group ID** to list plans owned by that specific group.
  - **User**: Lists the plans a specific user (email or ID) is a member of.
- **Get**: Retrieve full plan metadata. Enable **Include Details** to get category descriptions (labels) and other metadata.
- **Update**:
  - Change the plan **Title**.
  - **Category Descriptions**: Update the names of the 25 color-coded labels (Category 01-25). An empty value removes the name.
  - **Shared With**: Update plan members using a JSON mapping of user IDs.
- **Delete**: Permanently removes the plan.

### Working with Buckets

The **Bucket** resource manages the columns or categories within a plan:

- **Create**: Requires a **Plan ID** and a **Name**.
  - **Upsert**: When enabled, the node will check if a bucket with the same name already exists in the plan and return that instead of creating a duplicate.
- **Get Many**: Lists all buckets within a specific **Plan ID**.
- **Update**: Change the bucket **Name** and its **Order Hint** (controlling the position in the UI).
- **Delete**: Removes the bucket from the plan.

### How to Find Plan IDs

You can find your Plan ID in several ways:

1. **From Planner URL**: Open Microsoft Planner in browser, the URL contains the Plan ID:
   ```
   https://tasks.office.com/.../ planId=YOUR_PLAN_ID_HERE /...
   ```

2. **Via Microsoft Graph Explorer**:
   - Go to https://developer.microsoft.com/graph/graph-explorer
   - Sign in
   - Run: `GET /me/planner/plans`
   - Copy the `id` field from the plan you want

### Resource Locator (From List / By ID)

When creating tasks or filtering by bucket:
- **From List**: Select from dropdown (automatically loads based on Plan ID)
- **By ID**: Manually enter the ID if you already know it

For Get/Update/Delete operations, you need to manually enter the Task ID.

## Compatibility

Built and linted with the official n8n community node tooling (`@n8n/node-cli` 0.55, `n8n-workflow` 2.16) for n8n 2.x. Recent n8n 1.x versions that support `NodeConnectionTypes` work as well.

## Development

```bash
# --ignore-scripts skips the native build of isolated-vm (a dependency of n8n-workflow
# that is not needed to build nodes and fails on Windows without build tools)
npm install --ignore-scripts

npm run dev     # starts a local n8n with the node loaded (hot reload)
npm run lint    # n8n community node lint rules (strict mode)
npm run build   # compiles to dist/
```

### Releasing

Since May 1 2026, n8n requires community nodes to be published from GitHub Actions with npm provenance. The workflow in `.github/workflows/publish.yml` publishes the package whenever a version tag (e.g. `1.6.0`) is pushed.

1. One-time: configure npm **Trusted Publishing** for this repository (workflow `publish.yml`) or add an `NPM_TOKEN` repository secret
2. Run `npm run release` locally. It lints, builds, bumps the version, updates `CHANGELOG.md`, commits, tags and pushes

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Microsoft Graph Planner API documentation](https://docs.microsoft.com/en-us/graph/api/resources/planner-overview)
- [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)

## Version History

### 1.6.1
- **Simpler login**: the credential now only asks for Client ID, Client Secret and **Tenant ID**. The login URLs are built automatically, so single-tenant app registrations no longer fail with `AADSTS50194`.
- Setup guide rewritten as 4 short steps, with a troubleshooting table for the common Entra ID errors
- The package no longer ships the TypeScript build cache; CI uses `actions/checkout` and `actions/setup-node` v7

### 1.6.0
- **Migrated to the current n8n community node tooling**
  - `@n8n/node-cli` for build, lint, dev and release, ESLint 9 flat config, strict mode
  - GitHub Actions workflows for CI and npm publishing with provenance (required by n8n since May 2026)
  - Node is usable as an AI agent tool; correct item pairing (`pairedItem`) for all operations
- **New Features**
  - Task labels (applied categories) on create and update; the label dropdown shows the plan's label names
  - Get Many Tasks for **My Tasks** and **User**, optional **Include Details** and **Exclude Completed Tasks**
  - Get Many Plans for a specific **User**
  - Task **Get Board Format** / **Update Board Format** (Bucket, Progress, Assigned To views)
  - Task update: Assignment Mode (Append/Replace), Remove Assignees, Remove Due/Start Date, remove checklist items by ID, remove attachments by URL
  - Task: Order Hint, Assignee Priority, Preview Type and Conversation Thread ID fields
  - Checklist items: Order Hint; attachments: Preview Priority
  - Bucket create: Order Hint
  - Comments: Split Into Items option, pagination for threads with many posts
  - Search filter for the Bucket and Group dropdowns
- **Bug Fixes**
  - Task update priority values were wrong ("Urgent" sent 0, "Important" sent 1, which Planner treats as urgent). Now 1/3/5/9, the same as on create
  - Replying to an existing comment thread used an invalid endpoint (the conversation ID was taken from the thread). Now uses `/groups/{id}/threads/{id}/reply`
  - Creating the first comment relied on `threads` in the create-conversation response, which Graph does not return
  - Plain-text comments were not HTML-escaped (`<`, `&` broke the comment) and lost line breaks
  - The OAuth scope was missing `User.Read` / `User.ReadBasic.All`, so assigning users by email could fail
  - Plans are now created with `container` instead of the deprecated `owner` property
  - Empty Attachments/Checklist sections no longer send an empty PATCH request
  - The description can now be cleared on update
  - Dates passed as Luxon DateTime/Date objects (e.g. `{{ $now }}`) were dropped
  - Email addresses containing `'` broke the user lookup filter
  - ETag conflicts (HTTP 412) are retried automatically instead of failing the workflow
  - Errors now reference the failing item

### 1.5.5
- **Bug Fix: $select Duplication**
  - Fixed an issue where the `$select` query parameter was sent twice during pagination, causing "Query option '$select' was specified more than once" error.


### 1.5.4
- **New Feature: $select Support**
  - Added "Select Properties" field to "Get Many" operations for Tasks, Plans, Buckets, and Comments.
- **Improved Task Assignments**
  - Fixed silent failures for task assignments.
  - Added robust user lookup (ID, Email, UPN) and error reporting for missing users.
  - Added support for Array inputs (expressions) in the "Assigned To" field.


### 1.5.3
- **UI Improvements for Attachments and Checklists**
  - Refactored to use a grouped UI pattern for better usability
  - Replaced separate fields with a unified structure using `fixedCollection`
- **Updated Logic for Updates**
  - Replaced "Replace All" toggle with a clearer **Operation Mode** dropdown (Append vs Replace)
  - Renamed "Mode" to "Input Mode" for better clarity between Manual and JSON inputs
  - Fixed logic for replacing items with matching IDs during updates


### 1.5.2
- **Maintenance release**
- Removed runtime dependency on `n8n-core` to comply with n8n community node requirements
- No functional changes to node behavior

### 1.5.1
- **Maintenance release**
- Replaced deprecated `requestOAuth2` helper with `httpRequestWithAuthentication` in Microsoft Planner API requests
- Removed `console` logging from the Microsoft Planner node and helper to satisfy n8n community package scan requirements

### 1.5.0
- **Major feature release** (with contributions from United Workspace GmbH)
- **Added Comment Support**
  - Create and retrieve comments on Planner tasks
  - Automatic conversation thread management
  - Support for both HTML and plain text comments
- **Enhanced Task Details**
  - **Checklist Support**: Full support for adding and managing checklist items
  - **Attachments (References)**: Support for adding external URLs and files to tasks
  - **Replace All Options**: New toggles to replace existing checklists or attachments entirely
- **Plan Resource Support**
  - CRUD operations for Plans
  - Manage Category Labels (1-25)
  - Manage Plan members (Shared With)
- **Bucket Resource Support**
  - CRUD operations for Buckets
  - Manage bucket names and positioning (Order Hint)
- **Robust Encoding**: Improved handling of special characters in attachment URLs
- **Internal Improvements**: Comprehensive build audit, improved error handling and data fetch reliability

### 1.4.0
- **Updated branding**
- New Planner icon/logo
- Added About Blickwerk Media section with company info and social links

### 1.3.9
- **Added Get Files operation**
- Retrieve all files attached to a task
- URLs are properly decoded for direct use
- Returns file metadata including alias, type, and last modified info

### 1.3.8
- **Fixed priority values**
- Corrected priority mapping: Urgent (1), Important (3), Medium (5), Low (9)
- Priority values now match Microsoft Planner API specifications

### 1.3.7
- **Fixed Update Task response handling**
- Fetch complete updated task data after PATCH operation
- Always returns full task object with all current values
- Fixes empty array and undefined description issues

### 1.3.6
- **Improved Update Task response**
- Update Task now returns complete task data including description
- Better user experience with full task details in response

### 1.3.5
- **Documentation update**
- Synced README with npm package (no code changes)

### 1.3.4
- **Fixed "Empty Payload" error in Update Task**
- Update Task now works correctly even when no fields are selected
- Only sends PATCH request when there are actual fields to update
- Improved error handling for update operations

### 1.3.3
- **Restructured Get Many Tasks for better UX**
- Added "Filter By" dropdown to choose between Plan or Bucket filtering
- Plan ID and Bucket are now separate fields (not in collection)
- Bucket dropdown now properly loads when Plan ID is entered
- Simplified Get/Update/Delete Task to use "By ID" only (no dropdown)
- Resource Locator UI for buckets with "From List" / "By ID" toggle

### 1.3.0 - 1.3.2
- Added resource locator UI for Buckets and Tasks
- Converted from loadOptions to listSearch methods
- Various fixes for dropdown loading issues

### 1.2.4
- **Fixed Bucket and Task dropdowns not showing!**
- Changed field type from 'string' back to 'options' for proper dropdown display
- Buckets now load correctly when Plan ID is entered
- Tasks dropdown now works properly

### 1.2.3
- Improved error handling for Buckets and Tasks loading
- Better fallback values when data cannot be loaded
- Added console logging for debugging dropdown issues

### 1.2.2
- Removed Plan dropdown (Plans cannot be loaded via API)
- Plan ID is now manual input only
- Buckets and Tasks still have dynamic dropdowns
- Simplified and more reliable plan selection

### 1.2.1
- Fixed Plans not loading (improved API endpoint to fetch from groups)
- Allow manual ID input in all dropdown fields
- You can now choose from dropdown OR paste IDs manually
- Added placeholders and better descriptions for all ID fields
- Improved error handling for plans loading

### 1.2.0
- **Major UX Improvement**: Added dynamic dropdowns for Plans, Buckets, and Tasks
- No more manual ID lookup - select from dropdown menus
- Plans load automatically from your Microsoft 365 account
- Buckets load dynamically based on selected Plan
- Tasks load from selected Plan or Bucket
- Improved user experience with clearer field labels

### 1.1.1
- Fixed startDateTime not being set (was returning null)
- Fixed user assignment by adding User.Read.All permission requirement
- Added error logging for failed user lookups
- Improved README documentation with all required permissions

### 1.1.0
- Added priority dropdown (Urgent, Important, Medium, Low) instead of number input
- Added user assignment functionality (assign tasks by email)
- Improved user experience with better field descriptions

### 1.0.1
- Fixed DateTime format handling (automatic conversion to ISO 8601)
- Improved error handling for invalid date formats

### 1.0.0
- Initial release
- Support for creating and retrieving Planner tasks
- OAuth2 authentication
- CRUD operations (Create, Read, Update, Delete)

## License

[MIT](LICENSE.md)

## Author

Developed and maintained by **Blickwerk Media UG**

## Credits

This node was invented and developed by [**Blickwerk Media UG**](https://github.com/blickwerk/n8n-nodes-microsoft-planner). **United Workspace GmbH** contributed to its further development – we thank them for their contributions.

**Web**: [blickwerk.media](https://blickwerk.media)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/blickwerk/n8n-nodes-microsoft-planner).
