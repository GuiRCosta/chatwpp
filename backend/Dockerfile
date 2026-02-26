# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.sequelizerc ./.sequelizerc
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN mkdir -p public uploads logs

RUN addgroup -g 1001 -S nodejs \
 && adduser -S zflow -u 1001 -G nodejs \
 && chown -R zflow:nodejs /app

USER zflow

EXPOSE 7563

HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD wget -qO- http://localhost:7563/health || exit 1

ENTRYPOINT ["sh", "entrypoint.sh"]
