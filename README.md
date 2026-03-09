# n8n-nodes-microsoft-planner

This is an n8n community node that allows you to interact with Microsoft Planner in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Microsoft Planner](https://www.microsoft.com/en-us/microsoft-365/business/task-management-software) is a task management tool that helps teams organize, assign, and collaborate on tasks.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Node

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `@united-workspace/n8n-nodes-microsoft-planner` in **Enter npm package name**
4. Agree to the [risks](https://docs.n8n.io/integrations/community-nodes/risks/) of using community nodes
5. Select **Install**

After installing the node, you can use it like any other node in your workflows.

### Manual Installation

To install manually:

```bash
npm install @united-workspace/n8n-nodes-microsoft-planner
```

## Prerequisites

You need to have:
- An active Microsoft 365 subscription
- A Microsoft Planner plan created
- Azure AD App Registration with the following API permissions:
  - `Tasks.ReadWrite` - Read and write tasks
  - `Group.ReadWrite.All` - Read and write all groups (required for Planner and comments)
  - `User.Read.All` - Read all users (required for user assignment by email)

## Setting up Azure AD App

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory > App registrations**
3. Click **New registration**
4. Give it a name (e.g., "n8n Microsoft Planner Integration")
5. Select **Accounts in this organizational directory only**
6. Add redirect URI: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
7. Click **Register**

### Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add the following permissions:
   - `Tasks.ReadWrite` - Read and write tasks
   - `Group.ReadWrite.All` - Read and write all groups (required for Planner and comments)
   - `User.Read.All` - Read all users' basic profiles (required for user assignment)
6. Click **Grant admin consent**

**Note**: The `User.Read.All` permission is required if you want to assign tasks to users by email address. The `Group.ReadWrite.All` permission is required for both Planner operations and creating/reading comments.

### Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description and select expiration
4. Copy the **Value** (you won't see it again!)

### Get Application Details

- **Client ID**: Found on the app overview page
- **Client Secret**: The value you copied in the previous step

## Credentials

Configure the Microsoft Planner OAuth2 API credentials in n8n:

1. In n8n, go to **Credentials > New**
2. Search for **Microsoft Planner OAuth2 API**
3. Enter your **Client ID** and **Client Secret**
4. Click **Connect my account**
5. Complete the OAuth flow

## Features

- **Resource Locator UI**: Choose between "From List" (dropdown) or "By ID" (manual input) for Buckets
- **User Assignment**: Assign tasks to users by email address
- **Priority Management**: Easy-to-use priority dropdown (Urgent, Important, Medium, Low)
- **Comprehensive Task Support**: Full support for Task details including Checklist items and Attachments
- **Full CRUD Support**: Manage Tasks, Plans, and Buckets
- **Comment Support**: Create and retrieve comments on tasks

## Operations

### Task

- **Create** - Create a new task (supports Checklist and Attachments)
- **Get** - Get a task by ID (optionally include details)
- **Get Many** - Get multiple tasks from a plan or bucket
- **Update** - Update an existing task (supports Checklist and Attachments)
- **Delete** - Delete a task
- **Get Files** - Get all files attached to a task

### Plan

- **Create** - Create a new plan in a group
- **Get** - Get a plan by ID (optionally include details)
- **Get Many** - Get all plans (My Plans or Group Plans)
- **Update** - Update a plan (supports Title, Category Labels, and Sharing)
- **Delete** - Delete a plan

### Bucket

- **Create** - Create a new bucket in a plan
- **Get** - Get a bucket by ID
- **Get Many** - Get all buckets in a plan
- **Update** - Update a bucket title and order
- **Delete** - Delete a bucket

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
- **Assigned To**: Comma-separated list of user emails (e.g., `user1@domain.com, user2@domain.com`)
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
- Choose filter type: **Plan** or **Bucket**
- Enter the **Plan ID**
- If filtering by Bucket: Select bucket from dropdown or enter Bucket ID manually
- Set a limit or return all tasks

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
- **Checklist**: Add new items or update existing ones (supports "Replace All" mode)
- **Attachments**: Add new references (supports "Replace All" mode)
- **Description**: Update the task description

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

The comment will be created as a conversation thread in the Microsoft 365 Group associated with the plan. If the task doesn't have a conversation thread yet, one will be created automatically.

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

**Note**: Once a comment is posted in Planner, it cannot be deleted or edited via the Microsoft Graph API or the Planner UI (for Basic plans). This is a limitation of the Microsoft 365 Groups conversation system that Planner uses.

### Working with Plans

The **Plan** resource allows you to manage Microsoft Planner plans:

- **Create**: Requires an **Owner Group** (selected from dropdown or entered as ID) and a **Title**.
- **Get Many**:
  - **My Plans**: Lists plans the authenticated user is a member of.
  - **Group Plans**: Requires a **Group ID** to list plans owned by that specific group.
- **Get**: Retrieve full plan metadata. Enable **Include Details** to get category descriptions (labels) and other metadata.
- **Update**:
  - Change the plan **Title**.
  - **Category Descriptions**: Update the labels for the 25 color-coded categories (Category 1-25).
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

Tested with n8n version 1.0.0 and above.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Microsoft Graph Planner API documentation](https://docs.microsoft.com/en-us/graph/api/resources/planner-overview)
- [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)

## Version History

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
- **Initial release under @united-workspace scope**
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

Managed by **United Workspace GmbH**

## Credits

This node was originally developed by [**Blickwerk Media UG**](https://github.com/blickwerk/n8n-nodes-microsoft-planner). We are grateful for their excellent work and contributions to the n8n community. 

This version is a fork managed and actively developed by **United Workspace GmbH** to ensure continued support and new features for the n8n community.

**Web**: [united-workspace.de](https://united-workspace.de)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/united-workspace/n8n-nodes-microsoft-planner).
