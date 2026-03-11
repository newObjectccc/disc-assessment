#!/bin/sh
set -e

echo "Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy

echo "Seeding database (if needed)..."
# 只在没有管理员账号时 seed（可选）

echo "Starting disc-assessment on port ${PORT:-3002}..."
exec node server.js
