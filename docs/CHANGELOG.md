# Changelog

All notable changes to the FlowState project documentation and implementation.

## [Sprint 1] - 2025-01-19

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