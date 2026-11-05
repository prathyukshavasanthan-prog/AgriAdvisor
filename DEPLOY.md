# AgriAdvisor — Render Free-Tier Deployment Guide

This guide describes how to deploy the entire **AgriAdvisor** stack to [Render](https://render.com) completely on the **Free Tier** without changing application features or user interface.

---

## 1. Architectural Overview

AgriAdvisor runs on Render as 3 coordinated services:

```
                          ┌────────────────────────────────┐
                          │     agriadvisor-frontend       │
                          │   (Render Free Static Site)    │
                          │   React 18 + Vite SPA on CDN   │
                          └───────────────┬────────────────┘
                                          │
                                HTTPS / API Requests
                          (VITE_API_URL / FRONTEND_URL CORS)
                                          │
                                          ▼
                          ┌────────────────────────────────┐
                          │      agriadvisor-backend       │
                          │   (Render Free Web Service)    │
                          │    Node.js 20 + Express API    │
                          │    Listens on process.env.PORT │
                          └──────┬──────────────────┬──────┘
                                 │                  │
               Internal HTTP/ML  │                  │  Mongoose Driver
                     Inference   │                  │  SSL Handshake
                                 ▼                  ▼
  ┌────────────────────────────────┐              ┌────────────────────────────────┐
  │         agriadvisor-ml         │              │          MongoDB Atlas         │
  │   (Render Free Web Service)    │              │       (M0 Free Tier 512MB)     │
  │    FastAPI + PyTorch on CPU    │              │       Shared Cloud Database    │
  │    Listens on $PORT            │              └────────────────────────────────┘
  └────────────────────────────────┘
                                 │ (Optional)
                                 ▼
                          ┌────────────────────────────────┐
                          │      Upstash Redis (Free)      │
                          │ (If omitted, app runs normal)  │
                          └────────────────────────────────┘
```

1. **Frontend (`agriadvisor-frontend`)**: Render Static Site (unlimited free bandwidth, no cold sleeps, global CDN delivery).
2. **Backend (`agriadvisor-backend`)**: Render Web Service (Node.js runtime, port `process.env.PORT`).
3. **ML Service (`agriadvisor-ml`)**: Render Web Service (Python runtime, PyTorch CPU-only wheels, port `$PORT`).
4. **Database**: Remote MongoDB (MongoDB Atlas M0 Free Cluster).
5. **Cache (Optional)**: Redis (Upstash Free Tier or any Redis instance). **If Redis is omitted or unreachable, AgriAdvisor automatically runs normally with no errors.**

---

## 2. Environment Variables Reference

Every secret is marked as `sync: false` in `render.yaml` so **no secrets are stored in Git**.

| Variable | Service | Required? | Default / Value | Description |
|---|---|---|---|---|
| `PORT` | Backend | System | Injected by Render | Express listens on `process.env.PORT` (defaults to 5900 locally). |
| `NODE_ENV` | Backend | **Yes** | `production` | Enables production optimizations. |
| `MONGO_URI` | Backend | **Yes** (`sync:false`) | `mongodb+srv://...` | Connection URI to remote MongoDB Atlas cluster. |
| `JWT_SECRET` | Backend | **Yes** (`sync:false`) | Random 64-char hex string | Secret key for signing and verifying farmer authentication tokens. |
| `FRONTEND_URL` | Backend | **Yes** (`sync:false`) | `https://agriadvisor-frontend.onrender.com` | Allowed frontend origin for CORS and credentials. |
| `ML_SERVICE_URL` | Backend | **Yes** (`sync:false`) | `https://agriadvisor-ml.onrender.com` | Public or internal URL of the deployed ML microservice. |
| `REDIS_URL` | Backend | *Optional* (`sync:false`) | *(Leave blank if none)* | Redis connection string. If omitted, app operates gracefully without cache. |
| `PORT` | ML Service | System | Injected by Render | Uvicorn listens on `$PORT` (defaults to 8000 locally). |
| `PYTHON_VERSION` | ML Service | **Yes** | `3.11.9` | Ensures Python 3.11 environment on Render. |
| `VITE_API_URL` | Frontend | **Yes** (`sync:false`) | `https://agriadvisor-backend.onrender.com` | Backend API base address. Built into the static bundle at compile time. |

---

## 3. Step 0: Free MongoDB Atlas Database Setup (2 Minutes)

Render free tier does not provide a managed MongoDB service. Use MongoDB's free forever M0 cluster:

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign up for free.
2. Select the **M0 Free (Shared)** cluster option (AWS / any region closest to your users, e.g., Frankfurt `eu-central-1` or Mumbai `ap-south-1`).
3. Under **Security Quickstart**:
   - **Username & Password**: Create a database user (e.g., `agriadmin` with a strong password). Save the password!
   - **Network Access / IP Access List**: Click **Add IP Address** -> Choose **Allow Access from Anywhere** (`0.0.0.0/0`) -> Click **Confirm**. (Render free web services use dynamic outbound IP addresses).
4. Click **Database** in the sidebar -> Click **Connect** on your cluster -> Select **Drivers** (Node.js).
5. Copy the connection string:
   ```
   mongodb+srv://agriadmin:<PASSWORD>@cluster0.abcde.mongodb.net/agriadvisor?retryWrites=true&w=majority
   ```
   *(Replace `<PASSWORD>` with your user password and include `/agriadvisor` before the `?`).*

---

## 4. Method A: Deploy with 1-Click Blueprint (`render.yaml`)

This repository includes a production-ready `render.yaml` specification for all 3 services.

### Click-by-Click Blueprint Instructions:

1. Push your repository to your GitHub account:
   ```bash
   git push origin main
   ```
2. Open your [Render Dashboard](https://dashboard.render.com).
3. Click the **New +** button in the top navigation bar and select **Blueprint**.
4. Connect your GitHub repository (`AgriAdvisor`).
5. Render will detect `render.yaml` and list the 3 services:
   - `agriadvisor-ml` (Web Service, Python, Free)
   - `agriadvisor-backend` (Web Service, Node, Free)
   - `agriadvisor-frontend` (Static Site, Free)
6. Render will prompt you for the `sync: false` environment variables:
   - `MONGO_URI`: Paste your MongoDB Atlas URI from Step 0.
   - `JWT_SECRET`: Generate a secure random string (e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in your terminal).
   - `REDIS_URL`: Leave blank or paste an Upstash Redis URL (AgriAdvisor handles missing Redis gracefully).
   - `ML_SERVICE_URL`: Enter `https://agriadvisor-ml.onrender.com` (or your chosen ML service name).
   - `FRONTEND_URL`: Enter `https://agriadvisor-frontend.onrender.com` (or your chosen frontend name).
   - `VITE_API_URL`: Enter `https://agriadvisor-backend.onrender.com` (or your chosen backend name).
7. Click **Apply**. Render will simultaneously provision and build all 3 services.

---

## 5. Method B: Manual Step-by-Step Deployment

If you prefer deploying services individually through the Render Dashboard:

### Service 1: Deploy ML Microservice (`agriadvisor-ml`)
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect the repository.
3. Configure the settings:
   - **Name**: `agriadvisor-ml`
   - **Region**: Same region as your database (e.g., Frankfurt or Singapore).
   - **Branch**: `main`
   - **Root Directory**: `ml-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --no-cache-dir -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. Under **Advanced** -> **Health Check Path**: `/health`
5. Click **Create Web Service**. Once deployed, copy its URL (e.g., `https://agriadvisor-ml.onrender.com`).

### Service 2: Deploy Backend API (`agriadvisor-backend`)
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect the repository.
3. Configure the settings:
   - **Name**: `agriadvisor-backend`
   - **Region**: Same region as ML service.
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = *(your MongoDB Atlas URI)*
   - `JWT_SECRET` = *(random secret string)*
   - `ML_SERVICE_URL` = `https://agriadvisor-ml.onrender.com`
   - `FRONTEND_URL` = `https://agriadvisor-frontend.onrender.com`
   - *(Optional)* `REDIS_URL` = *(leave empty if not using Redis)*
5. Under **Advanced** -> **Health Check Path**: `/health`
6. Click **Create Web Service**. Once deployed, copy its URL (e.g., `https://agriadvisor-backend.onrender.com`).

### Service 3: Deploy Frontend SPA (`agriadvisor-frontend`)
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect the repository.
3. Configure the settings:
   - **Name**: `agriadvisor-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**:
   - `VITE_API_URL` = `https://agriadvisor-backend.onrender.com`
5. Under **Redirects/Rewrites**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## 6. How to Add Demo Data to the Remote Database

AgriAdvisor includes pre-configured demo seed scripts that populate realistic demo farmers, 3 farms across India, crop lifecycles, health histories, and community disease alerts.

### Seeding via Remote Backend API (Recommended):

From your local machine terminal:

#### On Windows (PowerShell):
```powershell
$env:API_URL="https://agriadvisor-backend.onrender.com"
npm run seed:demo
```

#### On Linux / macOS (Bash):
```bash
API_URL=https://agriadvisor-backend.onrender.com npm run seed:demo
```

### Resetting Demo Data:
To clean up and restore the pristine demo state:

```powershell
$env:API_URL="https://agriadvisor-backend.onrender.com"
npm run reset:demo
```

### Pre-Seeded Demo Credentials:
After running `seed:demo`, log in to the web app with:
* **Phone Number:** `+919876543210`
* **Password:** `password123`

The demo cultivator will have 3 pre-loaded farms:
1. **Kaveri Green Valley** (Bangalore, Karnataka) — Optimal healthy state.
2. **Malwa Golden Fields** (Indore, Madhya Pradesh) — Warning state (needs irrigation/fertilizer).
3. **Punjab Agro Farms** (Jalandhar, Punjab) — Critical state with health alerts and nearby outbreak radar notifications.

---

## 7. Verification & Health Checks

Once deployed, verify that all three endpoints return HTTP 200:

1. **Backend Health Check:**
   ```bash
   curl -i https://agriadvisor-backend.onrender.com/health
   ```
   Expected response:
   ```json
   {"status":"ok","service":"AgriAdvisor API","uptime":...,"timestamp":"..."}
   ```

2. **ML Microservice Health Check:**
   ```bash
   curl -i https://agriadvisor-ml.onrender.com/health
   ```
   Expected response:
   ```json
   {"status":"healthy","models":{"crop_recommendation":true,"irrigation_advisory":true,"crop_health_diagnosis":true}}
   ```

3. **Frontend Application:**
   Open `https://agriadvisor-frontend.onrender.com` in your browser. The landing page and multi-language support (10 Indian languages) will load instantly.

> [!NOTE]
> **Free Tier Sleep Behavior:** Render Free Web Services sleep after 15 minutes of inactivity. When a request arrives, Render spins the service back up within 30 to 50 seconds. Static sites (the frontend) never sleep and always respond instantly.
