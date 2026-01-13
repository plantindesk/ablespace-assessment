FROM mcr.microsoft.com/playwright:v1.50.0-jammy AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm build

FROM mcr.microsoft.com/playwright:v1.50.0-jammy AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]