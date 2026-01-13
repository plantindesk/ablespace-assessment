# Stage 1: Build
FROM mcr.microsoft.com/playwright:v1.50.0-jammy AS builder

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

RUN pnpm install --frozen-lockfile --prod=false

COPY . .

RUN pnpm build

# Stage 2: Production (smaller image)
FROM mcr.microsoft.com/playwright:v1.50.0-jammy

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

RUN pnpm install --prod --frozen-lockfile

RUN npx playwright install-deps chromium

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
