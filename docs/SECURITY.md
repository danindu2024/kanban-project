# Security Architecture

**Project:** FlowState (Enterprise Kanban)
**Version:** 1.0

## 1. Authentication Strategy
* **JWT (Access Token):** Short-lived (15 mins). Stored in memory (Frontend).
* **Refresh Token:** JWT Access Token only. 7-day expiration. Stored in frontend memory. User must re-login after expiration or page refresh. **HTTP-Only, Secure Cookie**. This prevents XSS attacks from stealing the session.

### Token Storage - Actual Implementation (Sprint 1)

**Current Strategy:**
- **Access Token:** 7-day JWT returned in JSON response body
- **Storage Location:** Frontend memory (Zustand store)
- **Trade-off:** Token lost on page refresh; user must re-login
- **XSS Protection:** Safe IF stored in memory only. NEVER use localStorage/sessionStorage.

**Why Not HTTP-Only Cookies (Sprint 1)?**
- Simpler implementation for MVP
- Adequate security when combined with short sessions
- Planned for Sprint 2 with refresh token implementation

**Security Implications:**
- Vulnerable to XSS if token accidentally stored in localStorage
- Page refresh requires re-authentication
- No token refresh mechanism

## 2 RBAC Matrix (Permissions)
| Action | Admin | Board Owner | Member | Public |
| :--- | :---: | :---: | :---: | :---: |
| **Create Board** | ✅ | ✅ | ❌ | ❌ |
| **Delete Board** | ✅ | ✅ | ❌ | ❌ |
| **Invite Users** | ✅ | ✅ | ❌ | ❌ |
| **Move Tasks** | ✅ | ✅ | ✅ | ❌ |
| **Edit Task Content**| ✅ | ✅ | ✅ | ❌ |
| **Delete Task** | ✅ | ✅ | ❌ | ❌ |

## 3: Conflict Resolution Strategy
* **Strategy:** "Last Write Wins"
* No version control or operational transformation
* Frontend implements optimistic updates
* On API failure, revert UI state and show toast notification

## 4. Threat Model
### 4.1 In-Scope Threats (Sprint 1)

* XSS attacks (JWT in memory, not localStorage)
* CSRF attacks (SameSite cookie attributes)
* SQL Injection equivalent (MongoDB parameterized queries)
* Brute force login (rate limiting)
* Unauthorized access (JWT + RBAC)

### 4.2 Out-of-Scope Threats (Later Sprints)

* DDoS attacks (handled by Render/Vercel)
* Advanced persistent threats
* Social engineering
* Physical security

## 5. Password Policy
* Minimum 8 characters
* No complexity requirements (Sprint 1)
* Bcrypt with salt rounds: 10
* No password reset flow (Sprint 1)

## 6. Token Management
* **Algorithm:** HS256
* **Expiration:** 7 days
* **Storage:** Frontend memory (Zustand store)
* **Invalidation:** Client-side only (logout clears store)

## 7. Input Validation
* All inputs sanitized
* MongoDB injection prevention via Mongoose
* Max field lengths enforced
* XSS prevention via React's default escaping

## 8. Known Security Limitations (Sprint 1)

### 8.1 Input Sanitization
**Status:** Not implemented in Sprint 1

**Current Behavior:**
- User-supplied text (names, task descriptions) stored without sanitization
- Could contain HTML/JavaScript if maliciously crafted

**Mitigation:**
- React's default JSX escaping prevents XSS in rendered output
- NEVER use `dangerouslySetInnerHTML` without sanitization

**Risk Level:** Low (if React best practices followed)

**Sprint 2 Plan:** Implement express-validator or DOMPurify

### 8.2 Race Condition in Registration
**Status:** Known issue, deferred to Sprint 2

**Scenario:**
- Two simultaneous registrations with same email
- MongoDB unique index catches duplicate
- User sees generic "INTERNAL_ERROR" instead of "USER_ALREADY_EXISTS"

**Mitigation:** 
- Occurs only under high concurrent load
- Database integrity maintained via unique index
- Acceptable for MVP with low user base

**Sprint 2 Plan:** Add try-catch for MongoDB E11000 errors

### 8.3 Password Policy
**Current Requirements:**
- Minimum 8 characters
- Maximum 128 characters
- No complexity requirements
- No common password checks

**Rationale:** Simplicity for academic users; complexity adds friction

**Sprint 2 Plan:** Optional strength indicator (not enforced)