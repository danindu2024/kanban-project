# Test Plan — Kanban Board Backend (Sprint 1)

## 1. Overview

This document outlines the comprehensive test plan for the Kanban Board backend application (Sprint 1). It covers unit testing for use cases, middleware, and utilities, as well as integration testing for API endpoints. The goal is to verify correctness of business logic, input validation, authorization rules, and error handling before proceeding to frontend development.

### 1.1 Scope

| In Scope | Out of Scope |
|----------|-------------|
| Use case unit tests (18 use cases) | Frontend / UI testing |
| Middleware unit tests | Performance / load testing |
| Utility function unit tests | End-to-end browser testing |
| API integration tests (controllers + routes) | Security penetration testing |
| Error handler coverage | Database migration testing |

### 1.2 Technology Stack

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner, assertion library, mocking framework |
| **ts-jest** | TypeScript preprocessor for Jest |
| **supertest** | HTTP request simulation for integration tests |
| **mongodb-memory-server** | In-memory MongoDB for integration tests |

---

## 2. Test Strategy

### 2.1 Test Pyramid

```
        ┌─────────────┐
        │ Integration  │  ← API endpoint tests (controllers + routes + DB)
        │    Tests     │
        ├─────────────┤
        │             │
        │  Unit Tests  │  ← Use cases, middleware, utilities (mocked dependencies)
        │             │
        └─────────────┘
```

- **Unit Tests** form the base — fast, isolated, test one class/function at a time with mocked dependencies.
- **Integration Tests** validate the full HTTP request lifecycle — routes → middleware → controller → use case → repository → in-memory DB.

### 2.2 Testing Pattern

All tests follow the **Arrange-Act-Assert (AAA)** pattern:

```
ARRANGE  → Set up mocks, test data, and dependencies
ACT      → Call the method or endpoint under test
ASSERT   → Verify the result, error code, or side effects
```

### 2.3 Mocking Strategy

For **unit tests**, all repository interfaces are mocked:
- `IUserRepository` — mock `findById`, `findByEmail`, `findByIds`, `create`
- `IBoardRepository` — mock `findById`, `create`, `delete`, `addMembers`, `removeMember`, `updateBoard`, `findAllByUserId`, `getPopulatedBoard`
- `IColumnRepository` — mock `findById`, `create`, `update`, `delete`, `moveColumn`, `findByBoardId`
- `ITaskRepository` — mock `findById`, `create`, `update`, `delete`, `moveTask`, `countTasks`, `unassignUserFromBoard`, `findByColumnId`, `findByBoardId`

External libraries (`bcryptjs`, `jsonwebtoken`) are also mocked in unit tests.

---

## 3. Test Directory Structure

```
server/
├── src/                          # Production code
└── tests/
    ├── unit/
    │   ├── use-cases/
    │   │   ├── auth/
    │   │   │   ├── RegisterUser.test.ts
    │   │   │   ├── LoginUser.test.ts
    │   │   │   └── GetCurrentUser.test.ts
    │   │   ├── boards/
    │   │   │   ├── CreateBoard.test.ts
    │   │   │   ├── GetBoard.test.ts
    │   │   │   ├── GetUserBoards.test.ts
    │   │   │   ├── UpdateBoard.test.ts
    │   │   │   ├── DeleteBoard.test.ts
    │   │   │   ├── AddMembers.test.ts
    │   │   │   └── RemoveMember.test.ts
    │   │   ├── column/
    │   │   │   ├── CreateColumn.test.ts
    │   │   │   ├── UpdateColumn.test.ts
    │   │   │   ├── DeleteColumn.test.ts
    │   │   │   └── MoveColumn.test.ts
    │   │   └── task/
    │   │       ├── CreateTask.test.ts
    │   │       ├── UpdateTask.test.ts
    │   │       ├── DeleteTask.test.ts
    │   │       └── MoveTask.test.ts
    │   ├── middleware/
    │   │   ├── authMiddleware.test.ts
    │   │   ├── errorHandler.test.ts
    │   │   └── rateLimiter.test.ts
    │   └── utils/
    │       ├── AppError.test.ts
    │       └── jwt.test.ts
    └── integration/
        ├── setup.ts              # mongodb-memory-server setup
        ├── auth.integration.test.ts
        ├── board.integration.test.ts
        ├── column.integration.test.ts
        └── task.integration.test.ts
```

