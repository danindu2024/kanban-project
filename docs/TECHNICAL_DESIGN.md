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

| Field         | Type     | Description                                                             |
| :------------ | :------- | :---------------------------------------------------------------------- |
| `_id`         | ObjectId | Unique Identifier                                                       |
| `column_id`   | ObjectId | Ref: Columns (Indexed)                                                  |
| `board_id`    | ObjectId | Ref: Boards (For faster querying)                                       |
| `title`       | String   | Task summary                                                            |
| `description` | String   | Markdown supported                                                      |
| `priority`    | String   | ENUM: ['low', 'medium', 'high'] - Default: 'low'                        |
| `assignee_id` | ObjectId | Ref: Users (Nullable, Single assignee only)                             |
| `order`       | Number   | For drag-and-drop positioning. Note: Managed via Mutex Transactio(0-20) |

### 2.2: Indexing Strategy

- **users.email** - Unique index
- **columns.board_id** - Standard index
- **tasks.column_id** - Standard index
- **tasks.board_id** - Standard index
- No **compound indexes** in Sprint 1

## 3. Validation & Security Rules

### 3.1 Email Validation

**Regex Pattern:**

```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

**Requirements:**

- Alphanumeric username with allowed special chars (`._%+-`)
- Valid domain structure
- Minimum 2-character TLD

### 3.2 Password Policy

- **Minimum Length:** 8 characters
- **Maximum Length:** 128 characters (prevents DoS via bcrypt)
- **Complexity:** None (Sprint 1)
- **Hashing:** Bcrypt with 10 salt rounds

### 3.3 Field Length Limits

| Field             | Max Length | Reason                                 |
| ----------------- | ---------- | -------------------------------------- |
| Name              | 100 chars  | Prevent database bloat                 |
| Email             | 255 chars  | RFC 5321 standard                      |
| Password          | 50 chars   | Bcrypt performance limit with buffer   |
| Board Title       | 150 chars  | Prevent UI overflow and database bloat |
| Column Title      | 150 chars  | Prevent UI overflow and database bloat |
| Task Title        | 150 chars  | Prevent UI overflow and database bloat |
| Task Description  | 1000 chars | Prevent UI overflow and database bloat |
| columns per board | 20 columns | Prevent UI overflow                    |
| tasks per column  | 50 tasks   | Prevent UI overflow                    |

### 3.4 JWT Configuration

- **Algorithm:** HS256
- **Expiration:** 7 days
- **Secret Length:** Minimum 32 characters (enforced at startup)
- **Token Differentiation:**
  - `TokenExpiredError` → AUTH_002
  - `JsonWebTokenError` → AUTH_003

### 3.5 Board Validation Rules

- **Title:** Required, maximum 100 characters
- **Owner ID:** Derived from JWT, not validated (trusted server data)
- **Members Array:** Initialized as empty array on creation
- **ObjectId Validation:** Handled at infrastructure layer via CastError

### 3.6 Authorization Model for Boards

- **Board Access:** Users can only retrieve boards where they are owner OR member
- **Board Creation:** Any authenticated user can create boards (they become owner)
- **Board Updates:** Only board owner or admin can update board metadata
- **Member Management:** Only board owner or admin can add/remove members
- **Board Deletion:** Only board owner or admin can delete
- **Implementation:** Authorization enforced via use case layer checks

### 3.7 Member Management Rules

#### Add Member:

- User ID must exist in system (USER_001 if not)
- User cannot already be a member (VAL_001 if duplicate)
- Owner is automatically a member (implicit, not in array)

#### Remove Member:

- User ID must be in members array (VAL_001 if not)
- Cannot remove board owner (VAL_001)
- Removing last member is allowed (owner remains)

### 3.8 Task Authorization Model

- **Create Task:** Allowed for Board Owner, Admin, and any user in the board's `members` array.
- **Update Task:** Allowed for Board Owner, Admin, and any user in the board's `members` array.
- **Assignee Validation:** When updating `assignee_id`, the backend must verify the target user is a member of the board.
- **Delete Task:** Restricted to Board Owner or Admin only.
- **Move Task:** Allowed for Board Owner, Admin, and any user in the board's `members` array.

### 3.9 Concurrency Strategy (Task Ordering)

- **Problem:** Sequential ordering (1, 2, 3) requires atomic "Read-Count-Write" operations.
- **Solution:** Pessimistic Locking (Mutex) via MongoDB Transactions.
- **Implementation:**

#### A. Task Ordering (Pessimistic Locking)
* **Context:** Sequential ordering (1, 2, 3) requires atomic "Read-Count-Write" operations.Enforcing the "Max 50 taskss" limit requires preventing concurrent writes that might exceed the limit (e.g., two users creating the 20th column simultaneously).
* **Solution:** Lock parent **Column** document.
* **Implementation:**
  1. Start Transaction.
  2. Lock Column (update `updated_at`).
  3. Count existing  tasks
  4. If count >= <MAX_TASKS_PER_COLUMN>, Abort Transaction (Business Rule Violation)
  5. Else, Create task with `order = count`.
  6. Commit.

#### B. Column Creation & Limits (Board Locking)
* **Context:** Enforcing the "Max 20 Columns" limit requires preventing concurrent writes that might exceed the limit (e.g., two users creating the 20th column simultaneously).
* **Solution:** Lock parent **Board** document.
* **Implementation:**
  1. Start Transaction.
  2. Lock Board (update `updated_at`) via `BoardModel.findByIdAndUpdate`.
  3. Count existing columns.
  4. If count >= <MAX_COLUMNS_PER_BOARD>, Abort Transaction (Business Rule Violation).
  5. Else, Create Column with `order = count`.
  6. Commit.

- **Failure Handling:**

**Atomic Rollback:** If any step fails (e.g., lock timeout, write conflict), the entire transaction aborts. No task is created, and the column state remains unchanged (ACID compliance).

**Retry Mechanism:** On transient errors (specifically `WriteConflict`), the system automatically retries the operation (up to 3 times) before giving up.

**Exhaustion:** If retries fail due to high contention, the request is rejected with an error (`409 Conflict` or `500`), ensuring no duplicate orders or gaps are created.

- **Constraints:** Hard limit of 50 tasks per column to minimize lock contention duration.
