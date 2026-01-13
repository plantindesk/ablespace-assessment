# Render Deployment Guide - Backend

## Overview
Deploying the NestJS + Playwright backend to Render's Free Tier (512MB RAM).

---

## Part 1: Optimized Dockerfile

The `backend/Dockerfile` is now configured with:
- **Base image:** `mcr.microsoft.com/playwright:v1.49.0-jammy` (optimized for browser automation)
- **Environment variables:**
  - `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` (pre-installed browsers, saves space/time)
  - `NODE_ENV=production`
- **Exposed port:** `3000`
- **Memory optimization:** Chromium dependencies pre-installed

**Note:** The scraper already has `maxConcurrency: 1` configured (see `backend/src/scraper/scraper.service.ts:139`), which is optimal for 512MB RAM.

---

## Part 2: Render Configuration (Root Directory Trick)

### Step 1: Connect GitHub Repository

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Search and select your GitHub repository
4. Click **Connect**

### Step 2: Configure Root Directory

**Crucial:** Since this is a monorepo, you must tell Render to only build the `backend` folder.

In the **Build & Deploy** section:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Runtime** | Docker |
| **Docker Context** | `.` (default) |

**Why this works:**
- Setting **Root Directory** to `backend` tells Render to run all commands from that folder
- **Docker Context** as `.` (relative to root directory) means Docker looks for `backend/Dockerfile`
- Render will ignore the `frontend/` folder entirely

### Step 3: Instance Configuration

| Setting | Value |
|---------|-------|
| Instance Type | Free |
| Region | Oregon (US West) or Frankfurt (EU) |

---

## Part 3: Environment Variables

Navigate to the Render service → **Environment** tab and add these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API port (required by Render) | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `NODE_ENV` | Environment | `production` |
| `ALLOWED_ORIGIN` | Vercel frontend domain (CORS) | `https://your-app.vercel.app` |

### Memory Safety

The scraper is already configured for 512MB RAM:
- `maxConcurrency: 1` (single browser instance)
- `maxRequestsPerMinute: 12` (rate limiting)
- Headless mode enabled

No additional environment variables needed for memory safety.

---

## Part 4: Final Step - Update Frontend

### Step 1: Get Render URL

After deployment completes (watch the **Logs** tab), Render will assign a URL like:
```
https://your-backend.onrender.com
```

### Step 2: Update Vercel Environment Variable

1. Go to [vercel.com](https://vercel.com)
2. Select your frontend project
3. Navigate to **Settings** → **Environment Variables**
4. Add/Update:
   - **Variable:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your Render backend URL (e.g., `https://your-backend.onrender.com`)
5. Click **Save**
6. Trigger a new deployment (push a commit or click **Redeploy**)

---

## Troubleshooting

### Deployment Failed - Out of Memory

**Check logs for:** `Container failed to start` or `OOMKilled`

**Solutions:**
1. The scraper is already limited to `maxConcurrency: 1`
2. Ensure `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` is set
3. Reduce `maxRequestsPerMinute` in `backend/src/scraper/scraper.service.ts:138`

### MongoDB Connection Timeout

**Solutions:**
1. Verify `MONGO_URI` is correct
2. Check MongoDB Atlas Network Access allows Render IPs (0.0.0.0/0)
3. Ensure MongoDB user has correct IP whitelist

### CORS Errors in Browser

**Solutions:**
1. Confirm `ALLOWED_ORIGIN` matches your Vercel URL exactly
2. Check Vercel domain (no trailing slash)
3. Re-deploy backend after updating env var

### 503 Service Unavailable

**Cause:** Scraper timeout or rate limiting

**Solutions:**
1. Check Render logs for specific error
2. Increase `navigationTimeoutSecs` in `scraper.service.ts`
3. The scraper automatically retries failed requests

---

## Verification Checklist

- [ ] Dockerfile builds successfully locally: `docker build -t test .`
- [ ] Render deployment status is "Live"
- [ ] Swagger docs accessible: `https://your-backend.onrender.com/api`
- [ ] Health check passes: GET `/api/scraper/health`
- [ ] CORS allows requests from Vercel domain
- [ ] MongoDB connection established
- [ ] Scraping works without OOM errors

---

## Next Steps

After backend is live:
1. Test a few API endpoints manually
2. Verify frontend can fetch data from backend
3. Monitor Render metrics (CPU, Memory) in dashboard
4. Consider upgrading to Starter tier if scaling needed