---

## 4. Unit Test Cases

### 4.1 Auth Use Cases

#### 4.1.1 RegisterUser

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Register with valid name, email, password | Returns token + user object | — |
| 2 | Missing name (empty string) | Throws `400` | `VAL_002` |
| 3 | Missing email | Throws `400` | `VAL_002` |
| 4 | Missing password | Throws `400` | `VAL_002` |
| 5 | Invalid email format | Throws `400` | `VAL_001` |
| 6 | Email exceeds 255 characters | Throws `400` | `VAL_003` |
| 7 | Password shorter than 8 characters | Throws `400` | `VAL_003` |
| 8 | Password exceeds 50 characters | Throws `400` | `VAL_003` |
| 9 | Name exceeds 100 characters | Throws `400` | `VAL_003` |
| 10 | Input with leading/trailing whitespace is trimmed | User created with trimmed values | — |
| 11 | Email is lowercased before saving | User created with lowercased email | — |
| 12 | Password is hashed (not stored in plain text) | `bcrypt.hash` called | — |
| 13 | Token is generated with user ID | `generateToken` called with user ID | — |
| 14 | Response DTO contains only id, name, email, role, created_at | No password_hash or extra fields in response | — |

#### 4.1.2 LoginUser

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Login with valid credentials | Returns token + user object | — |
| 2 | Missing email | Throws `400` | `VAL_002` |
| 3 | Missing password | Throws `400` | `VAL_002` |
| 4 | Invalid email format | Throws `400` | `VAL_001` |
| 5 | Email exceeds max length | Throws `401` | `AUTH_001` |
| 6 | Password too short (< 8 chars) | Throws `401` | `AUTH_001` |
| 7 | Password too long (> 50 chars) | Throws `401` | `AUTH_001` |
| 8 | Non-existing email | Throws `401` | `AUTH_001` |
| 9 | Wrong password | Throws `401` | `AUTH_001` |
| 10 | Email is lowercased and trimmed | Lookup uses sanitized email | — |
| 11 | Response DTO includes id, name, email, role, created_at, updated_at | Correct structure | — |

#### 4.1.3 GetCurrentUser

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Valid userId returns user profile | Returns id, name, email, role | — |
| 2 | Non-existing userId | Throws `404` | `USER_001` |
| 3 | Response excludes password_hash, timestamps | Only safe fields returned | — |

---

### 4.2 Board Use Cases

#### 4.2.1 CreateBoard

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Create board with valid title and existing owner | Returns board object | — |
| 2 | Owner user not found | Throws `404` | `USER_001` |
| 3 | Empty title (after trimming) | Throws `400` | `VAL_002` |
| 4 | Title exceeds 150 characters | Throws `400` | `VAL_003` |
| 5 | Title with whitespace is trimmed | Board created with trimmed title | — |
| 6 | Board created with empty members array | `members` is `[]` | — |

#### 4.2.2 GetBoard

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Board owner fetches board | Returns populated board | — |
| 2 | Board member fetches board | Returns populated board | — |
| 3 | Admin fetches any board | Returns populated board | — |
| 4 | Non-member, non-owner, non-admin user | Throws `403` | `BOARD_002` |
| 5 | Missing boardId | Throws `400` | `VAL_002` |
| 6 | Board not found | Throws `404` | `BOARD_001` |
| 7 | User not found | Throws `404` | `USER_001` |
| 8 | Populated board not found (race condition) | Throws `404` | `BOARD_001` |

