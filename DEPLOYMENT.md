# Deployment Strategy Guide

## Part 1: Backend Deployment (Docker/Railway)

### 1.1 Dockerfile Setup

The `backend/Dockerfile` is configured with:
- Base image: `mcr.microsoft.com/playwright:v1.57.0-jammy` (Playwright-ready)
- Port exposed: `3000`
- Optimized multi-stage build for production

### 1.2 Deploying to Railway

**Step 1:** Install Railway CLI
```bash
npm install -g @railway/cli
```

**Step 2:** Login to Railway
```bash
railway login
```

**Step 3:** Initialize from backend directory
```bash
cd backend
railway init
```

**Step 4:** Deploy
```bash
railway up
```

### 1.3 Deploying to Render

**Step 1:** Create a new Web Service on [render.com](https://render.com)

**Step 2:** Connect your GitHub repository

**Step 3:** Configure deployment settings:
- Root Directory: `backend`
- Environment: Docker
- Dockerfile Path: `./Dockerfile`

**Step 4:** Deploy automatically on push to main branch

### 1.4 Required Environment Variables

Set these in Railway/Render dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `NODE_ENV` | Environment | `production` |

---

## Part 2: Frontend Deployment (Vercel)

### 2.1 Importing to Vercel

**Step 1:** Create account at [vercel.com](https://vercel.com)

**Step 2:** Click "Add New" → "Project"

**Step 3:** Import your GitHub repository

### 2.2 Vercel Project Settings

Navigate to **Settings** → **General** and configure:

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Output Directory | `.next` |

### 2.3 Environment Variables

In **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway/Render backend URL (e.g., `https://your-backend.railway.app`) |

---

## Part 3: CORS & Security

### 3.1 Update `backend/src/main.ts`

Replace the existing CORS configuration to allow requests only from your Vercel domain:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',           // Local development
    'https://your-vercel-app.vercel.app'  // Production Vercel URL
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});
```

### 3.2 Security Best Practices

1. **Never expose** `MONGO_URI` or secrets in client-side code
2. Use Railway's/Render's secret management for sensitive data
3. Enable Railway's/Render's automatic SSL/TLS
4. Set `NODE_ENV=production` in all production deployments
5. Configure MongoDB network whitelist to allow only Railway/Render IPs

---

## Verification Steps

### Backend
- [ ] Container builds successfully
- [ ] API endpoints are accessible (check `/api` for Swagger)
- [ ] Health check endpoint returns 200

### Frontend
- [ ] Vercel deployment completes without errors
- [ ] API calls reach backend successfully
- [ ] All pages load and function correctly

### Integration
- [ ] Frontend can fetch data from backend
- [ ] CORS errors are resolved
- [ ] Scraping service runs without timeout issues
