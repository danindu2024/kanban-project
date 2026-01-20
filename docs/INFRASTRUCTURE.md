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
These variables must be defined in your deployment platform (Render/Vercel) for the application to start.

* `MONGODB_URI` - Connection string for MongoDB Atlas
* `JWT_SECRET` - Minimum 32 characters required (enforced at startup)
* `NODE_ENV` - Set to `production` in the live environment
* `PORT` - (Optional) Port number, defaults to platform assignment
* `FRONTEND_URL` - **Required in Production.** The exact URL of your deployed frontend (e.g., `https://your-app.vercel.app`).
    * *Reason:* Used to configure CORS. If missing or incorrect, the frontend will receive "Network Error" or "CORS Policy" blocks.

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