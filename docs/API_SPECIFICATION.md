# API Contract (REST)

**Project:** FlowState (Enterprise Kanban)
**Version:** 1.0

## 1. Global Standards

### 1.1. Response Envelope

All successful API responses will follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### 1.2. Error Envelope
All error responses will follow this format:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested board does not exist."
  }
}
```

### 1.3. Authentication Logic
Endpoints marked with `[Auth]` require JWT in Authorization header: `Authorization: Bearer <token>`. Token stored in frontend memory (not localStorage for XSS protection).

## 2. Authentication
### 2.1 Register User
POST `api/auth/register`

* **Description:** Creates a new user account.

* **Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```
**Note:** Passwords are automatically trimmed of leading/trailing whitespace, but internal spaces are preserved.

* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUz...",
    "user": { "id": "123", "email": "user@example.com", "role": "user", "created_at": "2025-01-20T10:00:00Z" }
  }
}
```

* **Error (409 Conflict - User Already Exists):**
```json
{
  "success": false,
  "error": {
    "code": "USER_002",
    "message": "User with this email already exists"
  }
}
```

* **Error (500 Internal Server Error - bcrypt failiure):**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_001",
    "message": "Internal Server Error"
  }
}

### 2.2 Login
POST `api/auth/login`
* **Body:**
```json
{ "email": "user@example.com", "password": "securePassword123" }
```

* **Response (200 OK):** returns same structure as Register
### 2.3 Get Current User
GET `api/auth/me [Auth]`

* **Description:** Validates token and returns current user data.

* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

* **Error (401 Unauthorized - Token Expired):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_002",
    "message": "Token has expired, please login again"
  }
}
```

* **Error (401 Unauthorized - Invalid Token):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_003",
    "message": "Invalid token"
  }
}
```

## 3 Boards
### 3.1 Get All Boards
GET `api/boards [Auth]`

* **Description:** Returns boards where the user is an owner or member.

* **Response (200 OK):**

```json

{
  "success": true,
  "data": [
    {"id": "b1", 
    "title": "Project Alpha", 
    "owner_id": "u1",
    "members": [],
    "created_at": "2025-01-15T10:30:00.000Z"},
    {"id": "b2", 
    "title": "Marketing", 
    "owner_id": "u2",
    "members": ["u3", "u4"],
    "created_at": "2025-01-14T08:20:00.000Z"}
  ]
},

```

* **Error (401 Unauthorized):**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_004",
    "message": "User not authenticated"
  }
}
```

### 3.2 Create Board
POST `api/boards [Auth]`

* **Body:** `{ "title": "New Board" }`

* **Response (201 Created):** 
```json
{
  "success": true,
  "data": {
    "id": "b1",
    "title": "New Board",
    "owner_id": "u1",
    "members": [],
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```
* **Error (400 Bad Request - Missing Title):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_002",
    "message": "Title is required to create a board"
  }
}
```

* **Error (400 Bad Request - Title Too Long):**

```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Board title must be less than <MAX_BOARD_TITLE_LENGTH> characters"
  }
}
```

* **Error (404 Not found):**
```json
{
  "success": false,
  "error": {
    "code": "USER_001",
    "message": "User not found"
  }
}
```

* **Error (400 Bad Request - CastError)**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Invalide OID foramt"
  }
}
```

* **Error (400 Bad Request - Limit Exceeded):**
``` json
{
  "success": false,
  "error": {
    "code": "VAL_003",
    "message": "Can't create new board. Maximum limit(<MAX_BOARDS_PER_USER>) exceeded"
  }
}
```

### 3.3 Get Board Details (with Columns & Tasks)
GET `api/boards/:id [Auth]`

* **Description:** Fetches the board, including all its columns and tasks (populated via virtual relationships).
* **Permissions:** Admin, Board Owner, or Board Member.

* **Response (200 OK):**

