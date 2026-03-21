<div align="center">

# ⚙️ FlowState — Backend Server

### _Clean Architecture · ACID Transactions · Zero Framework Lock-in_

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-v5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Transactions-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Jest](https://img.shields.io/badge/Jest-v30-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture Deep Dive](#-architecture-deep-dive)
- [Domain Model](#-domain-model)
- [Use Cases](#-use-cases)
- [Database Design](#-database-design)
- [Security Model](#-security-model)
- [Error Handling](#-error-handling)
- [Concurrency & Transactions](#-concurrency--transactions)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Configuration](#-configuration)

---

## 🎯 Overview

The FlowState backend is a **RESTful API** built with Node.js and TypeScript, following **Clean Architecture** (also known as Hexagonal Architecture or Ports & Adapters). Every design decision from folder structure to error handling is intentional and documented.

### Key Engineering Decisions

| Decision               | Why                                                                                                                                                      |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clean Architecture** | Decouples business logic from infrastructure (Mongoose/Express), ensuring the domain layer remains testable and framework-agnostic.                      |
| **Repository Pattern** | Abstracts database complexity (e.g., `ObjectId` casting, virtual population) to ensure Use Cases operate on pure, type-safe entities.                    |
| **Use Case Classes**   | Enforces the Single Responsibility Principle by encapsulating specific business rules (e.g., `MoveTask`, `RegisterUser`) separate from HTTP controllers. |
| **ACID Transactions**  | Uses Pessimistic Locking to prevent race conditions during concurrent operations like task reordering (Drag & Drop) and limit enforcement.               |
| **Typed Error System** | Standardizes API responses using a central AppError class and specific error codes (e.g., `VAL_003`) to decouple UI logic from backend exceptions.       |

---

## 🧅 Architecture Deep Dive

The codebase implements a strict **4-layer architecture** where dependencies flow inward:

```
                    ┌──────────────────────┐
                    │     Domain Layer     │  ← Pure TypeScript
                    │   Entities + Repos   │    No imports. No frameworks.
                    │     (Interfaces)     │    Just business objects.
                    └──────────┬───────────┘
                               │ implements
                    ┌──────────▼───────────┐
                    │  Application Layer   │  ← Orchestration
                    │     (Use Cases)      │    Validates, authorizes,
                    │                      │    coordinates operations.
                    └──────────┬───────────┘
                               │ calls
                    ┌──────────▼───────────┐
                    │   Adapters Layer     │  ← Translation
                    │ Controllers + Routes │    HTTP ↔ Use Case mapping.
                    │                      │    Request parsing, response formatting.
                    └──────────┬───────────┘
                               │ uses
                    ┌──────────▼───────────┐
                    │ Infrastructure Layer │  ← Implementation Details
                    │   Mongoose Models    │    DB connections, schemas,
                    │ Repo Implementations│    data mapping (ObjectId → string).
                    └──────────────────────┘
```

### The Dependency Rule in Practice

```typescript
// ✅ Use Case depends on Domain Interface (inner layer)
class CreateBoard {
  constructor(
    private boardRepo: IBoardRepository, // Interface, not Mongoose
    private userRepo: IUserRepository, // Interface, not Mongoose
  ) {}
}

// ✅ Infrastructure implements Domain Interface
class BoardRepository implements IBoardRepository {
  // Mongoose-specific code lives here—and ONLY here
}

// ❌ This would NEVER happen:
// Domain Entity importing from Mongoose
```

### Directory Mapping

```
server/src/
├── domain/                         ← INNERMOST LAYER
│   ├── entities/
│   │   ├── User.ts                 ← Pure TypeScript interface
│   │   ├── Board.ts                ← Board + PopulatedBoard types
│   │   ├── Column.ts               ← Column entity definition
│   │   └── Task.ts                 ← Task entity with priority enum
│   └── repositories/
│       ├── IUserRepository.ts      ← Contract: what, not how
│       ├── IBoardRepository.ts     ← Includes getPopulatedBoard()
│       ├── IColumnRepository.ts    ← Transactional create/delete
│       └── ITaskRepository.ts      ← Move + cross-column operations
│
├── use-cases/                      ← APPLICATION LAYER
│   ├── auth/                       ← Register, Login, GetCurrentUser
│   ├── boards/                     ← CRUD + Member Management
│   ├── column/                     ← Create, Update, Delete, Move
│   └── task/                       ← Create, Update, Delete, Move
│
├── controllers/                    ← ADAPTERS LAYER
│   ├── authController.ts
│   ├── boardController.ts
│   ├── columnController.ts
│   └── taskController.ts
│
├── routes/                         ← ADAPTERS LAYER
│   ├── authRoutes.ts
│   ├── boardRoutes.ts
│   ├── columnRoutes.ts
│   └── taskRoutes.ts
│
├── infrastructure/                 ← OUTERMOST LAYER
│   ├── db.ts                       ← MongoDB connection
│   ├── models/                     ← Mongoose schemas + virtuals
│   └── repositories/               ← IBoardRepository → Mongoose
│
├── middleware/
│   ├── authMiddleware.ts           ← JWT verification guard
│   ├── errorHandler.ts             ← Global error interceptor
│   └── rateLimiter.ts              ← API + Auth-specific limiters
│
├── constants/
│   ├── errorCodes.ts               ← Centralized error code registry
│   └── businessRules.ts            ← Configurable limits & thresholds
│
└── utils/
    ├── AppError.ts                 ← Custom error class
    └── env.ts                      ← Environment variable validation
```

---

## 📊 Domain Model

### Entity Relationship

```
┌─────────┐               ┌──────────┐            ┌──────────┐             ┌────────────┐
│  User   │ owns ──▶     │  Board   │ contains ─▶│  Column  │ contains ─▶│  Task      │
│         │◀── member of │          │            │          │             │            │
│ • email │               │ • title  │            │ • title  │             │ • title    │
│ • name  │               │ • owner  │            │ • order  │             │ • desc     │
│ • role  │               │ • members│            │ • board↗ │             │ • priority │
│ • hash  │               └──────────┘            └──────────┘             │ • order    │
└─────────┘                                                                │ • assignee │
     ▲                                                                     │ • column↗  │
     └──────────────────────── assigned to ◀──────────────────────────────│ • board↗   │
                                                                           └────────────┘
```

### Roles & Permissions Matrix

| Action                  | Admin | Board Owner | Board Member |
| :---------------------- | :---: | :---------: | :----------: |
| Create Board            |   ✓   |      ✓      |      ✓       |
| Update Board            |   ✓   |      ✓      |      ✗       |
| Delete Board            |   ✓   |      ✓      |      ✗       |
| Add/Remove Members      |   ✓   |      ✓      |      ✗       |
| Create Column           |   ✓   |      ✓      |      ✗       |
| Update/Delete Column    |   ✓   |      ✓      |      ✗       |
| Move Column             |   ✓   |      ✓      |      ✗       |
| Create Task             |   ✓   |      ✓      |      ✓       |
| Update Task             |   ✓   |      ✓      |      ✓       |
| Move Task (Drag & Drop) |   ✓   |      ✓      |      ✓       |
| Delete Task             |   ✓   |      ✓      |      ✗       |

---

## 🔧 Use Cases

Each use case is a **single-responsibility class** that encapsulates one business operation. Dependencies are injected via constructor, making them trivially testable.

### Authentication (3 Use Cases)

| Use Case         | Description                        | Key Logic                                                                 |
| :--------------- | :--------------------------------- | :------------------------------------------------------------------------ |
| `RegisterUser`   | Creates a new user account         | Email normalization → duplicate check → password hashing → JWT generation |
| `LoginUser`      | Authenticates existing user        | Credential validation → bcrypt comparison → JWT issuance                  |
| `GetCurrentUser` | Returns authenticated user profile | Token-based identity resolution                                           |

### Board Management (7 Use Cases)

| Use Case        | Description                            | Key Logic                                                                            |
| :-------------- | :------------------------------------- | :----------------------------------------------------------------------------------- |
| `CreateBoard`   | Creates new board, user becomes owner  | Board limit check (max 15 per user) → creation                                       |
| `GetBoard`      | Fetches board with all columns & tasks | **Two-Phase Retrieval:** lightweight auth check → deep population only if authorized |
| `GetUserBoards` | Lists boards user owns or is member of | Filtered query across ownership + membership                                         |
| `UpdateBoard`   | Updates board metadata                 | Owner/Admin authorization → title validation                                         |
| `DeleteBoard`   | Removes empty board                    | Integrity check (must have zero columns) → authorization → deletion                  |
| `AddMembers`    | Adds users to board                    | Input sanitization → dedup → existence validation → membership check → batch add     |
| `RemoveMember`  | Removes user from board                | Authorization → **automatic task unassignment** (cleanup side effect)                |

### Column Management (4 Use Cases)

| Use Case       | Description                          | Key Logic                                                                                |
| :------------- | :----------------------------------- | :--------------------------------------------------------------------------------------- |
| `CreateColumn` | Adds column to board                 | Authorization → **transactional** limit check (max 20) → order assignment via board lock |
| `UpdateColumn` | Updates column title                 | Board context resolution → authorization → validation                                    |
| `DeleteColumn` | Removes column and reorders siblings | **Transactional** delete with automatic order gap closure                                |
| `MoveColumn`   | Reorders column position             | **Transactional** ripple reorder with boundary validation                                |

### Task Management (4 Use Cases)

| Use Case     | Description                     | Key Logic                                                                                                      |
| :----------- | :------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| `CreateTask` | Creates task in column          | Column-board consistency check → assignee board membership validation → **transactional** limit check (max 50) |
| `UpdateTask` | Updates task details            | Selective field validation → assignee membership verification → immutable relationship optimization            |
| `DeleteTask` | Removes task and reorders       | **Transactional** delete + order gap closure                                                                   |
| `MoveTask`   | Drag & drop (same/cross column) | **Transactional** ripple reorder with dual-column locking for cross-column moves                               |

---

## 🗄️ Database Design

### Collections & Relationships

```
┌──────────────────┐         ┌────────────────────┐
│   users          │         │   boards           │
│──────────────────│         │────────────────────│
│ _id     ObjectId │◀─ ref ──│ owner_id ObjectId  │
│ email   String   │◀─ ref ──│ members  [ObjId]   │
│ password String  │         │ title    String    │
│ name    String   │         │ _id      ObjectId  │
│ role    Enum     │         └────────┬───────────┘
│ created Date     │                  │
└──────────────────┘                  │ virtual: columns
                                      │ (foreignField: board_id)
                              ┌───────▼───────────┐
                              │   columns         │
                              │───────────────────│
                              │ _id      ObjectId │
                              │ board_id ObjectId │ ← indexed
                              │ title    String   │
                              │ order    Number   │
                              └───────┬───────────┘
                                      │ virtual: tasks
                                      │ (foreignField: column_id)
                              ┌───────▼───────────┐
                              │   tasks           │
                              │───────────────────│
                              │ _id         ObjId │
                              │ column_id   ObjId │ ← indexed
                              │ board_id    ObjId │ ← indexed
                              │ title       Str   │
                              │ description Str   │
                              │ priority    Enum  │
                              │ assignee_id ObjId │ ← nullable
                              │ order       Num   │
                              └───────────────────┘
```

### Virtual Population Strategy

Instead of embedding documents (which would hit BSON size limits), FlowState uses **Mongoose Virtual Fields** with deep population:

```
Board.findById(id)
  .populate({
    path: 'columns',        ← Virtual: Column.board_id → Board._id
    populate: {
      path: 'tasks'         ← Virtual: Task.column_id → Column._id
    }
  })
```

**Result:** One query fetches the entire board hierarchy—normalized storage, denormalized reads.

### Indexing Strategy

| Index       | Collection | Type     | Purpose                                                    |
| :---------- | :--------- | :------- | :--------------------------------------------------------- |
| `email`     | users      | Unique   | Fast login lookup, prevent duplicates                      |
| `owner_id`  | boards     | Standard | User's owned boards query                                  |
| `board_id`  | columns    | Standard | Board's columns lookup                                     |
| `column_id` | tasks      | Standard | Column's tasks lookup                                      |
| `board_id`  | tasks      | Standard | Board-wide task queries (e.g., unassign on member removal) |

---

## 🔐 Security Model

### Authentication Flow

```
  Client                           Server
    │                                │
    │──── POST /auth/register ─────▶│ ← Validate → Hash password → Store
    │◀─── { token, user } ──────────│
    │                                │
    │──── POST /auth/login ────────▶│ ← Find user → Compare hash → Issue JWT
    │◀─── { token, user } ──────────│
    │                                │
    │──── GET /boards ─────────────▶│ ← Extract JWT → Verify → Inject userId
    │     Authorization: Bearer xxx  │
    │◀─── { boards: [...] } ────────│
```

### Security Layers

```
Request ─▶ Helmet (Security Headers)
        ─▶ CORS (Origin Whitelist)
        ─▶ Rate Limiter
        │  ├── Global: 100 req / 15 min
        │  └── Auth:     5 req / 15 min (anti-brute-force)
        ─▶ Auth Middleware (JWT Verification)
        ─▶ Use Case (RBAC Authorization)
        ─▶ Input Sanitization (trim + normalize)
        ─▶ Mongoose Schema Validation (safety net)
```

### Password Security

| Property    | Value       | Rationale                                           |
| :---------- | :---------- | :-------------------------------------------------- |
| Algorithm   | Bcrypt      | Industry standard, adaptive hashing                 |
| Salt Rounds | 10          | ~100ms hash time, good security/performance balance |
| Max Length  | 50 chars    | Prevents bcrypt DoS (72-byte limit)                 |
| Min Length  | 8 chars     | NIST recommendation baseline                        |
| Passphrases | ✓ Supported | Internal spaces preserved                           |
| Trimming    | Edge-only   | Prevents invisible char login failures              |

---

## ⚠️ Error Handling

### Structured Error System

Every error in FlowState carries a **machine-readable code**, a **human-readable message**, and an **HTTP status**. The frontend never has to parse error strings.

```typescript
// Example Error Response
{
  "success": false,
  "error": {
    "code": "BOARD_003",
    "message": "Board limit exceeded. Maximum 15 boards per user.",
    "statusCode": 403
  }
}
```

### Error Flow

```
Use Case Layer                    Middleware Layer
      │                                │
      ├─ Business Rule Violation       │
      │  throw AppError(code, msg)  ──▶│ ─▶ { success: false, error: {...} }
      │                                │
      ├─ Unexpected Error              │
      │  (bubbles up)              ───▶│ ─▶ Mongoose CastError → 400
      │                                │ ─▶ Duplicate Key (11000) → 409
      │                                │ ─▶ Unknown → 500 (SERVER_001)
```

### Error Code Registry

| Code         | Meaning                      | HTTP Status |
| :----------- | :--------------------------- | :---------- |
| `AUTH_001`   | Invalid credentials          | 401         |
| `AUTH_002`   | Token expired                | 401         |
| `AUTH_003`   | Invalid/malformed token      | 401         |
| `USER_001`   | User not found               | 404         |
| `USER_002`   | Email already exists         | 409         |
| `BOARD_001`  | Board not found              | 404         |
| `BOARD_002`  | Access denied                | 403         |
| `BOARD_003`  | Board limit exceeded         | 403         |
| `COLUMN_001` | Column not found             | 404         |
| `TASK_001`   | Task not found               | 404         |
| `VAL_001`    | Duplicate entry              | 409         |
| `VAL_002`    | Missing required fields      | 400         |
| `VAL_003`    | Validation constraint failed | 400         |

---

## 🔄 Concurrency & Transactions

FlowState uses **Pessimistic Locking** with **MongoDB ACID Transactions** to guarantee data integrity for ordering operations. This is why the Docker setup uses a **Replica Set**. Transactions require it.

### Task Creation (Pessimistic Lock)

```
Transaction Start
  │
  ├── 1. Lock Parent Column (findByIdAndUpdate → updated_at)
  │      └── Prevents concurrent task inserts
  │
  ├── 2. Count existing tasks in column
  │      └── If count >= 50 → ABORT (limit exceeded)
  │
  ├── 3. Create task with order = count
  │
  └── Commit (or rollback on any failure)
```

### Cross-Column Move (Dual Lock)

```
Transaction Start
  │
  ├── 1. Lock Source Column + Lock Target Column
  │
  ├── 2. Validate target order is within bounds
  │
  ├── 3. Target Column: Shift tasks at order >= newPos DOWN (+1)
  │
  ├── 4. Source Column: Shift tasks at order > oldPos UP (-1)
  │
  ├── 5. Update task: column_id = target, order = newPos
  │
  └── Commit (atomic — all or nothing)
```

### Column Reorder (Ripple Effect)

```
Moving column from position 1 → 3:

Before:  [A:0] [B:1] [C:2] [D:3] [E:4]
                 ▲──────────▶
Step 1:  Shift range (1,3] UP by -1
         [A:0] [B:1] [C:1] [D:2] [E:4]
Step 2:  Set B.order = 3
After:   [A:0] [C:1] [D:2] [B:3] [E:4]  ✓ Sequential, no gaps
```

---

## 🚀 Getting Started

### Prerequisites

| Tool    | Version | Purpose             |
| :------ | :------ | :------------------ |
| Node.js | ≥ 18    | Runtime environment |
| Docker  | Latest  | MongoDB Replica Set |
| npm     | ≥ 9     | Package management  |

### Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start MongoDB with Replica Set
docker compose up -d

# Initialize Replica Set (first time only)
docker exec flowstate_db mongosh --eval "rs.initiate()"

# Start development server
npm run dev
```

### Environment Variables

| Variable       | Required | Default | Description                   |
| :------------- | :------: | :------ | :---------------------------- |
| `PORT`         |    No    | 5000    | Server port                   |
| `MONGO_URI`    |   Yes    | —       | MongoDB connection string     |
| `JWT_SECRET`   |   Yes    | —       | Minimum 32 characters         |
| `NODE_ENV`     |   Yes    | —       | `development` or `production` |
| `FRONTEND_URL` |   Yes    | —       | Allowed CORS origin           |

---

## 📡 API Reference

### Auth Endpoints

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Danindu Ransika",
  "email": "danindu@example.com",
  "password": "securepassword123"
}

# Response 201
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "user" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "danindu@example.com", "password": "securepassword123" }
```

### Board Endpoints

```http
# Create Board
POST /api/boards
Authorization: Bearer <token>
{ "title": "Sprint 1 - Backend" }

# Get Populated Board (Board + Columns + Tasks)
GET /api/boards/:boardId
Authorization: Bearer <token>

# Add Members
POST /api/boards/:boardId/members
Authorization: Bearer <token>
{ "userIds": ["userId1", "userId2"] }
```

### Task Endpoints

```http
# Create Task
POST /api/tasks
Authorization: Bearer <token>
{
  "title": "Implement authentication",
  "boardId": "...",
  "columnId": "...",
  "priority": "high",
  "assigneeId": "..."
}

# Move Task (Cross-Column Drag & Drop)
PATCH /api/tasks/:taskId/move
Authorization: Bearer <token>
{
  "boardId": "...",
  "targetColumnId": "...",
  "newOrder": 2
}
```

> 📚 Complete API documentation with all endpoints, request schemas, response formats, and error cases: [`docs/API_SPECIFICATION.md`](../docs/API_SPECIFICATION.md)

---

## 🧪 Testing

### Testing Stack

| Tool                      | Purpose                               |
| :------------------------ | :------------------------------------ |
| **Jest 30**               | Test runner & assertions              |
| **MongoDB Memory Server** | In-memory database for isolated tests |
| **Supertest**             | HTTP integration testing              |
| **jest-html-reporter**    | Visual HTML test reports              |

### Commands

```bash
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode for development
```

### Test Architecture

```
tests/
├── setup.ts              ← MongoDB Memory Server bootstrap
├── unit/
│   └── use-cases/
│       └── auth/
│           └── RegisterUser.test.ts   ← Dependency-injected mock repos
└── integration/
    └── (planned)          ← Full HTTP request cycle tests
```

> Unit tests inject **mock repositories** into use cases—proving that business logic works independently of MongoDB.

---

## ⚙️ Configuration

### Business Rules (Configurable Constants)

| Constant                 | Value  | Location                     |
| :----------------------- | :----- | :--------------------------- |
| `MAX_BOARDS_PER_USER`    | 15     | `constants/businessRules.ts` |
| `MAX_COLUMNS_PER_BOARD`  | 20     | `constants/businessRules.ts` |
| `MAX_TASKS_PER_COLUMN`   | 50     | `constants/businessRules.ts` |
| `MAX_NAME_LENGTH`        | 100    | `constants/businessRules.ts` |
| `MAX_EMAIL_LENGTH`       | 255    | `constants/businessRules.ts` |
| `MAX_PASSWORD_LENGTH`    | 50     | `constants/businessRules.ts` |
| `MAX_TITLE_LENGTH`       | 150    | `constants/businessRules.ts` |
| `MAX_DESCRIPTION_LENGTH` | 1000   | `constants/businessRules.ts` |
| `JWT_EXPIRATION`         | 7 days | `constants/businessRules.ts` |
| `BCRYPT_SALT_ROUNDS`     | 10     | `constants/businessRules.ts` |

---

<div align="center">

← [Back to Main README](../README.md)

**Built with Clean Architecture principles** 🏛️

</div>
