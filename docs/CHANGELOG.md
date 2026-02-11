# Changelog

All notable changes to the FlowState project documentation and implementation.

## [Sprint 1] - 2025-01-19

---
**Date:** February 10, 2026
**Feature:** Remove Member (`RemoveMemberUseCase`)

#### Added
* **Core Use Case:** Implemented `RemoveMemberUseCase` to allow Board Owners and Admins to remove members from a board.
* **Cleanup Logic:** Implemented side-effect where removing a member automatically unassigns them from all tasks on that board to prevent "ghost assignments".
* **Validation Strategy:**
    * **Authorization:** Strict RBAC ensuring only Board Owners or Admins can remove members.
    * **Safety Checks:** prevented removing the Board Owner (`VAL_001`).
    * **Membership Verification:** Validated that the target user is actually a member of the board before removal.

#### Documentation Updates
* **API_SPECIFICATION.md:**
    * Documented the `DELETE /api/boards/:id/members/:userId` endpoint.
    * Explicitly noted the task unassignment side effect.
* **TECHNICAL_DESIGN.md:**
    * Added **Section 4. Deferred Features**, explicitly deferring "Leave Board" (self-removal) and "Board Deletion" to Sprint 2+.
    * Documented the non-atomic nature of the "Remove Member + Unassign Task" operation as an accepted MVP risk.

---

### Security Enhancements
- **Email Validation:** Upgraded regex to RFC-compliant pattern
- **JWT Secret:** Added minimum 32-character length validation at startup
- **Token Error Handling:** Differentiate between expired (AUTH_002) and invalid (AUTH_003) tokens
- **Logging Protection:** Excluded `/auth/*` routes from Morgan request logging

### Documentation Updates
- Updated `SECURITY.md` to reflect actual token storage strategy (memory, not HTTP-Only cookies)
- Added "Known Security Limitations" section documenting Sprint 1 trade-offs
- Expanded `API_SPECIFICATION.md` with complete `/auth/me` endpoint documentation
- Added USER_001 and USER_002 error codes to API specification
- Updated `TECHNICAL_DESIGN.md` with validation rules and security constraints

### Known Issues (Deferred to Sprint 2)
- Race condition in user registration (MongoDB handles via unique index)
- No input sanitization (React JSX escaping provides baseline protection)
- No password complexity requirements (intentional for MVP)

### Architecture Decisions
- Chose JWT-in-JSON-body over HTTP-Only cookies for Sprint 1 simplicity
- Accepted "last write wins" for concurrent operations (no conflict resolution)
- Deferred refresh token implementation to Sprint 2

### Board Management Implementation
- **Board Creation:** Implemented POST /boards endpoint with title validation
- **Board Retrieval:** Implemented GET /boards endpoint (returns boards where user is owner/member)
- **Authorization:** Boards automatically filtered by ownership/membership via repository query
- **Response Fields:** All board responses include `created_at`, `members`, and `owner_id`

### Repository Layer
- **ObjectId Validation:** Removed premature validation checks; CastError handled by global error handler
- **Security:** Repository queries ensure users only access boards they own or are members of

### Error Handling
- **New Error Code:** AUTH_004 for unauthenticated user scenarios
- **CastError Handling:** MongoDB CastErrors converted to 400 Bad Request responses

### Task Management Implementation
- **Task Creation:** Implemented POST /tasks endpoint with comprehensive validation
- **Authorization:** Tasks can be created by board owner, admin, or board members only
- **Assignee Validation:** Assignees must be board owner or members; validated before task creation
- **Business Rules Enforcement:** 
  - Maximum 50 tasks per column (enforced via transaction)
  - Task title maximum 150 characters
  - Task description maximum 1000 characters
  - Priority defaults to 'low' if not provided
  - Empty/whitespace-only titles rejected
