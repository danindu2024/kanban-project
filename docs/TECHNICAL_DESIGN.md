# Technical Design Document (TDD)

**Project:** FlowState (Enterprise Kanban)
**Version:** 1.0

## 1. System Architecture

The backend follows **Clean Architecture** principles to ensure decoupling between business logic and infrastructure.

### 1.1 High-Level Data Flow

`Request` -> `Controller` -> `Use Case` -> `Repository Interface` -> `Mongoose Implementation` -> `MongoDB`

### 1.2 Error Handling Strategy
* **Repository Layer:** Does **not** catch database errors (e.g., connection failures, validation errors). All exceptions bubble up.
* **Use Case Layer:** Catches specific functional errors (e.g., "Board not found" logic) but allows unexpected system errors to bubble up.
* **Global Error Handler:** The final safety net (Express Middleware). It intercepts all unhandled errors and performs the following transformations:
   * `Mongoose CastError` → `400 Bad Request` (Invalid ID)
   * `Mongoose Duplicate Key Error (11000)` → `409 Conflict` (Code: USER_002)
   * Generic Errors → `500 Internal Server` Error

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
| `owner_id` | ObjectId        | Ref: Users (indexed)      |
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
- **boards.owner_id** - Standard index
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
- **Maximum Length:** 50 characters (prevents DoS via bcrypt)
- **Complexity:** None (Sprint 1)
- **Hashing:** Bcrypt with 10 salt rounds

### 3.3 Field Length Limits

| Field             | Max Length | Min Length | Reason                                 |
| ----------------- | ---------- | ---------- |-------------------------------------- |
| Name              | 100 chars  | 1 char | Prevent database bloat                 |
| Email             | 255 chars  | 6 chars (approx) | RFC 5321 standard, validated via Regex |
| Password          | 50 chars   | 8 chars | Bcrypt performance limit with buffer   |
| Board Title       | 150 chars  | 1 char (non-whitespace) | Prevent UI overflow and database bloat |
| Column Title      | 150 chars  | 1 char (non-whitespace) | Prevent UI overflow and database bloat |
| Task Title        | 150 chars  | 1 char (non-whitespace) | Prevent UI overflow and database bloat |
| Task Description  | 1000 chars | 0 chars (Optional) | Prevent UI overflow and database bloat |
| columns per board | 20 columns | 0 columns | Prevent UI overflow                    |
| tasks per column  | 50 tasks   | 0 tasks | Prevent UI overflow                    |
| boards per user   | 15 boards  | 0 boards | Prevent database bloat                  |

### 3.4 JWT Configuration

- **Algorithm:** HS256
- **Expiration:** 7 days
- **Secret Length:** Minimum 32 characters (enforced at startup)
- **Token Differentiation:**
  - `TokenExpiredError` → AUTH_002
  - `JsonWebTokenError` → AUTH_003

### 3.5 Board Validation Rules

- **Title:** Required, maximum 150 characters. Leading/trailing whitespace is trimmed
- **Owner ID:** Derived from JWT and validated against the User collection to ensure existence
- **Members Array:** Initialized as empty array on creation
- **ObjectId Validation:** Handled at infrastructure layer via CastError
- **Quantity Limit:**
   * **Constraint:** Maximum 15 boards per user.
   * **Enforcement:** "Check-then-Act" strategy. The backend counts existing boards (countDocuments) before creation.
   * **Concurrency:** No transaction required for MVP (Business Decision). "Double-click" race conditions are acceptable risks for this specific feature.

### 3.6 Column Validation Rules

* **Authorization:**
   * **Actor:** Only users with role: 'admin' OR the owner_id of the parent board can create columns.
   * **Enforcement:** Use Case layer check before database interaction.

* **Title Constraints:**
   * **Required:** Yes.
   * **Content:** Must contain at least one non-whitespace character. Validated via title.trim().length > 0.
   * **Max Length:** 150 characters (defined in businessRules).
   * **Whitespace:** Leading/trailing whitespace is ignored during validation checks and Schema trimming is enabled.

* **Board Constraints:**
   * **Existence:** Board ID must refer to a valid, existing board (checked via BoardRepository).
   * **Limit Enforcement:** Maximum 20 columns per board.
   * **Implementation:** Checked transactionally in ColumnRepository after acquiring a lock on the Board document.
   * **Concurrency:** Uses a "Count-then-Write" strategy guarded by a parent Board lock to prevent race conditions exceeding the limit.

