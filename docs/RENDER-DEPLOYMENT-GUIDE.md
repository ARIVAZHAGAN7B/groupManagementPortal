# GM Portal — Complete Render.com Deployment Guide

This guide walks you through deploying both the **Frontend** and **Backend** of GM Portal onto [Render.com](https://render.com) step-by-step.

---

## Architecture on Render

```
┌───────────────────────────────────────┐
│     Client (React / Vite)             │
│  Type: Static Site                    │
│  URL: https://gm-portal.onrender.com  │
└──────────────────┬────────────────────┘
                   │ HTTPS API & WebSockets
                   ▼
┌───────────────────────────────────────┐
│     Server (Node.js / Express)        │
│  Type: Web Service                    │
│  URL: https://gm-api.onrender.com     │
└──────────┬──────────────────┬─────────┘
           │                  │
           ▼                  ▼
┌────────────────────┐  ┌─────────────────────────┐
│  Redis (Optional)  │  │  MySQL Database         │
│  Render Free Redis │  │  Aiven / TiDB / Railway │
└────────────────────┘  └─────────────────────────┘
```

---

## Step 1: Set Up MySQL Database (Free Cloud MySQL)

Render provides native PostgreSQL and Redis, but does not provide a free managed MySQL service. You can get a free, high-performance cloud MySQL database in 2 minutes using **Aiven** or **TiDB Cloud**:

### Option A: Aiven for MySQL (Recommended - Free Tier)
1. Go to [aiven.io](https://aiven.io) and create a free account.
2. Click **Create Service** $\rightarrow$ select **MySQL** $\rightarrow$ choose **Free Plan**.
3. Once active, note the connection details:
   * **Host:** `mysql-xxxx.aivencloud.com`
   * **Port:** `12345` (e.g. 5-digit port)
   * **User:** `avnadmin`
   * **Password:** `your_password`
   * **Database:** `defaultdb`

### Option B: TiDB Cloud (Free Serverless MySQL)
1. Go to [tidbcloud.com](https://tidbcloud.com) $\rightarrow$ Create **Serverless Cluster** (Free 25 GB).
2. Click **Connect** and copy your Host, Port, User, and Password.

---

## Step 2: Deploy the Backend (Render Web Service)

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ select **Web Service**.
3. Connect your GitHub repository: `groupManagementPortal`.
4. Configure the settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `gm-portal-api` (or any name you choose) |
| **Region** | Choose closest to you (e.g., Singapore, Frankfurt, Oregon) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` *(or `npm run start:cluster` if on Starter 1GB plan)* |
| **Instance Type** | **Free** (or Starter) |

5. Scroll down to **Environment Variables** and add the following:

| Environment Variable | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production caching |
| `PORT` | `10000` | Render defaults to port 10000 |
| `JWT_SECRET` | *(Random 32-character string)* | e.g. `gmPortalSuperSecretKey2026!@#` |
| `JWT_EXPIRES_IN` | `1d` | Token expiration |
| `DB_HOST` | `your-cloud-mysql-host.com` | From Step 1 |
| `DB_PORT` | `3306` (or Aiven port) | From Step 1 |
| `DB_USER` | `your_db_username` | From Step 1 |
| `DB_PASSWORD` | `your_db_password` | From Step 1 |
| `DB_NAME` | `defaultdb` | From Step 1 |
| `DB_CONNECTION_LIMIT`| `10` | Keeps pool safe on free cloud tiers |
| `COOKIE_SECURE` | `true` | Required for HTTPS cookies |
| `COOKIE_SAME_SITE` | `none` | **Critical:** Allows cross-domain cookies between frontend & backend |
| `CORS_ALLOWED_ORIGINS`| `https://gm-portal.onrender.com` | Put your Frontend Render URL here (once created) |
| `FRONTEND_ORIGIN` | `https://gm-portal.onrender.com` | Same as above |
| `WEB_CONCURRENCY` | `1` | 1 worker for Free tier 512MB RAM |

6. Click **Deploy Web Service**.
7. Once deployment succeeds, copy your backend URL: e.g. `https://gm-portal-api.onrender.com`.

---

## Step 3: Run Database Migrations on Cloud MySQL

Before the frontend logs in, the database tables and admin user must exist. You can run the schema migration directly from your local terminal against the cloud MySQL database:

```bash
# In your local project terminal:
cd server

# Point temporarily to your cloud DB:
$env:DB_HOST="your-cloud-mysql-host.com"
$env:DB_PORT="12345"
$env:DB_USER="avnadmin"
$env:DB_PASSWORD="your_password"
$env:DB_NAME="defaultdb"

# Apply tables, performance indexes, and seed admin:
npm run schema:apply
npm run indexes:apply
npm run admin:bootstrap
```

---

## Step 4: Deploy the Frontend (Render Static Site)

1. In your Render Dashboard, click **New +** $\rightarrow$ select **Static Site**.
2. Connect your GitHub repository: `groupManagementPortal`.
3. Configure the settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `gm-portal` |
| **Branch** | `main` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory**| `dist` |

4. Scroll down to **Environment Variables** and add:

| Environment Variable | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://gm-portal-api.onrender.com` | Your backend URL from Step 2 |

5. Under **Redirects/Rewrites**, add a rewrite rule so React Router page refreshes work:
   * **Source:** `/*`
   * **Destination:** `/index.html`
   * **Action:** `Rewrite`

6. Click **Deploy Static Site**.

---

## Step 5: Final Cross-Origin Verification

Once your frontend is deployed (e.g. `https://gm-portal.onrender.com`):
1. Go back to your **Backend Service** $\rightarrow$ **Environment Variables**.
2. Make sure `CORS_ALLOWED_ORIGINS` and `FRONTEND_ORIGIN` match your exact frontend URL:
   ```text
   CORS_ALLOWED_ORIGINS=https://gm-portal.onrender.com
   FRONTEND_ORIGIN=https://gm-portal.onrender.com
   ```
3. Save changes (Render will automatically redeploy the backend in 10 seconds).

---

## Step 6 (Optional): Add Render Redis

If you want distributed Redis caching and WebSocket synchronization:
1. In Render Dashboard $\rightarrow$ **New +** $\rightarrow$ **Redis**.
2. Name it `gm-redis` $\rightarrow$ choose **Free**.
3. Copy the **Internal Redis URL** (`redis://red-xxxx:6379`).
4. Paste it into your Backend Service's environment variables:
   ```text
   REDIS_URL=redis://red-xxxx:6379
   ```
5. Save changes. GM Portal will automatically switch from the in-memory cache fallback to the live Redis cluster!

---

## Summary Checklist

- [ ] Cloud MySQL running on Aiven or TiDB Cloud.
- [ ] Schema, performance indexes, and admin user bootstrapped.
- [ ] Backend deployed as a **Web Service** with `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none`.
- [ ] Frontend deployed as a **Static Site** with `VITE_API_BASE_URL` pointing to backend.
- [ ] SPA rewrite rule `/*` $\rightarrow$ `/index.html` added to Static Site.
- [ ] CORS allowed origin set to frontend URL.
