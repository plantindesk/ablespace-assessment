# Switching from Node to Docker Runtime on Render

## Problem
Your Render service is currently using the **Node runtime**, which:
- Strips out `@nestjs/cli` (causing `nest: not found` errors)
- Doesn't include Playwright browser binaries
- Uses `npm install --production` by default, breaking the build

## Solution: Switch to Docker Runtime

### Step 1: Update Dockerfile

The `backend/Dockerfile` is now a **multi-stage build**:
- **Stage 1 (builder):** Installs all dependencies (including dev) and builds the NestJS app
- **Stage 2 (production):** Copies only the compiled `dist/` folder and production deps

This reduces image size while ensuring the build succeeds.

### Step 2: Update Render Service Settings

Go to your Render service dashboard:

#### A. Click "Settings" tab

#### B. Scroll to "Build & Deploy" section

#### C. Change these settings:

| Setting | Current Value | Change To |
|---------|---------------|-----------|
| **Runtime** | `Node` | **`Docker`** |
| **Root Directory** | (empty or `backend`) | **`backend`** |
| **Build Context** | (empty) | **`.`** (default) |
| **Dockerfile Path** | (empty) | **`./Dockerfile`** (default) |

### Step 3: Understanding the Settings

**Why `Root Directory: backend`?**
- Render runs all commands from this folder
- Dockerfile path is relative to this directory
- Ignores the `frontend/` folder

**Why `Build Context: .`?**
- Docker context is relative to Root Directory
- `.` means "use everything in `backend/`"
- Dockerfile will be found at `backend/Dockerfile`

**Why `Dockerfile Path: ./Dockerfile`?**
- Relative to Root Directory (`backend/`)
- Points to `backend/Dockerfile`

### Step 4: Push Changes to GitHub

The Dockerfile updates will trigger an automatic build:

```bash
git add backend/Dockerfile
git commit -m "Update Dockerfile for Render Docker runtime"
git push
```

### Step 5: Monitor Deployment

1. Go to your Render service → **Logs** tab
2. Watch for:
   - ✓ "Docker build started"
   - ✓ "Successfully built [image-id]"
   - ✓ "Deploying..."
   - ✓ "Live" status

## Expected Build Output

```
==> Building image...
==> Sending build context to Docker daemon...
Step 1/15 : FROM mcr.microsoft.com/playwright:v1.50.0-jammy AS builder
---> abc123
Step 2/15 : ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
---> Running in def456
...
Step 8/15 : RUN pnpm build
---> Running in ghi789
[nest] 23 files successfully compiled.
...
==> Deploying...
==> Successfully deployed
```

## Troubleshooting

### Error: `permission denied while trying to connect to the Docker daemon socket`

**Cause:** This shouldn't happen on Render (they handle Docker).

### Error: `pnpm: command not found`

**Solution:** Ensure `corepack enable` is in the Dockerfile (it is).

### Error: `EACCES: permission denied, open 'dist/main.js'`

**Solution:** The multi-stage build should fix this. Ensure `COPY --from=builder` is correct.

### Error: `Module not found: Can't resolve '@nestjs/common'`

**Solution:** Ensure `pnpm install --prod` runs after copying package.json in Stage 2.

### Deployment stuck at "Building"

**Cause:** Docker image is too large or build is slow.

**Solution:**
1. The multi-stage build already reduces size
2. Ensure `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` is set
3. Check Render limits (15 min build timeout)

### Error: `Error: spawn chromium ENOENT`

**Solution:** Ensure `npx playwright install-deps chromium` runs in Stage 2.

## Verification

After successful deployment:

1. **Check service is Live:**
   - Render dashboard should show green "Live" status
   - URL: `https://your-backend.onrender.com`

2. **Test health endpoint:**
   ```bash
   curl https://your-backend.onrender.com/api/scraper/health
   ```

3. **Check Swagger docs:**
   - Visit: `https://your-backend.onrender.com/api`
   - Should see Swagger UI

4. **Test a simple API call:**
   ```bash
   curl https://your-backend.onrender.com/api/catalog/categories
   ```

## Summary

| Change | Before | After |
|--------|--------|-------|
| Runtime | Node | Docker |
| Root Directory | (empty) | `backend` |
| Build Command | `npm run build` | Dockerfile handles it |
| Start Command | `npm run start:prod` | `node dist/main` (in Dockerfile) |

The Docker runtime ensures Playwright works correctly and the NestJS build succeeds.
