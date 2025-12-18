# Security Architecture

**Project:** FlowState (Enterprise Kanban)
**Version:** 1.0

## 1. Authentication Strategy
* **JWT (Access Token):** Short-lived (15 mins). Stored in memory (Frontend).
* **Refresh Token:** JWT Access Token only. 7-day expiration. Stored in frontend memory. User must re-login after expiration or page refresh. **HTTP-Only, Secure Cookie**. This prevents XSS attacks from stealing the session.

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