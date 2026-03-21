<div align="center">

# 🚀 FlowState

### _Professional-Grade Kanban Board for Teams That Ship_

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Jest](https://img.shields.io/badge/Tests-Jest_30-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](./LICENSE)

<br/>

> A streamlined, enterprise-grade Kanban board built with **Clean Architecture** principles. Designed for university students and small teams who need the power of professional tools without the complexity or cost.

<br/>

[📖 Documentation](#-documentation) · [🏗️ Architecture](#%EF%B8%8F-architecture) · [⚡ Quick Start](#-quick-start) · [🧪 Testing](#-testing)

</div>

---

<br/>

## ✨ Why FlowState?

Most project management tools fall into two camps: **too simple** (sticky notes) or **too complex** (enterprise SaaS). FlowState occupies the sweet spot—delivering **real engineering rigor** with **zero friction**.

<table>
  <tr>
    <td width="50%">

### 🎯 Built for Real Workflows

- **Drag & Drop** task management with persistent ordering
- **Role-Based Access Control** (Admin / Member)
- **Board → Column → Task** hierarchy with virtual population
- **Member Management** with automatic task cleanup

</td>
    <td width="50%">

### 🔒 Security-First Design

- **JWT Authentication** with HTTP-Only cookies
- **Bcrypt** password hashing (10 salt rounds)
- **Rate Limiting** (global + auth-specific)
- **Helmet.js** security headers
- **CORS** origin whitelisting

</td>
  </tr>
</table>

<br/>

## 🏗️ Architecture

FlowState's backend follows **Clean Architecture** (a.k.a. Hexagonal Architecture), ensuring business logic is completely decoupled from frameworks, databases, and delivery mechanisms.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        🌐 HTTP Request                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  📡 Routes & Middleware                                             │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌─────────────┐    │
│  │  Morgan  │  │   Helmet   │  │ Rate Limiter │  │ Auth Guard  │    │
│  └──────────┘  └────────────┘  └──────────────┘  └─────────────┘    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  🎮 Controllers              Adapters Layer                         │
│  Parse requests, invoke use cases, format responses                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ Use Cases                 Application Layer                     │
│  RegisterUser │ CreateBoard │ MoveTask │ AddMembers │ ...           │
│  ─────────────────────────────────────────────────────────────────  │
│  Input validation • Authorization • Business rules • Orchestration  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  🏛️ Domain Entities          Domain Layer (Pure TypeScript)         │
│  User │ Board │ Column │ Task                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  Repository Interfaces (Contracts) — Zero framework dependencies    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  💾 Infrastructure            Data Layer                            │
│  Mongoose Models │ Repository Implementations │ DB Connection       │
│  ─────────────────────────────────────────────────────────────────  │
│  MongoDB Transactions • Virtual Population • Pessimistic Locking    │
└─────────────────────────────────────────────────────────────────────┘
```

> **The Dependency Rule:** Inner layers _never_ depend on outer layers. Domain entities know nothing about Express, Mongoose, or HTTP.

<br/>

## 🛠️ Tech Stack

| Layer                    | Technology                    | Purpose                                     |
| :----------------------- | :---------------------------- | :------------------------------------------ |
| **Runtime**              | Node.js + TypeScript          | Type-safe server-side JavaScript            |
| **Framework**            | Express 5                     | Minimal, unopinionated web framework        |
| **Database**             | MongoDB + Mongoose 9          | Document store with schema validation       |
| **Auth**                 | JWT + Bcrypt                  | Stateless authentication & password hashing |
| **Security**             | Helmet + CORS + Rate Limiting | Defense-in-depth HTTP security              |
| **Logging**              | Morgan                        | HTTP request logging (combined format)      |
| **Testing**              | Jest 30 + Supertest           | Unit & integration testing                  |
| **DevOps**               | Docker Compose                | Local MongoDB Replica Set                   |
| **Linting**              | ESLint + TypeScript Parser    | Code quality enforcement                    |
| **Frontend** _(planned)_ | Next.js 14 + Tailwind CSS     | React-based UI with App Router              |

<br/>

## 📁 Project Structure

```
kanban-project/
├── 📄 README.md                  ← You are here
├── 📂 docs/                      ← Comprehensive technical documentation
│   ├── PRD.md                    ← Product Requirements Document
│   ├── TECHNICAL_DESIGN.md       ← System architecture & database schema
│   ├── API_SPECIFICATION.md      ← Complete REST API reference
│   ├── SECURITY.md               ← Security policies & threat model
│   ├── DEVELOPMENT_GUIDE.md      ← Setup & contribution guide
│   ├── INFRASTRUCTURE.md         ← Deployment & DevOps
│   ├── TEST_PLAN.md              ← Testing strategy & coverage goals
│   └── CHANGELOG.md              ← Version history
├── 📂 server/                    ← Backend application (Clean Architecture)
│   ├── README.md                 ← Detailed backend documentation
│   ├── docker-compose.yml        ← MongoDB Replica Set config
│   ├── src/
│   │   ├── domain/               ← Entities & repository interfaces
│   │   ├── use-cases/            ← Application business logic
│   │   ├── controllers/          ← HTTP request handlers
│   │   ├── routes/               ← Express route definitions
│   │   ├── infrastructure/       ← MongoDB models & repository implementations
│   │   ├── middleware/           ← Auth, error handling, rate limiting
│   │   ├── constants/            ← Error codes & business rules
│   │   └── utils/                ← Shared utilities
│   └── tests/                    ← Unit & integration tests
└── 📂 client/                    ← Frontend application (coming soon)
```

<br/>

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Docker Desktop** (for MongoDB Replica Set)
- **npm** or **yarn**

### 1️⃣ Clone & Install

```bash
git clone https://github.com/danindu2024/kanban-project.git
cd kanban-project/server
npm install
```

### 2️⃣ Start MongoDB (Docker)

```bash
docker compose up -d
```

> This spins up a MongoDB instance with Replica Set support—required for **ACID Transactions** used in task ordering.

### 3️⃣ Configure Environment

```bash
# Create .env in /server
cp .env.example .env
```

Required environment variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/flowstate
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4️⃣ Run the Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

<br/>

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode (development)
npm run test:watch
```

> Tests use **MongoDB Memory Server** for isolated, in-memory database instances—no Docker required for testing.

<br/>

## 📡 API At a Glance

| Method   | Endpoint                          | Description                    | Auth |
| :------- | :-------------------------------- | :----------------------------- | :--: |
| `POST`   | `/api/auth/register`              | Create new account             |  ✗   |
| `POST`   | `/api/auth/login`                 | Authenticate & get token       |  ✗   |
| `GET`    | `/api/auth/me`                    | Get current user profile       |  ✓   |
| `GET`    | `/api/boards`                     | List user's boards             |  ✓   |
| `POST`   | `/api/boards`                     | Create new board               |  ✓   |
| `GET`    | `/api/boards/:id`                 | Get board with columns & tasks |  ✓   |
| `PATCH`  | `/api/boards/:id`                 | Update board metadata          |  ✓   |
| `DELETE` | `/api/boards/:id`                 | Delete empty board             |  ✓   |
| `POST`   | `/api/boards/:id/members`         | Add members to board           |  ✓   |
| `DELETE` | `/api/boards/:id/members/:userId` | Remove member                  |  ✓   |
| `POST`   | `/api/columns`                    | Create column in board         |  ✓   |
| `PATCH`  | `/api/columns/:id`                | Update column                  |  ✓   |
| `PATCH`  | `/api/columns/:id/move`           | Reorder column                 |  ✓   |
| `DELETE` | `/api/columns/:id`                | Delete column                  |  ✓   |
| `POST`   | `/api/tasks`                      | Create task in column          |  ✓   |
| `PATCH`  | `/api/tasks/:id`                  | Update task details            |  ✓   |
| `PATCH`  | `/api/tasks/:id/move`             | Move task (drag & drop)        |  ✓   |
| `DELETE` | `/api/tasks/:id`                  | Delete task                    |  ✓   |

> 📚 Full API documentation with request/response schemas available in [`docs/API_SPECIFICATION.md`](./docs/API_SPECIFICATION.md)

<br/>

## 📖 Documentation

This project is backed by **enterprise-grade documentation**:

| Document                                             | Description                                          |
| :--------------------------------------------------- | :--------------------------------------------------- |
| [**Product Requirements**](./docs/PRD.md)            | Vision, personas, functional requirements, MVP scope |
| [**Technical Design**](./docs/TECHNICAL_DESIGN.md)   | Architecture, database schema, concurrency strategy  |
| [**API Specification**](./docs/API_SPECIFICATION.md) | Complete endpoint reference with examples            |
| [**Security Policy**](./docs/SECURITY.md)            | Authentication, authorization, threat mitigations    |
| [**Development Guide**](./docs/DEVELOPMENT_GUIDE.md) | Setup, conventions, and contribution workflow        |
| [**Infrastructure**](./docs/INFRASTRUCTURE.md)       | Deployment, Docker, and environment configuration    |
| [**Test Plan**](./docs/TEST_PLAN.md)                 | Testing strategy, coverage targets, test categories  |
| [**Changelog**](./docs/CHANGELOG.md)                 | Detailed version history and release notes           |

<br/>

## 🗺️ Roadmap

- [x] **Sprint 1** — Core backend (Auth, Boards, Columns, Tasks)
- [x] **Sprint 1** — Clean Architecture with full separation of concerns
- [x] **Sprint 1** — ACID transactions for ordering & limits
- [x] **Sprint 1** — Comprehensive documentation suite
- [ ] **Sprint 2** — Next.js frontend with drag & drop UI
- [ ] **Sprint 2** — Real-time collaboration (Socket.io)
- [ ] **Sprint 2** — Token refresh mechanism
- [ ] **Future** — Email notifications, file attachments, dark mode

<br/>

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

> Please read the [Development Guide](./docs/DEVELOPMENT_GUIDE.md) for coding conventions and architecture decisions.

<br/>

---

<div align="center">

**Built with** ❤️ **by [Danindu Ransika](https://github.com/danindu2024)**

_If this project helped you, consider giving it a_ ⭐

</div>
