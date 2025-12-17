# Product Requirements Document (PRD)

| **Project Name** | Enterprise Kanban Board ("FlowState") |
| :--- | :--- |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | December 17, 2025 |
| **Author** | Danindu Ransika |

---

## 1. Project Overview

### 1.1 Problem Statement
University students frequently manage complex workloads ranging from individual assignments to large-scale group research projects without adequate tooling. Professional solutions like Jira are too complex and expensive for students, while the free tiers of popular tools (like Trello or Notion) often lock essential features behind paywalls or suffer from performance bloat. There is currently no high-quality, open-source project management tool specifically optimized for the academic context.

### 1.2 Vision
To build "FlowState": a streamlined, professional-grade Kanban board tailored for university students. It bridges the gap between "simple to-do lists" and "enterprise agile tools," providing a free, high-performance platform for managing personal study plans and collaborative group projects.

### 1.3 Success Metrics
* **Performance:** Application Time-to-Interactive (TTI) under 1.5 seconds.
* **Quality:** Zero Critical or High-severity bugs in the main branch.
* **Security:** 100% of API endpoints protected by JWT and Role-Based Access Control (RBAC).
* **CI/CD:** Automated build and test pipeline triggers on every Pull Request.

---

## 2. User Personas (URD)

### 2.1 The Student Leader ("Project Lead")
* **Description:** The project lead or student responsible for the workspace.
* **Goals:** Assign tasks to group members, track deadlines for submissions, and ensure no one is slacking off.
* **Pain Points:** Hate asking "What are you working on?" in WhatsApp groups 10 times a day.

### 2.2 The Team Member ("Individual Student")
* **Description:** A busy student juggling exams, part-time work, assignments, and development projects.
* **Goals:** A single board to visualize their entire semester's workload/ongoing development projects' status.
* **Pain Points:** FOverwhelmed by deadlines; needs a simple drag-and-drop interface to feel a sense of progress.

---

## 3. Scope of Work (MVP - Phase 1)

### 3.1 Functional Requirements (In-Scope)

#### A. Authentication & Authorization (Auth)
* **FR-01:** System shall allow users to register with Email/Password.
* **FR-02:** System shall authenticate users via JWT (JSON Web Tokens) with HTTP-Only cookies.
* **FR-03:** System shall enforce Role-Based Access Control (Admin vs. Member).

#### B. Board Management
* **FR-04:** Admins shall be able to Create, Read, Update, and Delete (CRUD) boards.
* **FR-05:** Members shall only be able to View boards they are assigned to.

#### C. Column & Task Management
* **FR-06:** Users shall be able to create custom columns (e.g., "Backlog", "Review").
* **FR-07:** Users shall be able to create Tasks with Title, Description, and Priority (Low/Med/High).
* **FR-08:** Users shall be able to drag and drop tasks between columns.
* **FR-09:** The system shall persist the new column order/task status immediately after a drop event.

### 3.2 Out-of-Scope (Phase 1)
* Real-time collaboration (Socket.io) - *Scheduled for Phase 2*.
* File Attachments.
* Email Notifications.
* Dark Mode toggle.
* Redis/Caching layer
* Offline support and local storage sync
* Bulk operations (multi-select tasks)
* Search and filter functionality
* Multi-assignee per task
* Audit trail and change history
* GDPR/SOC2 compliance features
* Advanced monitoring tools (DataDog, ELK)
* Kubernetes orchestration
* Staging environment

### 3.3 Explicit MVP Constraints
* Single assignee per task only
* "Last Write Wins" for concurrent edits
* Internet connection required (no offline mode)
* Manual board navigation (no search)
* Empty state onboarding only (no tutorials)
* Visual task scanning (no filters)
---

## 4. Technical Requirements

### 4.1 Tech Stack
* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Zustand, React-Beautiful-DnD.
* **Backend:** Node.js, Express.js (Clean Architecture standard), TypeScript.
* **Database:** MongoDB (Mongoose ORM).
* **DevOps:** Docker, GitHub Actions.

### 4.2 Non-Functional Requirements (NFRs)
* **Security:** Passwords must be salted and hashed (Bcrypt).
* **Architecture:** Code must adhere to the **Dependency Rule** (Domain Logic > Use Cases > Adapters).
* **Scalability:** MongoDB Atlas handles auto-scaling. No manual sharding or caching in Sprint 1.
* **Testing:** Unit test coverage must exceed 60% for Domain layer only. No E2E tests in Sprint 1.

---

## 5. Risks & Assumptions
* **Assumption:** We are using a "Monorepo" structure for easier dependency management during development.
* **Risk:** Drag-and-drop libraries can be tricky with React 18 Strict Mode; we may need to use a specific library wrapper.

### 5.1: Technology Decisions
* `Hosting:` Render.com (Backend) + Vercel (Frontend)
* `Database:` MongoDB Atlas with automatic backups
* `Logging:` Morgan middleware + platform dashboards
* `Rate Limiting:` express-rate-limit (100 req/15min)
* `Error Notifications:` react-hot-toast or sonner
* `Environments:` Local + Production only