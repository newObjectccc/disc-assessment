# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base

# 切换到国内 Alpine 镜像源加速
RUN sed -i 's#dl-cdn.alpinelinux.org#mirrors.aliyun.com#g' /etc/apk/repositories \
    || sed -i 's#dl-cdn.alpinelinux.org#mirrors.tuna.tsinghua.edu.cn#g' /etc/apk/repositories \
    || true
RUN apk update

# 安装 pnpm
RUN npm install -g pnpm

# 设置国内 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com && \
    pnpm config set registry https://registry.npmmirror.com

WORKDIR /app

# ============================================
# 依赖安装阶段
# ============================================
FROM base AS deps

COPY package.json pnpm-lock.yaml .npmrc ./

ENV PNPM_STORE_DIR=/root/.pnpm-store
RUN --mount=type=cache,id=pnpm-store-disc,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# ============================================
# 构建阶段
# ============================================
FROM base AS builder

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BUILD_TIME=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    sh -c 'for i in 1 2 3; do pnpm exec prisma generate && break || sleep 5; done'

# 构建应用
RUN pnpm build

# ============================================
# 生产运行阶段
# ============================================
FROM node:20-alpine AS runner

RUN sed -i 's#dl-cdn.alpinelinux.org#mirrors.aliyun.com#g' /etc/apk/repositories \
    || true

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 相关
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 复制启动脚本
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