- **Concurrency Safety:** Task creation uses MongoDB transactions with pessimistic locking on parent Column
- **Validation Flow:** Multi-step validation (required fields → user exists → board exists → authorization → column exists → assignee validity → field constraints)
- **Error Handling:** 
  - Specific error codes for column not found (COLUMN_001)
  - Validation errors for empty titles, length violations, invalid priority
  - Authorization errors for non-members attempting task creation

### Column Management Implementation
- **Column Creation:** Implemented POST /columns endpoint with title validation
- **Authorization:** Only board owner or admin can create columns
- **Business Rules Enforcement:**
  - Maximum 20 columns per board (enforced via transaction)
  - Column title maximum 150 characters
  - Empty/whitespace-only titles rejected
- **Order Generation:** Auto-assigned as count of existing columns (0-indexed)

### Board Management Implementation
- **Board Creation:** Implemented POST /boards endpoint with title validation
- **Board Limits:** Enforced maximum of 15 boards per user to protect free-tier resources
- **Concurrency Strategy:** implemented "Check-then-Act" pattern for board limits (accepted race condition risk for MVP)
- **Board Retrieval:** Implemented GET /boards endpoint (returns boards where user is owner/member)
- **Authorization:** Boards automatically filtered by ownership/membership via repository query
- **Response Fields:** All board responses include `created_at`, `members`, and `owner_id`

### Database & Schema
- **Indexing:** Added index to `boards.owner_id` to optimize `countDocuments` checks and user-specific queries
- **Schema Refinement:** Enforced explicit empty array initialization for `members` on board creation

### Documentation Updates
- **Permissions (PRD/Security):** Updated requirements to allow *any* authenticated user to create boards (previously restricted to Admin/Owner)
- **Infrastructure:** Updated `INFRASTRUCTURE.md` to strictly require `FRONTEND_URL` in production for CORS
- **Technical Design:** - Documented "Repository Error Bubbling" strategy (no try/catch in repositories)
    - Added Board Quantity Limits to constraints table
    - Updated Indexing Strategy to include `boards.owner_id`
- **Security:** Updated RBAC matrix to reflect that standard Members can create boards

### Architecture Decisions
- **Error Handling Strategy:** Established pattern where Repositories allow DB errors to bubble up; logic errors handled in Use Cases; system errors handled by Global Error Handler.
- **Limit Enforcement:** Decided against ACID transactions for Board Limits (unlike Columns/Tasks) due to low impact of failure.

### Deferred to Sprint 2
- GET /boards/:id (board details with columns and tasks)
- DELETE /boards/:id (board deletion)
- Pagination for board lists
- Member detail population

---

**Date:** January 20, 2026
**Feature:** User Registration (`RegisterUserUseCase`)

#### Added
* **Core Use Case:** Implemented `RegisterUserUseCase` with strictly typed DTOs for request/response payloads.
* **Defensive Sanitization:** Added `(input || "").trim()` strategy to `name` and `email` fields 
* **Security Validation:**
    * Enforced password length constraints (Min: 8, Max: 50 characters), name constrints(Max: 100 chars), email constraints(Max: 255) via `businessRules` constants.

#### Changed
* **API Response Structure:** Updated `RegisterResponseDTO` to return nested `user` object (containing `id`, `name`, `email`, `role`, `created_at`) alongside the `token`, strictly adhering to API Specification v1.0.
* **Error Handling Strategy:**
    * Moved from "Out of Scope" to **"First Write Wins"** strategy for registration race conditions.
    * Relies on MongoDB `unique: true` index to throw duplicate key errors.
    * Global Error Handler updated to map MongoDB error code `11000` to API error `409 Conflict` (`USER_002`).

#### Documentation Updates
* **TECHNICAL_DESIGN.md:**
    * Added "Defensive Trimming" to Input Sanitization Strategy.
* **API_SPECIFICATION.md:**
    * Added `409 Conflict` (USER_002) response for duplicate emails.
    * Clarified `VAL_002` for missing/whitespace-only fields.
* **SECURITY.md:**
    * Updated Input Sanitization status to "Basic Trim Implemented".
    * Clarified race condition handling via DB constraints.