#### 4.2.3 GetUserBoards

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | User with boards returns board list | Returns `{ boards: [...] }` | — |
| 2 | User with no boards returns empty array | Returns `{ boards: [] }` | — |
| 3 | Non-existing user | Throws `404` | `AUTH_004` |

#### 4.2.4 UpdateBoard

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Owner updates board title | Returns updated board | — |
| 2 | Admin updates board title | Returns updated board | — |
| 3 | Member (non-owner, non-admin) attempts update | Throws `403` | `BOARD_002` |
| 4 | Empty title after trimming | Throws `400` | `VAL_002` |
| 5 | Title exceeds 150 characters | Throws `400` | `VAL_003` |
| 6 | Board not found | Throws `404` | `BOARD_001` |
| 7 | User not found | Throws `404` | `USER_001` |
| 8 | Race condition — board deleted before update completes | Throws `404` | `BOARD_001` |

#### 4.2.5 DeleteBoard

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Owner deletes board | Resolves void | — |
| 2 | Admin deletes board | Resolves void | — |
| 3 | Non-owner, non-admin attempts delete | Throws `403` | `BOARD_002` |
| 4 | Board not found | Throws `404` | `BOARD_001` |
| 5 | User not found | Throws `404` | `USER_001` |
| 6 | Race condition — concurrent delete | Throws `404` | `BOARD_001` |

#### 4.2.6 AddMembers

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Owner adds valid members | Returns updated board with new members | — |
| 2 | Admin adds valid members | Returns updated board | — |
| 3 | Non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 4 | Empty members array | Throws `400` | `VAL_002` |
| 5 | Members not an array | Throws `400` | `VAL_002` |
| 6 | Batch exceeds 20 members | Throws `400` | `VAL_003` |
| 7 | All members are whitespace/empty after sanitization | Throws `400` | `VAL_002` |
| 8 | Duplicate member IDs in input are deduplicated | Only unique IDs processed | — |
| 9 | Member already exists on board | Throws `400` | `VAL_001` |
| 10 | Member is the board owner | Throws `400` | `VAL_003` |
| 11 | Member ID not found in database | Throws `404` | `USER_001` |
| 12 | Adding would exceed 50 member limit | Throws `400` | `VAL_003` |
| 13 | Board not found | Throws `404` | `BOARD_001` |
| 14 | User (requester) not found | Throws `404` | `USER_001` |
| 15 | Race condition — board deleted before update | Throws `404` | `BOARD_001` |

#### 4.2.7 RemoveMember

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Owner removes a member | Returns updated board, tasks unassigned | — |
| 2 | Admin removes a member | Returns updated board, tasks unassigned | — |
| 3 | Non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 4 | Attempt to remove board owner | Throws `400` | `VAL_001` |
| 5 | Member is not on the board | Throws `400` | `VAL_001` |
| 6 | Board not found | Throws `404` | `BOARD_001` |
| 7 | User (requester) not found | Throws `404` | `USER_001` |
| 8 | Tasks assigned to removed member are unassigned | `unassignUserFromBoard` called | — |
| 9 | Race condition — board deleted before removal | Throws `404` | `BOARD_001` |

---

### 4.3 Column Use Cases

#### 4.3.1 CreateColumn

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Owner creates column with valid title | Returns column object with order | — |
| 2 | Admin creates column | Returns column object | — |
| 3 | Non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 4 | Missing boardId or title | Throws `400` | `VAL_002` |
| 5 | Title exceeds 150 characters | Throws `400` | `VAL_003` |
| 6 | Board not found | Throws `404` | `BOARD_001` |
| 7 | User not found | Throws `404` | `USER_001` |
| 8 | Title with whitespace is trimmed | Column created with trimmed title | — |

#### 4.3.2 UpdateColumn

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Owner updates column title | Returns updated column | — |
| 2 | Admin updates column title | Returns updated column | — |
| 3 | Non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 4 | Empty title after trimming | Throws `400` | `VAL_002` |
| 5 | Title exceeds 150 characters | Throws `400` | `VAL_003` |
| 6 | Column not found | Throws `404` | `COLUMN_001` |
| 7 | Board not found (orphaned column) | Throws `404` | `BOARD_001` |
| 8 | User not found | Throws `404` | `USER_001` |
| 9 | Race condition — column deleted before update | Throws `404` | `COLUMN_001` |

