# Development Guide

**Project:** FlowState (Enterprise Kanban)
**Version:** 1.0

## 1. Development Workflow
### 1.1 Branching Strategy

* **Main branch:** main (production)
* **Feature branches:** feature/description
* **Bug fixes:** fix/description
* Direct commits to main prohibited

### 1.2 Commit Convention

* Use conventional commits format
* **Types**: `feat`, `fix`, `docs`, `refactor`, `test`

### 1.3 Pull Request Process

* Self-review required (solo developer)
* All tests must pass
* No manual approval needed for Sprint 1

## 2. Local Setup Instructions
### 2.1 Prerequisites

* Node.js 18+
* Docker Desktop
* MongoDB Compass (optional)

### 2.2 First-Time Setup Steps

* Clone repository
* Install dependencies
* opy environment template
* Run Docker Compose
* Run seed script

## 3. Testing Strategy
### 3.1 Unit Tests

* **Framework:** Jest
* **Target:** 60%+ coverage for Domain layer
* **Location:** __tests__ folders alongside source

### 3.2 Test Commands

* Run all tests
* Run with coverage
* Watch mode

### 3.3 Out of Scope

* Integration tests (Sprint 2)
* E2E tests (Sprint 2)
* Load testing (Sprint 2)

## 4. Code Quality
### 4.1 Linting

* ESLint for TypeScript
* Prettier for formatting
* Pre-commit hooks with Husky

### 4.2 Type Safety

* TypeScript strict mode enabled
* No any types allowed (use unknown instead)

### 4.3 Error Handling Standards

* **Repositories:**
    * **Do NOT use try/catch blocks.** Let Mongoose errors (Validation, Duplicate Key, Timeout) bubble up automatically.
    * *Reason:* The Global Error Handler is configured to transform these specific DB errors into user-friendly HTTP responses.
    
* **Use Cases:**
    * Throw `AppError` for business logic violations (e.g., "Limit Exceeded").
    * Do not catch DB errors unless you need to transform a specific error (e.g., unique constraint violation) into a domain-specific message.

## 5. Seed Data Script
Purpose and what it creates:

* 1 Admin user
* 1 Regular user
* 1 Sample board (owned by regular user)
* 3 Columns (To Do, In Progress, Done)
* 5 Sample tasks