---
**Date** - 2025-01-25

### Board Details Implementation
- **Feature:** Implemented `GET /api/boards/:id` endpoint.
- **Architecture:** Implemented **Two-Phase Retrieval** strategy in `GetBoardUseCase`.
    - Phase 1: Parallel fetch of User and Basic Board for low-latency permission checks.
    - Phase 2: Deferred execution of `getPopulatedBoard` (Virtuals) to optimize resources.
- **Repository:** Added `getPopulatedBoard` method with deep population.
- **Security:** Enforced strict RBAC using lightweight metadata before loading heavy board content.
- **Type Safety:** Defined explicit `PopulatedBoard` and `PopulatedColumn` interfaces to handle nested data structures.

---

**Date:** January 28, 2026 Feature: User Login (`LoginUserUseCase`)

**Added**
* Core Use Case: Implemented LoginUserUseCase to handle user authentication and token generation.
* Security - Resource Protection: Added pre-emptive length validation checks for email (>255 chars) and password (>50 chars) to prevent DoS attacks via resource exhaustion (Bcrypt/Regex overloading).
* Security - Enumeration Prevention: Implemented a "Generic Error Strategy" for the Login endpoint. Validation violations (e.g., password too short/long) now throw a generic AUTH_001 (Invalid email or password) instead of specific validation errors to prevent attackers from probing internal business rules.

**Changed**
* Sanitization Logic: Applied strict defensive sanitization to login inputs:
* Email: Trimmed and converted to lowercase to ensure case-insensitive matching.
* Password: Trimmed leading/trailing whitespace (preserving internal spaces).
* Error Handling: Updated VAL_002 error message to "Missing required fields" to strictly match the implementation and API Specification.

**Documentation Updates**
* API_SPECIFICATION.md:
    * Updated POST `/auth/login` error responses to reflect the generic `AUTH_001` strategy.
    * Corrected the `VAL_002` error description in the Error Codes Reference.

* TECHNICAL_DESIGN.md:
Documented the security exception for Login validation (masking errors vs. fail-fast).

* SECURITY.md:
Updated Error Codes Reference to include "violation of field length limits" as a cause for AUTH_001.

---
**Date:** January 28, 2026 
**Feature:** Get Current User (`api/auth/me`)

#### Added
* **Core Use Case:** Implemented functionality to retrieve the currently authenticated user's profile data.
* **Token Validation:** Integrated JWT verification middleware to extract and validate the `userId` from the Authorization header.

#### Changed
* **Security - Identity Verification:** Implemented a mandatory database lookup to ensure the user still exists. If the `userId` in the JWT is valid but the user has been deleted from the database, the system now throws a specific `USER_001` (User not found) error.
* **Error Handling:** * Distinguished between session issues: `AUTH_002` for expired tokens and `AUTH_003` for tampered/invalid signatures.
    * Standardized the response to strictly return `id`, `name`, `email`, and `role`, preventing the leakage of sensitive fields like `password_hash`.

#### Documentation Updates
* **API_SPECIFICATION.md:** Finalized the `200 OK` response structure and added the `401 Unauthorized` error scenarios for the `/me` endpoint.
* **TECHNICAL_DESIGN.md:** Documented the "User Lookup" requirement in the Error Handling Strategy to ensure consistency across all authenticated routes.

---
**Date:** February 05, 2026
**Feature:** Task Update (`UpdateTaskUseCase`)

#### Added
* **Core Use Case:** Implemented `UpdateTaskUseCase` to handle partial updates for task details (`title`, `description`, `priority`, `assignee_id`).
* **Unassign Logic:** Implemented specific handling for `assignee_id` where empty strings (`""`) or whitespace-only strings are automatically converted to `null`, enabling users to "unassign" tasks via standard form inputs.
* **Validation Strategy:**
    * **Authorization:** Strict RBAC ensuring only Board Owners, Admins, or Board Members can update tasks.
    * **Assignee Integrity:** Validates that new assignees are valid existing users AND are members/owners of the board.
    * **Minimum Payload:** Enforced a check to ensure at least one updateable field is provided (`VAL_002` if empty).
