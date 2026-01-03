# Changelog

All notable changes to the FlowState project documentation and implementation.

## [Sprint 1] - 2025-01-03

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

### Deferred to Sprint 2
- GET /boards/:id (board details with columns and tasks)
- DELETE /boards/:id (board deletion)
- Pagination for board lists
- Member detail population