```JSON

```json
{
  "success": true,
  "data": {
    "id": "b1",
    "title": "Project Alpha",
    "owner_id": "u1",
    "members": ["u2", "u3"],
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T11:00:00.000Z",
    "columns": [
      {
        "id": "c1",
        "board_id": "b1",
        "title": "To Do",
        "order": 0,
        "created_at": "2025-01-15T10:35:00.000Z",
        "updated_at": "2025-01-15T10:35:00.000Z",
        "tasks": [
          {
            "id": "t1",
            "title": "Fix Bug",
            "description": "Fix login error on safari",
            "priority": "high",
            "assignee_id": "u2",
            "column_id": "c1",
            "board_id": "b1",
            "order": 0,
            "created_at": "2025-01-16T09:00:00.000Z",
            "updated_at": "2025-01-16T09:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

* **Error (404 Not Found - Board):**
```json
{
  "success": false,
  "error": {
    "code": "BOARD_001",
    "message": "Board not found"
  }
}
```

* **Error (403 Forbidden - Access Denied):**
```json
{
  "success": false,
  "error": {
    "code": "BOARD_002",
    "message": "Board access denied"
  }
}
```

### 3.4 Delete Board
DELETE `api/boards/:id [Auth]`

### 3.5 Update Board
PATCH `api/boards/:id [Auth]`

* **Permission:** Only Board Owner or Admin
* **Body:** `{ "title": "Updated Title" }`
* **Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "b1",
    "title": "Updated Title",
    "owner_id": "u1",
    "members": ["u2"],
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```
* **Error (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "BOARD_002",
    "message": "Only board owner or admin can update this board"
  }
}
```

### 3.6 Add Member to Board
POST `api/boards/:id/members [Auth]`

* **Permission:** Only Board Owner or Admin
* **Body:** `{ "members": ["u3", "u4"] }`
* **Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "b1",
    "title": "Project Alpha",
    "owner_id": "u1",
    "members": ["u2", "u3", "u4"],
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

* **Error (404 Not Found - User Doesn't Exist):**
```json
{
  "success": false,
  "error": {
    "code": "USER_001",
    "message": "User not found"
  }
}
```

* **Error (400 Bad Request - Already Member):**

```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "User is already a member of this board"
  }
}
```

### 3.7 Remove Member from Board
DELETE `api/boards/:id/members/:userId [Auth]`

* **Permission:** Only Board Owner or Admin
* **Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "b1",
    "title": "Project Alpha",
    "owner_id": "u1",
    "members": ["u2"],
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

* **Error (400 Bad Request - Not a Member):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "User is not a member of this board"
  }
}
```

* **Error (400 Bad Request - Cannot Remove Owner):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Cannot remove board owner from members"
  }
}
```

* **Permission:** Only the Board Owner or Admin can delete.

## 4. Columns
### 4.1 Create Column
POST `api/columns [Auth]`

* **Permission:** Only Board Owner or Admin.
* **Body:**

```JSON

{ "board_id": "b1", "title": "In Progress" }
```

* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "c1",
    "board_id": "b1",
    "title": "In Progress",
    "order": 3,
    "tasks": [],
    "created_at": "2025-01-18T10:00:00.000Z"
  }
}
```

* **Error (403 Forbidden - Access Denied):**
```json
{
  "success": false,
  "error": {
    "code": "BOARD_002",
    "message": "Only admin or board owner can create column"
  }
}
```

* **Error (400 Bad Request - Limit Exceeded):**
``` json
{
  "success": false,
  "error": {
    "code": "VAL_003",
    "message": "Can't create new column. Maximum limit(<MAX_COLUMNS_PER_BOARD>) exceeded"
  }
}
```

* **Error (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "BOARD_001",
    "message": "Requested board doesn't exist"
  }
}
```

* **Error (400 Bad Request - Missing Fields):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_002",
    "message": "Required fields are not provided"
  }
}
```

* **Error (400 Bad Request - Title Too Long)**
```json
{
  "success": false,
  "error": {
    "code": "VAL_003",
    "message": "Column title must not exceed <MAX_COLUMN_TITLE_LENGTH> characters"
  }
}
```

* **Error (400 Bad Request - CastError)**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Invalide OID foramt"
  }
}
```

### 4.2 Move Column (Drag & Drop)
PATCH `api/columns/:id/order [Auth]`

* **Body:** `{ "new_order_index": 2 }`

```json
{
  "success": true,
  "message": "Column moved successfully"
}
```

### 4.3 Update column Details
PATCH `api/columns/:id [Auth]`

* **Body:** `{ "title": "New Title" }`

```JSON

{ "board_id": "b1", "title": "New Title" }
```

### 4.4 Delete Column
DELETE `api/columns/:id [Auth]`

* **Description:** Deletes a column.
* **Constraint:** Column must be empty (no tasks).

* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Column deleted successfully"
}
```

* **Error (400 Bad Request - Not Empty):**

```json
{
  "success": false,
  "error": {
    "code": "VAL_003",
    "message": "Cannot delete column with existing tasks. Please move or delete them first."
  }
}
```



## 5. Tasks
### 5.1 Create Task
POST `api/tasks [Auth]`

* **Permission:** User must be Board Owner OR Member.

* **Body:**

```JSON

{
  "board_id": "b1",
  "column_id": "c1",
  "title": "Implement Login",
  "priority": "high"
}
```

* **Error (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "BOARD_002",
    "message": "You must be a member of this board to create tasks."
  }
}
```

* **Error (400 Bad Request - Limit Exceeded):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_003",
    "message": "Cannot create more than <MAX_TASKS_PER_COLUMN> tasks per column"
  }
}
```

* **Error (400 Bad Request - Assignee Violation):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_003",
    "message": "Assignee must be a member or the owner of the board" 
  }
}
```

* **Error (404 Not Found - Column not found):**
```json
{
  "success": false,
  "error": {
    "code": "COLUMN_001",
    "message": "Column not exists or not in the specified board" 
  }
}
```

