#!/bin/sh
set -e

echo "Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy

if [ "${RUN_SEED}" = "true" ]; then
  echo "Seeding database..."
  node_modules/.bin/ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
  echo "Seed completed."
else
  echo "Skipping seed. (Set RUN_SEED=true to seed on next startup)"
fi

echo "Starting disc-assessment on port ${PORT:-3002}..."
exec node server.js
