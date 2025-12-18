# Infrastructure Document

**Project:** FlowState (Enterprise Kanban)
**Version:** 1.0

## 1. Deployment Architecture

* **Frontend:** Vercel (auto-deploys from main branch)
* **Backend:** Render.com Web Service (Docker container)
* **Database:** MongoDB Atlas (Cloud, M0 Free Tier initially)

## 2. Environment Configuration
### 2.1 Local Environment

* Docker Compose setup
* Environment variables file: `.env.local`

### 2.2 Production Environment

* Platform environment variables (Render/Vercel dashboards)
* No `.env` files in repository

## 3. Required Environment Variables
List for both environments:

* `MONGODB_URI`
* `JWT_SECRET`
* `NODE_ENV`
* `FRONTEND_URL (for CORS)`
* `PORT`

## 4. Logging Strategy

* **HTTP requests:** Morgan middleware (combined format)
* **Application errors:** console.error (captured by platform)
* No external logging service in Sprint 1

## 5. Backup & Recovery

* MongoDB Atlas handles automated backups
* No manual backup scripts
* **Recovery:** Atlas Point-in-Time restore feature

## 6. Monitoring

* **Render Dashboard:** CPU, Memory, Request logs
* **Vercel Analytics:** Page load times, errors
* No APM tools (New Relic, DataDog) in Sprint 1