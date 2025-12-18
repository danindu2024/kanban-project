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

| Field         | Type     | Description                       |
| :------------ | :------- | :-------------------------------- |
| `_id`         | ObjectId | Unique Identifier                 |
| `column_id`   | ObjectId | Ref: Columns (Indexed)            |
| `board_id`    | ObjectId | Ref: Boards (For faster querying) |
| `title`       | String   | Task summary                      |
| `description` | String   | Markdown supported                |
| `priority`    | String   | ENUM: ['low', 'medium', 'high']   |
| `assignee_id` | ObjectId | Ref: Users (Nullable, Single assignee only)             |
| `order`       | Number   | For drag-and-drop positioning     |

### 2.2: Indexing Strategy
* **users.email** - Unique index
* **columns.board_id** - Standard index
* **tasks.column_id** - Standard index
* **tasks.board_id** - Standard index
* No **compound indexes** in Sprint 1