#### 4.3.3 DeleteColumn

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Owner deletes column | Resolves void | — |
| 2 | Admin deletes column | Resolves void | — |
| 3 | Non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 4 | Column not found | Throws `404` | `COLUMN_001` |
| 5 | Board not found (orphaned column) | Throws `404` | `BOARD_001` |
| 6 | User not found | Throws `404` | `USER_001` |
| 7 | Race condition — column already deleted | Throws `404` | `COLUMN_001` |

#### 4.3.4 MoveColumn

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Owner moves column to new order | Resolves void | — |
| 2 | Admin moves column | Resolves void | — |
| 3 | Non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 4 | `newOrder` is undefined | Throws `400` | `VAL_001` |
| 5 | `newOrder` is negative | Throws `400` | `VAL_001` |
| 6 | `newOrder` is not a number | Throws `400` | `VAL_001` |
| 7 | Column not found | Throws `404` | `COLUMN_001` |
| 8 | Board not found | Throws `404` | `BOARD_001` |
| 9 | User not found | Throws `404` | `USER_001` |

---

### 4.4 Task Use Cases

#### 4.4.1 CreateTask

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Board member creates task with all fields | Returns task object with auto-generated order | — |
| 2 | Board owner creates task | Returns task object | — |
| 3 | Admin creates task | Returns task object | — |
| 4 | Non-member, non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 5 | Missing title | Throws `400` | `VAL_002` |
| 6 | Missing boardId | Throws `400` | `VAL_002` |
| 7 | Missing columnId | Throws `400` | `VAL_002` |
| 8 | Title exceeds 150 characters | Throws `400` | `VAL_003` |
| 9 | Description exceeds 1000 characters | Throws `400` | `VAL_003` |
| 10 | Invalid priority value (e.g., `"urgent"`) | Throws `400` | `VAL_001` |
| 11 | Priority defaults to `"low"` when not provided | Task created with `priority: "low"` | — |
| 12 | Assignee not found | Throws `404` | `USER_001` |
| 13 | Assignee is not a board member or owner | Throws `400` | `VAL_003` |
| 14 | Column not found or not in specified board | Throws `404` | `COLUMN_001` |
| 15 | Board not found | Throws `404` | `BOARD_001` |
| 16 | User not found | Throws `404` | `USER_001` |
| 17 | Task created without assignee (null) | Task created with `assignee_id: null` | — |
| 18 | Title with whitespace is trimmed | Task created with trimmed title | — |

#### 4.4.2 UpdateTask

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Update title only | Returns task with new title, other fields unchanged | — |
| 2 | Update description only | Returns task with new description | — |
| 3 | Update priority only | Returns task with new priority | — |
| 4 | Update assignee to a valid member | Returns task with new assignee | — |
| 5 | Unassign by sending empty string | Task's `assignee_id` set to `null` | — |
| 6 | Unassign by sending null | Task's `assignee_id` set to `null` | — |
| 7 | No fields provided (all undefined) | Throws `400` | `VAL_002` |
| 8 | Title is empty after trimming | Throws `400` | `VAL_001` |
| 9 | Title exceeds 150 characters | Throws `400` | `VAL_003` |
| 10 | Description exceeds 1000 characters | Throws `400` | `VAL_003` |
| 11 | Invalid priority value | Throws `400` | `VAL_001` |
| 12 | Assignee not a member or owner | Throws `400` | `VAL_003` |
| 13 | Assignee not found in database | Throws `404` | `USER_001` |
| 14 | Non-member, non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 15 | Task not found | Throws `404` | `TASK_001` |
| 16 | User not found | Throws `404` | `USER_001` |
| 17 | Board not found | Throws `404` | `BOARD_001` |
| 18 | Race condition — task deleted before update | Throws `404` | `TASK_001` |