* **Error (400 Bad Request - Missing Fields):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_002",
    "message": "Required fields are not provided"
  }
}
```

* **Error (400 Bad Request - title too long):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_003",
    "message": "Task title must not exceed <MAX_TASK_TITLE_LENGTH> characters" 
  }
}
```

* **Error (400 Bad Request - Invalid priority):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Priority must be 'low', 'medium', or 'high'" 
  }
}
```

* **Error (400 Bad Request - CastError)**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Invalide OID foramt"
  }
}
```

### 5.2 Move Task (Drag & Drop)
PATCH `api/tasks/:id/move [Auth]`

* **Description:** Critical endpoint. Handles moving a task within the same column OR to a different column.

* **Body:**

```JSON

{
  "target_column_id": "c2",
  "new_order_index": 0
}
```

### 5.3 Update Task Details
PATCH `api/tasks/:id [Auth]`

* **Permission:** Board Owner, Admin, or Member.
* **Description:** Updates any subset of task fields. Used for renaming, changing description, re-prioritizing, or assigning users.
* **Validation:** - `priority` must be one of `['low', 'medium', 'high']`.
  - `assignee_id` must be a valid user who is a **Member** of the board (or the Owner).

* **Body:** (Any subset of fields)

```JSON

{ 
  "title": "New Title", 
  "description": "Updated description",
  "priority": "high", 
  "assignee_id": "u5"
}

```

* **Body (Example - Unassign):**
```json
{ 
  "assignee_id": null 
}
```

### 5.4 Delete Task
DELETE `api/tasks/:id [Auth]`
* **Permission:** RESTRICTED. Only Board Owner or Admin can delete tasks.
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

* **Error (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "BOARD_002",
    "message": "Only board owner or admin can delete tasks."
  }
}
```

| Code           | Meaning     | Context             |
| :-------------- | :------- | :---------------------- |
| `200`           | OK | Request succeeded       |
| `201`         | Created   | Resource created (Register, Create Task)         |
| `400` | Bad Request   | Validation error (missing fields)             |
| `401`          | Unauthorized   | Missing or invalid Token            |
| `403`          | Forbidden   | Valid token, but not allowed (e.g., deleting someone else's board) |
| `404`    | Not Found     | ID does not exist               |
| `409`    | Conflict     | Resource already exists (e.g., Duplicate Email)               |
| `500`    | Server Error     | Something went wrong on the backend               |

## 6: Rate Limiting
* **Global limit:** 100 requests per 15 minutes per IP
* Applied to all `/api/*` routes
* Returns 429 status code when exceeded
* **Auth limit:** 5 requests per 15 minutes per IP
  * **Strictly Applied to:** `POST /api/auth/register` and `POST /api/auth/login`
  * **Reason:** Prevents brute-force attacks and spam account creation.

## 7: CORS Policy
* **Allowed origins:** * Development: `http://localhost:3000`
  * Production: defined via `FRONTEND_URL` env variable
* **Credentials:** true
* **Methods:** GET, POST, PATCH, DELETE

## 8. Error Codes Reference

|Code|Name|Description|Common Causes|
| :-------------- | :------- | :---------------------- | :---  |
|AUTH_001|Invalid Credentials|Email or password incorrect|Login with wrong password|
|AUTH_002|Token Expired|JWT has expired|Session timeout|
|AUTH_003|Token Invalid|JWT signature invalid|Tampered token|
|AUTH_004|User Not Authenticated|User identity not verified|Missing user in JWT payload|
|BOARD_001|Board Not Found|Requested board doesn't exist|Invalid board ID|
|BOARD_002|Access Denied|User not authorized|Non-member accessing board|
|TASK_001|Task Not Found|Requested task doesn't exist|Invalid task ID|
|TASK_002|Invalid Column|Target column doesn't exist|Moving task to deleted column|
|VAL_001|Validation Error|Request body validation failed|Missing required fields|
|VAL_002|MISSING_REQUIRED_FIELDS|Required fields are not provided|User hasn't provided required fields or contain only whitespace|
|VAL_003|Business Rule Violation|Request technically valid but violates logic constraints|Exceeding 20 tasks/column, Title > 150 chars|
|RATE_001|Rate Limit Exceeded|Too many requests|Hitting 100 req/15min limit|
|URL_001|URL Not Found|URL Not Fount|Undefined URL|
|SERVER_001|INTERNAL ERROR|Internal Server doesn't work|server crashes|
|USER_001|User Not Found|Requested user doesn't exist|Invalid user ID in JWT payload|
|USER_002|User Already Exists|Email already registered|Duplicate registration attempt|

## 9. State Management Contract
Zustand store structure:
```json
board: { id, title, owner_id, columns[] } | null
isLoading: boolean
error: string | null
```
**Optimistic Update Flow**

1. User drags task
2. UI updates immediately
3. API call fires in background
4. On success: do nothing
5. On failure: revert UI + show toast
