#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[zflow] Running database migrations..."
  npx sequelize db:migrate
  echo "[zflow] Migrations completed"
fi

if [ "$RUN_SEEDS" = "true" ]; then
  echo "[zflow] Running database seeds..."
  npx sequelize db:seed:all
  echo "[zflow] Seeds completed"
fi

exec node dist/server.js
