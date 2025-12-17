# Technical Design Document (TDD)

**Project:** FlowState (Enterprise Kanban)
**Version:** 1.0

## 1. System Architecture

The backend follows **Clean Architecture** principles to ensure decoupling between business logic and infrastructure.

### 1.1 High-Level Data Flow

`Request` -> `Controller` -> `Use Case` -> `Repository Interface` -> `Mongoose Implementation` -> `MongoDB`

---

## 2. Database Design (Schema)

We will use **MongoDB**. Since this is a Kanban board, read performance is critical. We will use a mix of **Referencing** (for scalability) and **Embedding** (for performance).

### 2.1 Collections

#### A. Users Collection (`users`)

| Field           | Type     | Description             |
| :-------------- | :------- | :---------------------- |
| `_id`           | ObjectId | Unique Identifier       |
| `email`         | String   | Unique, Indexed         |
| `password_hash` | String   | Bcrypt hash             |
| `name`          | String   | Display name            |
| `role`          | String   | ENUM: ['admin', 'user'] |
| `created_at`    | Date     | Timestamp               |

#### B. Boards Collection (`boards`)

| Field      | Type            | Description               |
| :--------- | :-------------- | :------------------------ |
| `_id`      | ObjectId        | Unique Identifier         |
| `title`    | String          | Board Name                |
| `owner_id` | ObjectId        | Ref: Users                |
| `members`  | Array<ObjectId> | Ref: Users (Team members) |

#### C. Columns Collection (`columns`)

_Why separate collection? To allow massive scaling of columns without hitting BSON document limits on the Board._
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique Identifier |
| `board_id` | ObjectId | Ref: Boards (Indexed) |
| `title` | String | e.g., "To Do", "Done" |
| `order` | Number | 0, 1, 2 (For sorting) |

#### D. Tasks Collection (`tasks`)

| Field         | Type     | Description                       |
| :------------ | :------- | :-------------------------------- |
| `_id`         | ObjectId | Unique Identifier                 |
| `column_id`   | ObjectId | Ref: Columns (Indexed)            |
| `board_id`    | ObjectId | Ref: Boards (For faster querying) |
| `title`       | String   | Task summary                      |
| `description` | String   | Markdown supported                |
| `priority`    | String   | ENUM: ['low', 'medium', 'high']   |
| `assignee_id` | ObjectId | Ref: Users (Nullable, Single assignee only)             |
| `order`       | Number   | For drag-and-drop positioning     |

### 2.2: Indexing Strategy
* **users.email** - Unique index
* **columns.board_id** - Standard index
* **tasks.column_id** - Standard index
* **tasks.board_id** - Standard index
* No **compound indexes** in Sprint 1

---

## 3. API Contract (REST)

### 3.1. Global Standards

#### 3.1.1. Response Envelope

All successful API responses will follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

#### 3.1.2. Error Envelope
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

#### 3.1.3. Authentication Logic
Endpoints marked with `[Auth]` require JWT in Authorization header: `Authorization: Bearer <token>`. Token stored in frontend memory (not localStorage for XSS protection).

### 3.2. Authentication
#### 3.2.1 Register User
POST `/auth/register`

* **Description:** Creates a new user account.

* **Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUz...",
    "user": { "id": "123", "email": "user@example.com", "role": "user" }
  }
}
```
#### 3.2.2 Login
POST `/auth/login`
* **Body:**
```json
{ "email": "user@example.com", "password": "securePassword123" }
```

* **Response (200 OK):** returns same structure as Register
#### 3.2.3 Get Current User
GET `/auth/me [Auth]`

* **Description:** Validates token and returns current user data.

### 3.3 Boards
#### 3.3.1 Get All Boards
GET `/boards [Auth]`

* **Description:** Returns boards where the user is an owner or member.

* **Response (200 OK):**

```json