### 3.7 Authorization Model for Boards

- **Board Access:** Users can only retrieve boards where they are owner OR member
- **Board Creation:** Any authenticated user can create boards (they become owner)
- **Board Updates:** Only board owner or admin can update board metadata
- **Member Management:** Only board owner or admin can add/remove members
- **Board Deletion:** Only board owner or admin can delete
- **Implementation:** Authorization enforced via use case layer checks

### 3.8 Member Management Rules

#### Add Member:

- User ID must exist in system (USER_001 if not)
- User cannot already be a member (VAL_001 if duplicate)
- Owner is automatically a member (implicit, not in array)

#### Remove Member:

- User ID must be in members array (VAL_001 if not)
- Cannot remove board owner (VAL_001)
- Removing last member is allowed (owner remains)

### 3.9 Task Authorization Model

- **Create Task:** Allowed for Board Owner, Admin, and any user in the board's `members` array.
- **Update Task:** Allowed for Board Owner, Admin, and any user in the board's `members` array.
- **Assignee Validation:** When updating `assignee_id`, the backend must verify the target user is a member of the board.
- **Delete Task:** Restricted to Board Owner or Admin only.
- **Move Task:** Allowed for Board Owner, Admin, and any user in the board's `members` array.

### 3.10 Concurrency Strategy (Task Ordering)

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

**Retry Mechanism (MVP):** For Sprint 1, the system does not automatically retry transactions on `WriteConflict`. Errors are propagated to the client, requiring the user to manually retry the operation.

**Exhaustion:** N/A for Sprint 1.

- **Constraints:** Hard limit of 50 tasks per column to minimize lock contention duration.

### 3.11 Task Validation Rules
* **Authorization:**
   * **Creator:** Must be an Admin, the Board Owner, or a listed Board Member.
   * **Enforcement:** Use Case layer check before processing. Returns `403 Forbidden` if unauthorized.

* **Assignee Constraints:**
   * **Validity:** If provided, the Assignee ID must correspond to a valid user.
   * **Membership:** The Assignee must be the Board Owner or a Board Member. You cannot assign a task to a user who is not part of the board.

* **Field Constraints:**
   * **Title:** Required. Must contain at least 1 non-whitespace character. Max 150 characters.
   * **Description:** Optional. If provided, leading/trailing whitespace is trimmed. Max 1000 characters.
   * **Priority:** Defaults to `'low'`. Must be one of `['low', 'medium', 'high']`.

* **Column & Board Consistency:**
   * **Linkage:** The target Column must explicitly belong to the target Board (column.board_id === boardId).

* **Limit Enforcement:**
   * **Constraint:** Maximum 50 tasks per column.
   * **Implementation:** Enforced via MongoDB Transaction with Pessimistic Locking.
   * **Mechanism:** The system locks the parent Column document (via findByIdAndUpdate) before counting existing tasks to prevent concurrent inserts from exceeding the limit.

### 3.12 Order Generation Logic
The system enforces sequential ordering (0-based index) for both Columns and Tasks to support consistent UI rendering and drag-and-drop operations.

* **Column Ordering:**
   * **Logic:** New Order = Count of Existing Columns
   * **Mechanism:** Inside the creation transaction, the system counts existing columns for the target board (countDocuments). This count becomes the order index for the new column.
   * **Concurrency Safety:** Relies on the Board Lock (acquired via BoardModel.findByIdAndUpdate) to ensure the count is accurate and stable before writing the new column.

* **Task Ordering:**
   * **Logic:** New Order = Count of Existing Tasks in Column
   * **Mechanism:** Inside the creation transaction, the system counts existing tasks for the target column (countDocuments). This count becomes the order index for the new task.
   * **Concurrency Safety:** Relies on the Column Lock (acquired via ColumnModel.findByIdAndUpdate) to ensure no other tasks are inserted simultaneously, preventing duplicate order indices.

### 3.13 Input Sanitization Strategy
* **Strategy:** Defensive Trimming
   * All string inputs (`name`, `email`) are sanitized using `(input || "").trim()` before any presence or format validation.
   * **Reason:** Prevents runtime crashes on `undefined` values and ensures " " (whitespace only) is treated as a missing field during validation.