#### 4.4.3 DeleteTask

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Board owner deletes task | Resolves void | — |
| 2 | Admin deletes task | Resolves void | — |
| 3 | Board member (non-owner) attempts delete | Throws `403` | `BOARD_002` |
| 4 | Task not found | Throws `404` | `TASK_001` |
| 5 | User not found | Throws `404` | `USER_001` |
| 6 | Board not found | Throws `404` | `BOARD_001` |
| 7 | Race condition — concurrent delete | Throws `404` | `TASK_001` |

#### 4.4.4 MoveTask

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Board member moves task within same column | Resolves void | — |
| 2 | Board member moves task to different column (same board) | Resolves void | — |
| 3 | Owner moves task | Resolves void | — |
| 4 | Admin moves task | Resolves void | — |
| 5 | Non-member, non-owner, non-admin attempt | Throws `403` | `BOARD_002` |
| 6 | Missing targetColumnId | Throws `400` | `VAL_001` |
| 7 | `newOrder` is undefined or negative | Throws `400` | `VAL_001` |
| 8 | Task not found | Throws `404` | `TASK_001` |
| 9 | Target column not found | Throws `404` | `COLUMN_001` |
| 10 | Target column is on a different board | Throws `403` | `BOARD_002` |
| 11 | User not found | Throws `404` | `USER_001` |
| 12 | Board not found | Throws `404` | `BOARD_001` |

---

### 4.5 Middleware

#### 4.5.1 Auth Middleware (`protect`)

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | Valid Bearer token | Attaches `req.user.id` and calls `next()` | — |
| 2 | No Authorization header | Calls `next` with error `401` | `AUTH_004` |
| 3 | Authorization header without `Bearer` prefix | Calls `next` with error `401` | `AUTH_004` |
| 4 | Expired token | Calls `next` with error `401` | `AUTH_002` |
| 5 | Invalid/malformed token | Calls `next` with error `401` | `AUTH_003` |

#### 4.5.2 Error Handler

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | `AppError` instance | Returns correct status code, error code, and message |
| 2 | Mongoose `CastError` (invalid ObjectId) | Returns `400` with code `VAL_001` |
| 3 | MongoDB duplicate key error (code 11000) | Returns `409` with code `USER_002` |
| 4 | Generic unhandled error (dev mode) | Returns `500` with code `SERVER_001`, includes error message |
| 5 | Generic unhandled error (prod mode) | Returns `500` with code `SERVER_001`, generic message |

#### 4.5.3 Rate Limiter

| # | Test Case | Expected Result | Error Code |
|---|-----------|----------------|------------|
| 1 | API limiter allows up to 100 requests | Requests pass through | — |
| 2 | API limiter blocks 101st request | Returns `429` | `RATE_001` |
| 3 | Auth limiter allows up to 5 failed attempts | Requests pass through | — |
| 4 | Auth limiter blocks 6th failed attempt | Returns `429` | `RATE_001` |
| 5 | Auth limiter skips counting successful requests | Successful logins don't consume limit | — |

---

### 4.6 Utilities

#### 4.6.1 AppError

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | Creates error with code, message, statusCode | All properties correctly set |
| 2 | Is an instance of `Error` | `instanceof Error` returns `true` |

#### 4.6.2 JWT Utilities

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | `generateToken` creates valid JWT with user ID | Token decodes to include user ID |
| 2 | `verifyToken` with valid token | Returns decoded payload with `id` |
| 3 | `verifyToken` with expired token | Throws `TokenExpiredError` |
| 4 | `verifyToken` with invalid token | Throws error |

---

## 5. Integration Test Cases

Integration tests use **supertest** with the Express app and an **in-memory MongoDB** instance.

### 5.1 Auth Endpoints

