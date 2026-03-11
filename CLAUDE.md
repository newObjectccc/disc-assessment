# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference / 语言偏好

- **默认使用简体中文回答用户问题。**

## Project Overview

DISC 性格色彩测评平台 - 基于 DISC 理论的 AI 测评分析系统。

### 核心功能
- **H5 用户端**：填写信息 → 回答30道DISC题目 → 查看结果饼图
- **Admin 管理后台**：查看所有测评记录、触发 AI 深度分析
- **AI 分析**：基于 DISC 测评结果，使用 LLM 生成专业性格分析报告

## Tooling & Common Commands

Package manager: `pnpm`

Core scripts:
- Dev server: `pnpm dev` (port 3002)
- Production build: `pnpm build`
- Start production: `pnpm start`
- Lint: `pnpm lint`

Database & Prisma:
- After changing `prisma/schema.prisma`:
  - `pnpm exec prisma migrate dev --name <change-name>`
- Inspect DB: `pnpm exec prisma studio`
- Seed (create admin user): `pnpm prisma:seed`

## High-Level Architecture

### Top-level layout

- `app/(h5)/` – H5 移动端用户测评流程
- `app/admin/` – 管理后台（登录 + 仪表板 + 详情）
- `app/api/v1/` – API 路由
- `services/` – 业务逻辑层
- `lib/` – 共享工具、HOF、DTO、DISC数据
- `components/` – UI 组件 (shadcn/ui + 自定义)
- `prisma/` – Schema、迁移、Seed

### 路由结构

**H5 端（/）**:
- `/` → 欢迎页
- `/info` → 填写用户信息
- `/test` → 答题（30题）
- `/result/[id]` → 结果展示

**Admin 端（/admin/）**:
- `/admin/login` → 登录
- `/admin` → 仪表板 + 测评列表
- `/admin/assessments/[id]` → 测评详情 + AI 分析

**API（/api/v1/）**:
- `POST /assessments` – 提交测评
- `GET /assessments/:id` – 获取测评结果（H5端用）
- `POST /admin/login` – 管理员登录
- `POST /admin/logout` – 退出登录
- `GET /admin/assessments` – 列表（需鉴权）
- `GET /admin/assessments/:id` – 详情（需鉴权)
- `GET /admin/stats` – 统计数据（需鉴权)
- `POST /admin/ai-analysis/:id` – 触发 AI 分析（流式，需鉴权)

### 分层架构

1. **API 层** (`app/api/v1/.../route.ts`) - 使用 HOF 模式
2. **HOF 层** (`lib/hofs/`) - withErrorHandler / withAdminAuth / withBodyValidation
3. **Service 层** (`services/`) - 业务逻辑
4. **Prisma 层** (`lib/db.ts`) - 数据库

### DISC 数据

- `lib/disc-data.ts` – 30题数据 + 颜色配置
- `lib/disc-calculator.ts` – 计分逻辑
- 颜色映射：红(I/影响) / 蓝(C/谨慎) / 黄(D/主导) / 绿(S/稳定)

## Environment Variables

| 变量 | 说明 |
|------|------|
| DATABASE_URL | PostgreSQL 连接串 |
| JWT_SECRET | JWT 签名密钥 |
| AI_BASE_URL | AI API 基础 URL (OpenAI Compatible) |
| AI_API_KEY | AI API 密钥 |
| AI_MODEL | AI 模型名称 |
| NEXT_PUBLIC_APP_URL | 应用公开 URL（服务端 fetch 时使用） |
| PORT | 服务端口（默认 3002）|

## Admin 默认账号

首次运行后执行 `pnpm prisma:seed` 创建：
- 用户名：`admin`
- 密码：`admin123`

**部署后请立即修改默认密码。**

## Docker Deployment

```bash
docker compose up -d
```

与 daka 项目共享 `1panel-network` Docker 网络.