{
  "success": true,
  "data": [
    { "id": "b1", "title": "Project Alpha", "owner_id": "u1" },
    { "id": "b2", "title": "Marketing", "owner_id": "u2" }
  ]
}
```

#### 3.3.2 Create Board
POST `/boards [Auth]`

* **Body:** `{ "title": "New Board" }`

* **Response (201 Created):** Returns the created board object.

#### 3.3.3 Get Board Details (with Columns & Tasks)
GET `/boards/:id [Auth]`

* **Description:** Fetches the board, including all its columns and tasks (populated).

* **Response (200 OK):**

```JSON

{
  "success": true,
  "data": {
    "id": "b1",
    "title": "Project Alpha",
    "columns": [
      {
        "id": "c1",
        "title": "To Do",
        "tasks": [ { "id": "t1", "title": "Fix Bug", "priority": "high" } ]
      }
    ]
  }
}
```

#### 3.3.4 Delete Board
DELETE `/boards/:id [Auth]`

* **Permission:** Only the Board Owner or Admin can delete.

### 3.4. Columns
#### 3.4.1 Create Column
POST `/columns [Auth]`

* **Body:**

```JSON

{ "board_id": "b1", "title": "In Progress" }
```

#### 3.4.2 Update Column Order (Drag & Drop)
PATCH `/columns/:id/order [Auth]`

* **Body:** `{ "new_order_index": 2 }`

### 3.5. Tasks
#### 3.5.1 Create Task
POST `/tasks [Auth]`

* **Body:**

```JSON

{
  "board_id": "b1",
  "column_id": "c1",
  "title": "Implement Login",
  "priority": "high"
}
```

#### 3.5.2 Move Task (Drag & Drop)
PATCH `/tasks/:id/move [Auth]`

* **Description:** Critical endpoint. Handles moving a task within the same column OR to a different column.

* **Body:**

```JSON

{
  "target_column_id": "c2",
  "new_order_index": 0
}
```

#### 3.5.3 Update Task Details
PATCH `/tasks/:id [Auth]`

* **Body:** (Any subset of fields)

```JSON

{ "title": "New Title", "description": "Updated description" }
```

#### 3.5.4 Delete Task
DELETE `/tasks/:id [Auth]`

| Code           | Meaning     | Context             |
| :-------------- | :------- | :---------------------- |
| `200`           | OK | Request succeeded       |
| `201`         | Created   | Resource created (Register, Create Task)         |
| `400` | Bad Request   | Validation error (missing fields)             |
| `401`          | Unauthorized   | Missing or invalid Token            |
| `403`          | Forbidden   | Valid token, but not allowed (e.g., deleting someone else's board) |
| `404`    | Not Found     | ID does not exist               |
| `500`    | Server Error     | Something went wrong on the backend               |

### 3.6: Rate Limiting
* **Global limit:** 100 requests per 15 minutes per IP
* Applied to all `/api/*` routes
* Returns 429 status code when exceeded

### 3.7: CORS Policy
* **Allowed origins:** `http://localhost:3000`, `https://your-app.vercel.app`
* **Credentials:** true
* **Methods:** GET, POST, PATCH, DELETE

---

## 4. Security Architecture

### 4.1 Authentication Strategy
* **JWT (Access Token):** Short-lived (15 mins). Stored in memory (Frontend).
* **Refresh Token:** JWT Access Token only. 7-day expiration. Stored in frontend memory. User must re-login after expiration or page refresh. **HTTP-Only, Secure Cookie**. This prevents XSS attacks from stealing the session.

### 4.2 RBAC Matrix (Permissions)
| Action | Admin | Board Owner | Member | Public |
| :--- | :---: | :---: | :---: | :---: |
| **Create Board** | ✅ | ✅ | ❌ | ❌ |
| **Delete Board** | ✅ | ✅ | ❌ | ❌ |
| **Invite Users** | ✅ | ✅ | ❌ | ❌ |
| **Move Tasks** | ✅ | ✅ | ✅ | ❌ |
| **Edit Task Content**| ✅ | ✅ | ✅ | ❌ |
| **Delete Task** | ✅ | ✅ | ❌ | ❌ |

### 4.3: Conflict Resolution Strategy
* **Strategy:** "Last Write Wins"
* No version control or operational transformation
* Frontend implements optimistic updates
* On API failure, revert UI state and show toast notification