| # | Endpoint | Method | Test Case | Expected Status |
|---|----------|--------|-----------|-----------------|
| 1 | `/api/auth/register` | POST | Register new user | `201` |
| 2 | `/api/auth/register` | POST | Duplicate email | `409` |
| 3 | `/api/auth/register` | POST | Missing fields | `400` |
| 4 | `/api/auth/login` | POST | Valid credentials | `200` |
| 5 | `/api/auth/login` | POST | Wrong password | `401` |
| 6 | `/api/auth/login` | POST | Non-existing user | `401` |
| 7 | `/api/auth/me` | GET | Valid token | `200` |
| 8 | `/api/auth/me` | GET | No token | `401` |

### 5.2 Board Endpoints

| # | Endpoint | Method | Test Case | Expected Status |
|---|----------|--------|-----------|-----------------|
| 1 | `/api/boards` | POST | Create board (authenticated) | `201` |
| 2 | `/api/boards` | POST | Create board (no auth) | `401` |
| 3 | `/api/boards` | GET | Get user boards | `200` |
| 4 | `/api/boards/:id` | GET | Get board (authorized) | `200` |
| 5 | `/api/boards/:id` | GET | Get board (unauthorized) | `403` |
| 6 | `/api/boards/:id` | PUT | Update board (owner) | `200` |
| 7 | `/api/boards/:id` | PUT | Update board (non-owner) | `403` |
| 8 | `/api/boards/:id` | DELETE | Delete board (owner) | `200` |
| 9 | `/api/boards/:id` | DELETE | Delete board (member) | `403` |
| 10 | `/api/boards/:id/members` | POST | Add members (owner) | `200` |
| 11 | `/api/boards/:id/members` | POST | Add members (non-owner) | `403` |
| 12 | `/api/boards/:id/members/:memberId` | DELETE | Remove member (owner) | `200` |
| 13 | `/api/boards/:id/members/:memberId` | DELETE | Remove board owner | `400` |

### 5.3 Column Endpoints

| # | Endpoint | Method | Test Case | Expected Status |
|---|----------|--------|-----------|-----------------|
| 1 | `/api/boards/:boardId/columns` | POST | Create column (owner) | `201` |
| 2 | `/api/boards/:boardId/columns` | POST | Create column (non-owner) | `403` |
| 3 | `/api/columns/:id` | PUT | Update column title | `200` |
| 4 | `/api/columns/:id` | DELETE | Delete column (owner) | `200` |
| 5 | `/api/columns/:id/move` | PUT | Move column | `200` |
| 6 | `/api/columns/:id/move` | PUT | Move column (negative order) | `400` |

### 5.4 Task Endpoints

| # | Endpoint | Method | Test Case | Expected Status |
|---|----------|--------|-----------|-----------------|
| 1 | `/api/boards/:boardId/columns/:columnId/tasks` | POST | Create task (member) | `201` |
| 2 | `/api/boards/:boardId/columns/:columnId/tasks` | POST | Create task (non-member) | `403` |
| 3 | `/api/tasks/:id` | PUT | Update task fields | `200` |
| 4 | `/api/tasks/:id` | PUT | Update with invalid priority | `400` |
| 5 | `/api/tasks/:id` | DELETE | Delete task (owner) | `200` |
| 6 | `/api/tasks/:id` | DELETE | Delete task (member) | `403` |
| 7 | `/api/tasks/:id/move` | PUT | Move task within board | `200` |
| 8 | `/api/tasks/:id/move` | PUT | Move to column on different board | `403` |

---

## 6. Business Rules to Verify

The following constants from `businessRules.ts` must be validated in respective test cases:

