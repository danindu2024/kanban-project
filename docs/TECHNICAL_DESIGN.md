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
   * **User Lookups:** If a userId provided by the auth middleware is not found in the database, the use case must throw AppError(USER_001, 'User not found', 404).
* **Global Error Handler:** The final safety net (Express Middleware). It Intercepts all unhandled errors and AppError instances to ensure a consistent JSON envelope and performs the following transformations:
   * `Mongoose CastError` → `400 Bad Request` (Invalid ID)
   * `Mongoose Duplicate Key Error (11000)` → `409 Conflict` (Code: USER_002)
   * **System Errors** (e.g., `bcrypt` hashing failure, DB connection loss) → `500 Internal Server Error` (Code: SERVER_001)

### 1.3 Performance Optimizations
* **Two-Phase Retrieval:** The `GetBoardUseCase` utilizes a "Verify-then-Fetch" strategy.
    1. **Phase 1 (Lightweight):** Fetches the `User` and `Basic Board` metadata in parallel (`Promise.all`) to perform fast authorization checks.
    2. **Phase 2 (Heavyweight):** The resource-intensive `getPopulatedBoard` (Virtual Population) is executed *only* after access is guaranteed.
    * *Benefit:* Prevents database strain by ensuring unauthorized requests do not trigger expensive aggregation/population queries.
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

### 2.3 Data Population Strategy (Virtuals)

To efficiently retrieve a full board hierarchy (Board → Columns → Tasks) without complex aggregation pipelines or multiple round-trips, the system uses **Mongoose Virtuals**.

* **Architecture:**
    * **Board Schema:** Defines a virtual field `columns` that links to the `Column` collection via `localField: '_id'` and `foreignField: 'board_id'`.
    * **Column Schema:** Defines a virtual field `tasks` that links to the `Task` collection via `localField: '_id'` and `foreignField: 'column_id'`.

* **Execution:**
    * The `BoardRepository.getPopulatedBoard` method uses deep population: `.populate({ path: 'columns', populate: { path: 'tasks' } })`.
    * This allows the backend to fetch the entire board state in a single database query while keeping the database normalized (Tasks and Columns are stored in separate collections).

* **Entity Mapping:**
    * The Repository is responsible for casting the raw Mongoose Document (with `_id`) into a clean Domain Entity (`PopulatedBoard` with `id`).
    * This ensures the Frontend receives a consistent, type-safe JSON structure without leaking database-specific implementation details (like `_v` or `_id`).

#### Type Safety & Casting
* **Constraint:** Mongoose's `populate()` method modifies the document structure at runtime (replacing IDs with Objects). TypeScript cannot statically analyze or verify these "inner" deeply populated fields (e.g., confirming that `columns[i].tasks` is an array of Documents rather than ObjectIds).
* **Strategy:** To bridge this gap, we use **Explicit Double Casting** (`doc as unknown as PopulatedBoardDoc`) within the Repository layer.
    * This is a necessary architectural trade-off: we manually assert the structure matches our `PopulatedBoardDoc` definition because the compiler cannot infer it automatically from the Mongoose model.

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
- **Normalization:** The system accepts mixed-case input (e.g., User@Gmail.com) to improve UX, but converts it to lowercase (user@gmail.com) in the Use Case layer before validation or storage

### 3.2 Password Policy

- **Minimum Length:** 8 characters
- **Maximum Length:** 50 characters (prevents DoS via bcrypt)
- **Complexity:** None (Sprint 1)
- **Hashing:** Bcrypt with 10 salt rounds
- **Whitespace Handling:**
  - **Trimming:** Leading and trailing whitespace is silently removed (e.g., `" pass "` becomes `"pass"`).
  - **Internal Spaces:** Spaces *inside* the password are **allowed and preserved** to support passphrases (e.g., `"correct horse battery staple"`).

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

#### C. Read-Time Race Conditions (Accepted Risk)
* **Scenario:** A user requests `GET /boards/:id` while simultaneously being removed from the board by the owner.
* **Race Condition (TOCTOU):** The system validates membership using the *Basic Board* in Phase 1. If the user is removed immediately after this check but before Phase 2 (Populated Fetch) completes, the system will proceed to fetch and return the board data.
* **Mitigation:** **"Secure Writes, Optimistic Reads"**
    * We accept that a removed user may view the board *one last time* in this specific millisecond window.
    * Strict serialization (locking the board during reading) is rejected to maintain high read throughput.

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
* **Strategy:** Defensive Normalization (Defense in Depth)
   * All string inputs (`name`, `email`, `title`, `description`, `password`) are sanitized using `(input || "").trim()` in the **Use Case layer** before processing
   * **Reason:** Prevents runtime crashes on `undefined` values and fixes accidental whitespace insertion (common on mobile keyboards).
   * **Special Note on Passwords:** While the system trims the *edges* of the password string to prevent login errors from invisible characters, it **strictly preserves** internal whitespace. This allows users to use secure passphrases.
   * **Lowercasing:** Email addresses are explicitly converted to lowercase in the **Use Case layer**.
      * **Reason:** Ensures business logic (like finding a user) operates on consistent data without relying solely on the database.
   * **Database Safety Net:** The Mongoose Schema also maintains `trim: true` and `lowercase: true`. This acts as a final fail-safe to guarantee data integrity even if the application layer logic is bypassed or bugged.
   * **Implementation:** Before performing Regex validation or Password Hashing, the system enforces strict length limits.
   * **Security Masking (Login Only):** While other endpoints (like Registration) may return specific `VAL_003` errors, the Login use case will catch length violations and throw a generic `AUTH_001` (Invalid email or password) error.
   * **Goal:** Fail fast to prevent DoS attacks while ensuring zero information leakage regarding internal validation constraints.

#### Resource Exhaustion Protection
* **Context:** Bcrypt and Regex operations are CPU-intensive.
* **Implementation:** Before performing Regex validation or Password Hashing, the system enforces strict length limits:
    * Email > 255 chars → throws `VAL_003`
    * Password > 50 chars → throws `VAL_003`
* **Goal:** Fail fast to prevent Denial of Service (DoS) attacks via massive payloads.

### 3.14 Rate Limiting Strategy
* **Global Limiter:**
   * **Window:** 15 minutes
   * **Max:** 100 requests per IP
   * **Store:** Memory (standard `express-rate-limit`)

* **Auth Limiter (Strict):**
   * **Target Endpoints:** Registration (`/register`) and Login (`/login`)
   * **Window:** 15 minutes
   * **Max:** 5 requests per IP
   * **Message:** "Too many login/registration attempts, please try again later."
   * **Rationale:** Mitigates brute-force attacks on user passwords and prevents bot-driven database bloat.