* **Architecture - Single Source of Truth:** Refactored `Task` entity to use the "Tuple-to-Union" pattern for `Priority`, ensuring runtime validation arrays and compile-time types are always in sync.

#### Changed
* **Optimization:** Implemented an optimized validation flow that skips redundant "Task-to-Column-to-Board" consistency checks. The system relies on the immutable relationship established at creation, fetching only the **Board** to verify user access permissions.

#### Documentation Updates
* **API_SPECIFICATION.md:**
    * Documented the "Unassign" behavior (accepting `null` or `""`).
* **TECHNICAL_DESIGN.md:**
    * Updated "Input Sanitization Strategy" to formally include the "Empty String to Null" conversion rule for optional reference fields.
* **DEVELOPMENT_GUIDE.md:**
    * Added **Section 4.4 Constants & Union Types**, documenting the "Tuple-to-Union" pattern for managing enums like `Priority`.

---
**Date:** February 08, 2026
**Feature:** Update Column (`UpdateColumnUseCase`)

#### Added
* **Core Use Case:** Implemented `UpdateColumnUseCase` to handle column renaming with strict authorization (Board Owner/Admin only).
* **Performance Optimization:** Implemented **Parallel Execution** strategy using `Promise.all` to fetch User and Column data simultaneously, reducing latency for permission checks.
* **Reordering Logic:** Implemented `moveColumn` in the repository using atomic `$inc` operations to handle "Shift Up/Down" logic for drag-and-drop reordering.

#### Changed
* **Validation Strategy:**
    * **Sanitization:** Applied defensive `trim()` to column titles to prevent whitespace-only updates.
    * **Error Handling:** Standardized "Title Too Long" errors to return `VAL_003` (Business Rule Violation) to align with API Specifications.
* **Refactor:**
    * Updated `ColumnRepository` comments to explicitly document transaction boundaries and concurrency safety.
    * Standardized Response DTO to include `updated_at`.

#### Documentation Updates
* **API_SPECIFICATION.md:**
    * Defined comprehensive Success (`200 OK`) and Error responses (Validation, Forbidden, Not Found) for the Update Column endpoint.
* **TECHNICAL_DESIGN.md:**
    * Added **Section 3.12.C**, documenting the "Shift" logic/strategy used for Column and Task reordering (Drag & Drop).

---
**Date:** February 08, 2026
**Feature:** Board Update (`UpdateBoardUseCase`)

#### Added
* **Core Use Case:** Implemented `UpdateBoardUseCase` to handle board renaming with strict authorization (Board Owner/Admin only).
* **Performance Optimization:** Implemented **Parallel Execution** strategy using `Promise.all` to fetch User and Board data simultaneously, reducing latency for permission checks.
* **Validation Strategy:**
    * **Sanitization:** Applied defensive `trim()` to board titles to prevent whitespace-only updates.
    * **Single Source of Truth:** Refactored validation logic to use `businessRules` constants for title length limits, replacing hardcoded values.

#### Changed
* **Response Structure:** Updated the Board Response DTO to strictly include the `updated_at` timestamp, ensuring clients receive the most recent modification time.
* **Error Handling:** Standardized validation errors to return `VAL_002` (Missing Fields) and `VAL_003` (Business Rule Violation) to strictly align with the API Specification.

#### Documentation Updates
* **API_SPECIFICATION.md:**
    * Updated **Section 3.5** to explicitly document the `VAL_002` and `VAL_003` error scenarios for the Update Board endpoint, closing a gap between implementation and documentation.

---

**Date:** February 10, 2026
**Feature:** Add Board Member (`AddMembersUseCase`)