| Rule | Value | Verified In |
|------|-------|-------------|
| `MAX_TASKS_PER_COLUMN` | 50 | CreateTask (repository level) |
| `MAX_COLUMNS_PER_BOARD` | 20 | CreateColumn (repository level) |
| `MAX_BOARDS_PER_USER` | 15 | CreateBoard (repository level) |
| `MAX_TASK_DESCRIPTION_LENGTH` | 1000 | CreateTask, UpdateTask |
| `MAX_TASK_TITLE_LENGTH` | 150 | CreateTask, UpdateTask |
| `MAX_COLUMN_TITLE_LENGTH` | 150 | CreateColumn, UpdateColumn |
| `MAX_BOARD_TITLE_LENGTH` | 150 | CreateBoard, UpdateBoard |
| `MAX_PASSWORD_LENGTH` | 50 | RegisterUser, LoginUser |
| `MIN_PASSWORD_LENGTH` | 8 | RegisterUser, LoginUser |
| `MAX_EMAIL_LENGTH` | 255 | RegisterUser, LoginUser |
| `MAX_USERNAME_LENGTH` | 100 | RegisterUser |
| `MAX_MEMBERS_PER_BOARD` | 50 | AddMembers |
| `MAX_MEMBERS_PER_BATCH` | 20 | AddMembers |

---

## 7. Authorization Matrix

Summarizes **who can do what** — each rule must have corresponding test coverage:

| Action | Admin | Board Owner | Board Member | Non-Member |
|--------|-------|-------------|--------------|------------|
| Create Board | ✅ | ✅ | ✅ | ✅ |
| View Board | ✅ | ✅ | ✅ | ❌ |
| Update Board | ✅ | ✅ | ❌ | ❌ |
| Delete Board | ✅ | ✅ | ❌ | ❌ |
| Add Members | ✅ | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ |
| Create Column | ✅ | ✅ | ❌ | ❌ |
| Update Column | ✅ | ✅ | ❌ | ❌ |
| Delete Column | ✅ | ✅ | ❌ | ❌ |
| Move Column | ✅ | ✅ | ❌ | ❌ |
| Create Task | ✅ | ✅ | ✅ | ❌ |
| Update Task | ✅ | ✅ | ✅ | ❌ |
| Delete Task | ✅ | ✅ | ❌ | ❌ |
| Move Task | ✅ | ✅ | ✅ | ❌ |

---

## 8. Error Response Format

All error responses must follow this standard envelope:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Tests must assert that:
- `success` is always `false` on errors
- `code` matches the expected error code constant
- `message` is a non-empty string
- HTTP status code matches the expected value

---

## 9. Test Execution

### 9.1 Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (during development)
npm run test:watch
```

### 9.2 Coverage Targets

| Metric | Target |
|--------|--------|
| **Statements** | ≥ 80% |
| **Branches** | ≥ 75% |
| **Functions** | ≥ 85% |
| **Lines** | ≥ 80% |

### 9.3 CI Integration

Tests should be configured to run on every push and pull request via CI pipeline. A failing test should block merging.

---

## 10. Test Data Guidelines

### 10.1 Factory Helpers

Create reusable test data factory functions:

```typescript
// Example: tests/helpers/factories.ts
export const createMockUser = (overrides = {}) => ({
  id: 'user-id-1',
  name: 'Test User',
  email: 'test@example.com',
  password_hash: 'hashed_password',
  role: 'user' as const,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
});

export const createMockBoard = (overrides = {}) => ({
  id: 'board-id-1',
  title: 'Test Board',
  owner_id: 'user-id-1',
  members: [],
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
});
```

### 10.2 Naming Conventions

- Test files: `<SourceFileName>.test.ts`
- Describe blocks: Use class/function name — `describe('RegisterUserUseCase', () => {...})`
- Test names: Start with `should` — `it('should throw 400 when email is missing', ...)`

---

## 11. Dependencies to Install

```bash
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest mongodb-memory-server
```

---

## 12. Total Test Count Summary

| Module | Unit Tests | Integration Tests | Total |
|--------|-----------|-------------------|-------|
| Auth Use Cases | 28 | 8 | 36 |
| Board Use Cases | 47 | 13 | 60 |
| Column Use Cases | 33 | 6 | 39 |
| Task Use Cases | 49 | 8 | 57 |
| Middleware | 14 | — | 14 |
| Utilities | 6 | — | 6 |
| **Total** | **177** | **35** | **212** |
