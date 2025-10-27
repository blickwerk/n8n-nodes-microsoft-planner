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

## Prerequisites

You need to have:
- An active Microsoft 365 subscription
- A Microsoft Planner plan created
- Azure AD App Registration with the following API permissions:
  - `Tasks.ReadWrite` - Read and write tasks
  - `Group.ReadWrite.All` - Read and write all groups (required for Planner)
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
   - `Group.ReadWrite.All` - Read and write all groups (required for Planner)
   - `User.Read.All` - Read all users' basic profiles (required for user assignment)
6. Click **Grant admin consent**

**Note**: The `User.Read.All` permission is required if you want to assign tasks to users by email address.

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

- **Dynamic Dropdowns**: Automatically loads and displays your Plans, Buckets, and Tasks - no need to manually copy IDs!
- **User Assignment**: Assign tasks to users by email address
- **Priority Management**: Easy-to-use priority dropdown (Urgent, Important, Medium, Low)
- **Full CRUD Operations**: Create, Read, Update, and Delete tasks

## Operations

### Task

- **Create** - Create a new task
- **Get** - Get a task by ID
- **Get Many** - Get multiple tasks from a plan or bucket
- **Update** - Update an existing task
- **Delete** - Delete a task

## Usage

### Creating a Task

To create a task:
1. Select a **Plan** from the dropdown (automatically loaded from your Microsoft 365)
2. Select a **Bucket** from the dropdown (loads buckets from the selected plan)
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

### Getting Tasks

**Get a single task:**
- Select the task from the dropdown (automatically loaded from your plans)

**Get many tasks:**
- Filter by **Plan** (select from dropdown)
- Or filter by **Bucket** (select from dropdown)
- Set a limit or return all tasks

### Updating a Task

To update a task:
1. Select the **Task** from the dropdown
2. Update any of these fields:
- Title
- Description
- Priority (via dropdown)
- Assigned users (via email list)
- Due Date Time
- Start Date Time
- Percent Complete
- Move to different bucket

### How Dynamic Dropdowns Work

The node automatically fetches your data from Microsoft 365:
- **Plans**: Loaded from your account when you open the Plan dropdown
- **Buckets**: Dynamically loaded based on the selected Plan
- **Tasks**: Loaded from the selected Plan or Bucket

No need to manually look up IDs anymore! Just select from the dropdown menus.

## Compatibility

Tested with n8n version 1.0.0 and above.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Microsoft Graph Planner API documentation](https://docs.microsoft.com/en-us/graph/api/resources/planner-overview)
- [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)

## Version History

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

Developed by **Blickwerk Media UG**

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/blickwerk/n8n-nodes-microsoft-planner).