#### Added
* **Core Use Case:** Implemented `AddMembersUseCase` to allow Board Owners and Admins to add new members to a board.
* **Validation Strategy:**
    * **Batch Limit:** Enforced a maximum limit on the number of members that can be added in a single request (`VAL_003` if exceeded), preventing DoS attacks.
    * **Board Limit:** Checked if the total number of members (existing + new) exceeds `MAX_MEMBERS_PER_BOARD`.
    * **Sanitization:** Applied defensive sanitization (trimming, null removal, deduplication) to the input array.
    * **Existence Checks:** Validated that both the Board and all Target Users exist (`USER_001` or `BOARD_001` if not found).
    * **Membership Integrity:**
        * Prevented adding the Board Owner as a member (`VAL_003`).
        * Prevented adding users who are already members (`VAL_001`).
* **Concurrency Safety:**
    * **Defensive Check:** Implemented a final "Check-then-Act" verification to ensure the board still exists before committing the update.

#### Changed
* **Response Structure:** Updated `AddMemberResponseDTO` to include `updated_at` timestamp, ensuring clients receive the most recent modification time.
* **Error Handling:**
    * Added specific `VAL_002` error for "Whitespace-only/Empty" member input after sanitization.
    * Standardized error messages to align with API Specification.

#### Documentation Updates
* **API_SPECIFICATION.md:**
    * Added documentation for the "Empty/Whitespace only" `VAL_002` error.
    * Added documentation for the "Batch Limit Exceeded" `VAL_003` error.

---

**Date:** February 10, 2026
**Feature:** Move Task (`MoveTaskUseCase`)

#### Added
* **Core Use Case:** Implemented `MoveTaskUseCase` to handle task reordering (DnD) within columns and moving tasks between columns.
* **Concurrency Safety:**
    * Implemented **Pessimistic Locking** via MongoDB Transactions (`session.startTransaction()`) to prevent race conditions during Move/Reorder.
    * Uses "Shift Algorithm" with atomic `$inc` operations to maintain generic order (no gaps/duplicates).
* **Validation Strategy:**
    * **Authorization:** Strict RBAC ensuring only Admins, Board Owners, or Board Members can move tasks.
    * **Boundary Checks:** Validated `newOrder` against current task counts to prevent out-of-bounds errors.
    * **Cross-Board Prevention:** Explicitly prevented moving tasks to columns on different boards (`VALIDATION_ERROR`).

#### Documentation Updates
* **API_SPECIFICATION.md:**
    * Updated **Section 5.2** with complete Authorization rules, Behavior descriptions (Shift logic), and specific Success/Error responses.
* **TECHNICAL_DESIGN.md:**
    * Added **Section 3.12 Move Logic**, detailing the specific "Same Column" vs "Cross Column" shift algorithms and the Transactional/Locking strategy used.

---

**Date:** February 11, 2026
**Feature:** Move Column (`MoveColumnUseCase`)

#### Added
* **Core Use Case:** Implemented `MoveColumnUseCase` to handle column reordering via drag-and-drop.
* **Concurrency Safety:**
    * Implemented **Pessimistic Locking** via MongoDB Transactions (`session.startTransaction()`) to prevent race conditions during Move/Reorder.
    * Uses "Shift Algorithm" with atomic `$inc` operations to maintain generic order (no gaps/duplicates).
* **Validation Strategy:**
    * **Authorization:** Strict RBAC ensuring only Admins or Board Owners can move columns.
    * **Boundary Checks:** explicit boundary checks (`newOrder` <= `columnCount`) performed **inside the repository transaction** to guarantee data integrity against concurrent modifications.

#### Documentation Updates
* **API_SPECIFICATION.md:**
    * Updated **Section 4.2** with complete Authorization rules, Behavior descriptions (Shift logic), and specific Success/Error responses.
    * Explicitly documented the shifting behavior (Up/Down) for reordering.
* **TECHNICAL_DESIGN.md:**
    * Updated **Section 3.12** to explicitly mention that boundary checks for move operations occur within the repository transaction.