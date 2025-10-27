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

## Operations

### Task

- **Create** - Create a new task
- **Get** - Get a task by ID
- **Get Many** - Get multiple tasks from a plan or bucket
- **Update** - Update an existing task
- **Delete** - Delete a task

## Usage

### Creating a Task

To create a task, you need:
- **Plan ID**: The ID of the plan
- **Bucket ID**: The ID of the bucket within the plan
- **Title**: The task title

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

You can retrieve tasks by:
- **Task ID**: Get a specific task
- **Plan ID**: Get all tasks in a plan
- **Bucket ID**: Get all tasks in a bucket

### Updating a Task

To update a task, provide the Task ID and the fields you want to update. You can update:
- Title
- Description
- Priority (via dropdown)
- Assigned users (via email list)
- Due Date Time
- Start Date Time
- Percent Complete
- Move to different bucket

### Finding Plan and Bucket IDs

You can find Plan IDs and Bucket IDs using the Microsoft Graph Explorer:

1. Go to [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in with your Microsoft account
3. Use these queries:
   - Get all plans: `GET https://graph.microsoft.com/v1.0/me/planner/plans`
   - Get buckets in a plan: `GET https://graph.microsoft.com/v1.0/planner/plans/{plan-id}/buckets`

## Compatibility

Tested with n8n version 1.0.0 and above.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Microsoft Graph Planner API documentation](https://docs.microsoft.com/en-us/graph/api/resources/planner-overview)
- [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)

## Version History

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
