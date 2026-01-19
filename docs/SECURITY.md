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
| **Add Members** | ✅ | ✅ | ❌ | ❌ |
| **Remove Members** | ✅ | ✅ | ❌ | ❌ |
| **Create column** | ✅ | ✅ | ❌ | ❌ |
| **Update column** | ✅ | ✅ | ❌ | ❌ |
| **Create Task** | ✅ | ✅ | ✅ | ❌ |
| **Add and change Priority/Assignee** | ✅ | ✅ | ✅ | ❌ |
| **Move Tasks** | ✅ | ✅ | ✅ | ❌ |
| **Edit Task Content**| ✅ | ✅ | ✅ | ❌ |
| **Delete Task** | ✅ | ✅ | ❌ | ❌ |

### 2.1 Board Authorization Model

#### Access Control Strategy:

* Authorization enforced through data filtering at repository layer
* User ID extracted from verified JWT token (cannot be manipulated)
* Repository queries automatically filter: `{ $or: [{ owner_id: userId }, { members: userId }] }`

#### Security Guarantees:

* Users can only see/access boards they own or are members of
* JWT middleware ensures `req.user.id` is authentic
* No additional permission checks needed at use case layer
* Task assignee is a board member

#### Trade-offs:

* Authorization is implicit in data model (not explicit permission checks)
* Suitable for simple ownership/membership model
* More complex permissions would require explicit authorization layer

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

### 8.2 Password Policy
**Current Requirements:**
- Minimum 8 characters
- Maximum 128 characters
- No complexity requirements
- No common password checks

**Rationale:** Simplicity for academic users; complexity adds friction

**Sprint 2 Plan:** Optional strength indicator (not enforced)

### delete user
If board owner is deleted board become orphaned. Need to implement a strategy

### 9. Race Condition Handling

#### 9.1 Registration
* **Status:** Solved using MongoDB unique indexes on `email`.

#### 9.2 Column & Task Ordering
* **Status:** Implemented in Sprint 1.
* **Strategy:** Pessimistic Locking via MongoDB Transactions.
* **Details:**
    * **Creating Columns:** The system locks the **Board** document before checking the "Max Columns" limit. This prevents race conditions where concurrent requests could bypass the limit of <MAX_TASKS_PER_COLUMN> columns.
    * **Creating Tasks:** The system locks the **Column** document before assigning an order number to a new task.

### 10. cast error handling
Gloabl Error handler throws 400 error
* **Examples:**

* `GET /boards/invalid-id` → 400 Bad Request

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
