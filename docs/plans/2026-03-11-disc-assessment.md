# DISC 性格色彩测评平台 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建基于 DISC 性格色彩测试的 AI 测评分析平台，包含 H5 用户端和 Admin 管理后台。

**Architecture:** Next.js 15 App Router 单体应用，使用路由组 `(h5)` 和 `admin` 分离两端，遵循 daka 项目的分层架构（API层 → HOF层 → Service层 → Prisma层）。AI 分析使用 Vercel AI SDK + OpenAI Compatible 接口，图表使用 shadcn/ui 内置的 Recharts。

**Tech Stack:** Next.js 15, shadcn/ui, Tailwind CSS v4, Prisma 6, PostgreSQL, Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`), Recharts, pnpm, Docker

---

## DISC 题目数据（30题）

每道题有4个选项，对应4种颜色：
- 红 (Red) = I 型（影响型）：热情、善表达、活泼
- 蓝 (Blue) = C 型（谨慎型）：精确、分析、谨慎
- 黄 (Yellow) = D 型（主导型）：果断、目标导向、领导力
- 绿 (Green) = S 型（稳定型）：稳重、协作、耐心

计分方式：统计每种颜色的选择次数，30题总分，转为百分比展示饼图。

---

## 项目结构

```
disc-assessment/
├── app/
│   ├── (h5)/                        # H5 移动端（无路由前缀）
│   │   ├── layout.tsx               # H5 根布局
│   │   ├── page.tsx                 # 欢迎/介绍页
│   │   ├── info/
│   │   │   └── page.tsx             # 用户信息填写
│   │   ├── test/
│   │   │   └── page.tsx             # 答题页（30题）
│   │   └── result/
│   │       └── [id]/
│   │           └── page.tsx         # 结果页（饼图 + 描述）
│   ├── admin/                       # 管理后台
│   │   ├── layout.tsx               # Admin 根布局（鉴权）
│   │   ├── login/
│   │   │   └── page.tsx             # 登录页
│   │   ├── page.tsx                 # 仪表板（所有测评列表）
│   │   └── assessments/
│   │       └── [id]/
│   │           └── page.tsx         # 单个测评详情 + AI 分析
│   ├── api/
│   │   └── v1/
│   │       ├── assessments/
│   │       │   ├── route.ts         # POST /api/v1/assessments
│   │       │   └── [id]/
│   │       │       └── route.ts     # GET /api/v1/assessments/:id
│   │       └── admin/
│   │           ├── login/
│   │           │   └── route.ts     # POST /api/v1/admin/login
│   │           ├── assessments/
│   │           │   └── route.ts     # GET /api/v1/admin/assessments
│   │           └── ai-analysis/
│   │               └── [id]/
│   │                   └── route.ts # POST streaming AI 分析
│   ├── globals.css
│   └── layout.tsx                   # Root layout
├── components/
│   ├── ui/                          # shadcn/ui 组件
│   └── disc/
│       ├── question-card.tsx        # 单题组件
│       ├── progress-bar.tsx         # 进度条
│       ├── result-chart.tsx         # 饼图结果
│       └── color-badge.tsx          # 颜色标签
├── lib/
│   ├── db.ts                        # Prisma 客户端单例
│   ├── disc-data.ts                 # 30题数据 + 颜色映射
│   ├── disc-calculator.ts           # DISC 计分逻辑
│   ├── config/
│   │   └── http.ts                  # Cookie / JWT 配置
│   ├── dto/
│   │   ├── assessment.dto.ts        # 测评 Zod schemas
│   │   └── admin.dto.ts             # 管理员 Zod schemas
│   ├── errors/
│   │   └── http-error.ts            # 错误类
│   ├── hofs/
│   │   ├── with-error-handler.ts    # 错误处理 HOF
│   │   ├── with-auth.ts             # Admin JWT 鉴权 HOF
│   │   └── with-body-validation.ts  # 请求体验证 HOF
│   └── utils/
│       └── jwt.ts                   # JWT 工具
├── services/
│   ├── assessment.service.ts        # 测评业务逻辑
│   ├── admin.service.ts             # 管理员业务逻辑
│   └── ai.service.ts                # AI 分析
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                      # 初始管理员账号
├── public/
├── .env.example
├── .env.local                       # 本地开发（不提交）
├── Dockerfile
├── docker-compose.yml
├── docker-entrypoint.sh
├── next.config.mjs
├── tailwind.config.ts
├── components.json
├── tsconfig.json
├── package.json
└── CLAUDE.md
```

---

## Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `tsconfig.json`
- Create: `components.json`
- Create: `tailwind.config.ts`
- Create: `.env.example`
- Create: `CLAUDE.md`

**Step 1: 创建 Next.js 项目**

```bash
cd /Users/peterpeng/Workspace
npx create-next-app@latest disc-assessment \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-pnpm
```

**Step 2: 安装核心依赖**

```bash
cd disc-assessment
pnpm add @prisma/client prisma
pnpm add ai @ai-sdk/openai-compatible
pnpm add jsonwebtoken bcryptjs
pnpm add zod react-hook-form @hookform/resolvers
pnpm add date-fns
pnpm add -D @types/jsonwebtoken @types/bcryptjs
```

**Step 3: 初始化 shadcn/ui**

```bash
pnpm dlx shadcn@latest init
# 选择: New York style, CSS variables: yes
```

**Step 4: 安装 shadcn 组件**

```bash
pnpm dlx shadcn@latest add button card input label textarea select badge progress chart separator sheet skeleton sonner
```

**Step 5: 验证启动**

```bash
pnpm dev
# 访问 http://localhost:3000 确认正常
```

---

## Task 2: Prisma Schema + 数据库

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `lib/db.ts`

**Step 1: 初始化 Prisma**

```bash
pnpm exec prisma init --datasource-provider postgresql
```

**Step 2: 编写 Schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Assessment {
  id          String   @id @default(cuid())
  name        String
  phone       String?
  email       String?
  company     String?
  department  String?
  age         Int?
  gender      String?
  // answers: [{questionIndex: number, color: 'red'|'blue'|'yellow'|'green'}]
  answers     Json
  // scores: {red: number, blue: number, yellow: number, green: number}
  scores      Json
  primaryType String   // 'red' | 'blue' | 'yellow' | 'green'
  aiAnalysis  String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("assessments")
}

model AdminUser {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("admin_users")
}
```

**Step 3: 创建 Seed 文件**

`prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password },
  })
  console.log('Seed completed. Admin: admin/admin123')
}

main().finally(() => prisma.$disconnect())
```

**Step 4: 运行迁移**

```bash
# 先在 .env 配置 DATABASE_URL
pnpm exec prisma migrate dev --name init
pnpm exec prisma db seed
```

**Step 5: 创建 `lib/db.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

---

## Task 3: DISC 题目数据 + 计分逻辑

**Files:**
- Create: `lib/disc-data.ts`
- Create: `lib/disc-calculator.ts`

**Step 1: 创建题目数据**

`lib/disc-data.ts`:
```typescript
export type DiscColor = 'red' | 'blue' | 'yellow' | 'green'

export interface DiscOption {
  color: DiscColor
  text: string
}

export interface DiscQuestion {
  index: number
  text: string
  options: DiscOption[]
}

export const DISC_QUESTIONS: DiscQuestion[] = [
  {
    index: 1,
    text: '关于人生观，我的内心其实是:',
    options: [
      { color: 'red', text: '希望能有各种各样的人生体验，所以想法极其多样化。' },
      { color: 'blue', text: '在合理的基础上，谨慎确定目标，一旦确定会坚定不移地去做。' },
      { color: 'yellow', text: '更加在乎取得一切有可能的成就。' },
      { color: 'green', text: '毫不喜欢风险，喜欢享受稳定或现状。' },
    ],
  },
  // ... (30 题完整数据见 Task 3 实现)
]

export const DISC_COLORS = {
  red: { label: '红色 (I型)', name: '影响型', description: '热情、善表达、活泼、乐观', hex: '#ef4444' },
  blue: { label: '蓝色 (C型)', name: '谨慎型', description: '精确、分析、谨慎、系统', hex: '#3b82f6' },
  yellow: { label: '黄色 (D型)', name: '主导型', description: '果断、直接、目标导向、领导力', hex: '#eab308' },
  green: { label: '绿色 (S型)', name: '稳定型', description: '稳重、耐心、协作、一致性', hex: '#22c55e' },
}
```

**Step 2: 创建计分逻辑**

`lib/disc-calculator.ts`:
```typescript
import type { DiscColor } from './disc-data'

export interface DiscScores {
  red: number
  blue: number
  yellow: number
  green: number
}

export interface DiscAnswer {
  questionIndex: number
  color: DiscColor
}

export function calculateScores(answers: DiscAnswer[]): DiscScores {
  const scores: DiscScores = { red: 0, blue: 0, yellow: 0, green: 0 }
  for (const answer of answers) {
    scores[answer.color]++
  }
  return scores
}

export function getPrimaryType(scores: DiscScores): DiscColor {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as DiscColor
}

export function scoresToPercentages(scores: DiscScores): DiscScores {
  const total = scores.red + scores.blue + scores.yellow + scores.green
  if (total === 0) return { red: 0, blue: 0, yellow: 0, green: 0 }
  return {
    red: Math.round((scores.red / total) * 100),
    blue: Math.round((scores.blue / total) * 100),
    yellow: Math.round((scores.yellow / total) * 100),
    green: Math.round((scores.green / total) * 100),
  }
}
```

---

## Task 4: 基础设施层（HOF + DTO + 错误处理）

**Files:**
- Create: `lib/errors/http-error.ts`
- Create: `lib/hofs/with-error-handler.ts`
- Create: `lib/hofs/with-auth.ts`
- Create: `lib/hofs/with-body-validation.ts`
- Create: `lib/utils/jwt.ts`
- Create: `lib/config/http.ts`
- Create: `lib/dto/assessment.dto.ts`
- Create: `lib/dto/admin.dto.ts`

**Step 1: 错误类**

`lib/errors/http-error.ts`:
```typescript
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message)
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request') {
    super(400, message)
  }
}
```

**Step 2: withErrorHandler HOF**

`lib/hofs/with-error-handler.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { HttpError } from '../errors/http-error'

type Handler = (req: NextRequest, ctx: unknown) => Promise<NextResponse>

export function withErrorHandler(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      console.error('[API Error]', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}
```

**Step 3: withAuth HOF（Admin JWT 鉴权）**

`lib/hofs/with-auth.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '../utils/jwt'
import { UnauthorizedError } from '../errors/http-error'

type Handler = (req: NextRequest & { adminId: string }, ctx: unknown) => Promise<NextResponse>

export function withAdminAuth(handler: Handler) {
  return async (req: NextRequest, ctx: unknown) => {
    const token = req.cookies.get('admin_token')?.value
    if (!token) throw new UnauthorizedError()
    const payload = verifyAdminToken(token)
    if (!payload) throw new UnauthorizedError()
    ;(req as NextRequest & { adminId: string }).adminId = payload.id
    return handler(req as NextRequest & { adminId: string }, ctx)
  }
}
```

**Step 4: withBodyValidation HOF**

`lib/hofs/with-body-validation.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { BadRequestError } from '../errors/http-error'

export function withBodyValidation<T>(schema: ZodSchema<T>) {
  return (handler: (req: NextRequest & { body: T }, ctx: unknown) => Promise<NextResponse>) =>
    async (req: NextRequest, ctx: unknown) => {
      const json = await req.json().catch(() => { throw new BadRequestError('Invalid JSON') })
      const result = schema.safeParse(json)
      if (!result.success) throw new BadRequestError(result.error.message)
      ;(req as NextRequest & { body: T }).body = result.data
      return handler(req as NextRequest & { body: T }, ctx)
    }
}
```

**Step 5: JWT 工具**

`lib/utils/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export function signAdminToken(payload: { id: string; username: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyAdminToken(token: string): { id: string; username: string } | null {
  try {
    return jwt.verify(token, SECRET) as { id: string; username: string }
  } catch {
    return null
  }
}
```

**Step 6: DTO Schemas**

`lib/dto/assessment.dto.ts`:
```typescript
import { z } from 'zod'

export const createAssessmentSchema = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  department: z.string().optional(),
  age: z.number().int().min(1).max(150).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  answers: z.array(z.object({
    questionIndex: z.number().int().min(1).max(30),
    color: z.enum(['red', 'blue', 'yellow', 'green']),
  })).length(30),
})

export type CreateAssessmentRequest = z.infer<typeof createAssessmentSchema>
```

`lib/dto/admin.dto.ts`:
```typescript
import { z } from 'zod'

export const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export type AdminLoginRequest = z.infer<typeof adminLoginSchema>
```

---

## Task 5: Service 层

**Files:**
- Create: `services/assessment.service.ts`
- Create: `services/admin.service.ts`
- Create: `services/ai.service.ts`

**Step 1: Assessment Service**

`services/assessment.service.ts`:
```typescript
import { db } from '@/lib/db'
import { calculateScores, getPrimaryType } from '@/lib/disc-calculator'
import type { CreateAssessmentRequest } from '@/lib/dto/assessment.dto'
import { NotFoundError } from '@/lib/errors/http-error'

export async function createAssessment(data: CreateAssessmentRequest) {
  const scores = calculateScores(data.answers)
  const primaryType = getPrimaryType(scores)
  return db.assessment.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      company: data.company,
      department: data.department,
      age: data.age,
      gender: data.gender,
      answers: data.answers,
      scores,
      primaryType,
    },
  })
}

export async function getAssessmentById(id: string) {
  const assessment = await db.assessment.findUnique({ where: { id } })
  if (!assessment) throw new NotFoundError('Assessment not found')
  return assessment
}

export async function listAssessments(page = 1, limit = 20) {
  const [list, total] = await Promise.all([
    db.assessment.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, primaryType: true, scores: true,
        company: true, createdAt: true, aiAnalysis: true,
      },
    }),
    db.assessment.count(),
  ])
  return { list, total, totalPages: Math.ceil(total / limit) }
}

export async function saveAiAnalysis(id: string, analysis: string) {
  return db.assessment.update({ where: { id }, data: { aiAnalysis: analysis } })
}
```

**Step 2: Admin Service**

`services/admin.service.ts`:
```typescript
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { UnauthorizedError } from '@/lib/errors/http-error'
import { signAdminToken } from '@/lib/utils/jwt'

export async function loginAdmin(username: string, password: string) {
  const admin = await db.adminUser.findUnique({ where: { username } })
  if (!admin) throw new UnauthorizedError('用户名或密码错误')
  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) throw new UnauthorizedError('用户名或密码错误')
  const token = signAdminToken({ id: admin.id, username: admin.username })
  return { token, username: admin.username }
}
```

**Step 3: AI Service**

`services/ai.service.ts`:
```typescript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'
import type { Assessment } from '@prisma/client'
import { DISC_COLORS } from '@/lib/disc-data'

const provider = createOpenAICompatible({
  name: 'custom',
  baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.AI_API_KEY || '',
})

export function streamDISCAnalysis(assessment: Assessment) {
  const scores = assessment.scores as Record<string, number>
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const percentages = Object.entries(scores)
    .map(([k, v]) => `${DISC_COLORS[k as keyof typeof DISC_COLORS].label}: ${Math.round((v / total) * 100)}%`)
    .join('、')

  const primaryColor = DISC_COLORS[assessment.primaryType as keyof typeof DISC_COLORS]

  const prompt = `你是一名专业的 DISC 性格色彩测评师。请根据以下测评结果，为该用户提供一份详细的性格分析报告。

用户信息：
- 姓名：${assessment.name}
${assessment.company ? `- 公司/组织：${assessment.company}` : ''}
${assessment.department ? `- 部门：${assessment.department}` : ''}
${assessment.age ? `- 年龄：${assessment.age}岁` : ''}
${assessment.gender ? `- 性别：${assessment.gender === 'male' ? '男' : assessment.gender === 'female' ? '女' : '其他'}` : ''}

DISC 测评结果：
- 主要性格类型：${primaryColor.name}（${primaryColor.label}）
- 各维度分布：${percentages}
- 性格特征：${primaryColor.description}

请提供以下分析内容（使用 Markdown 格式）：

## 性格概述
（描述该用户的主要性格特征，200字左右）

## 优势特质
（列出3-5个优势）

## 潜在挑战
（列出2-3个需要注意的挑战）

## 沟通建议
（如何与该性格类型的人有效沟通，100字左右）

## 职业发展建议
（适合的工作风格和职业方向，150字左右）

## 成长建议
（针对该性格类型的个人发展建议，100字左右）`

  return streamText({
    model: provider(process.env.AI_MODEL || 'gpt-4o-mini'),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })
}
```

---

## Task 6: API 路由

**Files:**
- Create: `app/api/v1/assessments/route.ts`
- Create: `app/api/v1/assessments/[id]/route.ts`
- Create: `app/api/v1/admin/login/route.ts`
- Create: `app/api/v1/admin/assessments/route.ts`
- Create: `app/api/v1/admin/ai-analysis/[id]/route.ts`
- Create: `app/api/health/route.ts`

**Step 1: 创建测评接口**

`app/api/v1/assessments/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { withBodyValidation } from '@/lib/hofs/with-body-validation'
import { createAssessmentSchema } from '@/lib/dto/assessment.dto'
import { createAssessment } from '@/services/assessment.service'

const handler = withErrorHandler(
  withBodyValidation(createAssessmentSchema)(async (req) => {
    const assessment = await createAssessment(req.body)
    return NextResponse.json({ id: assessment.id }, { status: 201 })
  })
)

export const POST = handler
```

**Step 2: 获取测评详情**

`app/api/v1/assessments/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { getAssessmentById } from '@/services/assessment.service'

export const GET = withErrorHandler(async (_req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params
  const assessment = await getAssessmentById(id)
  return NextResponse.json(assessment)
})
```

**Step 3: Admin 登录接口**

`app/api/v1/admin/login/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { withBodyValidation } from '@/lib/hofs/with-body-validation'
import { adminLoginSchema } from '@/lib/dto/admin.dto'
import { loginAdmin } from '@/services/admin.service'

export const POST = withErrorHandler(
  withBodyValidation(adminLoginSchema)(async (req) => {
    const { token, username } = await loginAdmin(req.body.username, req.body.password)
    const res = NextResponse.json({ username })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      path: '/',
    })
    return res
  })
)
```

**Step 4: Admin 测评列表接口**

`app/api/v1/admin/assessments/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { withAdminAuth } from '@/lib/hofs/with-auth'
import { listAssessments } from '@/services/assessment.service'

export const GET = withErrorHandler(
  withAdminAuth(async (req) => {
    const page = Number(req.nextUrl.searchParams.get('page') || 1)
    const data = await listAssessments(page)
    return NextResponse.json(data)
  })
)
```

**Step 5: AI 分析流式接口**

`app/api/v1/admin/ai-analysis/[id]/route.ts`:
```typescript
import { NextRequest } from 'next/server'
import { withAdminAuth } from '@/lib/hofs/with-auth'
import { getAssessmentById, saveAiAnalysis } from '@/services/assessment.service'
import { streamDISCAnalysis } from '@/services/ai.service'

export const POST = withAdminAuth(async (_req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params
  const assessment = await getAssessmentById(id)
  const result = streamDISCAnalysis(assessment)

  // 收集完整内容并保存
  let fullText = ''
  const stream = result.toDataStreamResponse()

  // 异步保存（不阻塞流式返回）
  result.text.then((text) => saveAiAnalysis(id, text)).catch(console.error)

  return stream
})
```

**Step 6: 健康检查接口**

`app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export const GET = () => NextResponse.json({ status: 'ok' })
```

---

## Task 7: H5 端 - 欢迎页 + 信息填写

**Files:**
- Create: `app/(h5)/layout.tsx`
- Create: `app/(h5)/page.tsx`
- Create: `app/(h5)/info/page.tsx`

**Step 1: H5 根布局**

`app/(h5)/layout.tsx`:
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DISC 性格色彩测评',
  description: '了解你的性格色彩，发现真实的自己',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function H5Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-md min-h-screen">
        {children}
      </div>
    </div>
  )
}
```

**Step 2: 欢迎页**

`app/(h5)/page.tsx` — 包含：
- 大标题 "DISC 性格色彩测评"
- 4种颜色的简介卡片（红/蓝/黄/绿）
- "开始测评" 按钮 → 跳转 /info
- 说明：共30题，约需5分钟

**Step 3: 信息填写页**

`app/(h5)/info/page.tsx` — 包含：
- 姓名（必填）
- 手机号（可选）
- 公司（可选）
- 部门（可选）
- 年龄（可选）
- 性别选择（可选）
- 提交后跳转 `/test` 并将信息存在 sessionStorage

---

## Task 8: H5 端 - 答题页

**Files:**
- Create: `app/(h5)/test/page.tsx`
- Create: `components/disc/question-card.tsx`
- Create: `components/disc/progress-bar.tsx`

**Step 1: 题目组件**

`components/disc/question-card.tsx`:
- 显示题目编号和题目文本
- 4个选项用不同颜色高亮（选中后变为对应色）
- 选中动画效果

**Step 2: 进度条组件**

`components/disc/progress-bar.tsx`:
- 显示当前进度 X/30
- shadcn Progress 组件

**Step 3: 答题页主逻辑**

`app/(h5)/test/page.tsx`:
- 从 sessionStorage 读取用户信息
- 显示30道题目（一题一屏，滑动切换）
- 记录答案在 state 中
- 全部完成后调用 POST /api/v1/assessments 提交
- 跳转到 /result/[id]

---

## Task 9: H5 端 - 结果页

**Files:**
- Create: `app/(h5)/result/[id]/page.tsx`
- Create: `components/disc/result-chart.tsx`
- Create: `components/disc/color-badge.tsx`

**Step 1: 饼图组件**

`components/disc/result-chart.tsx`:
- 使用 shadcn/ui Charts（基于 Recharts）
- 4色饼图：红/蓝/黄/绿
- 显示每种颜色的百分比

**Step 2: 颜色标签组件**

`components/disc/color-badge.tsx`:
- 彩色圆角标签，根据颜色显示对应样式

**Step 3: 结果页**

`app/(h5)/result/[id]/page.tsx` (Server Component):
- GET /api/v1/assessments/:id 获取结果
- 展示主要性格类型（大号字体+颜色高亮）
- 饼图展示4色分布
- 各颜色特质说明
- 分享/截图按钮（可选）

---

## Task 10: Admin 端

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/assessments/[id]/page.tsx`

**Step 1: Admin 根布局**

`app/admin/layout.tsx`:
- 顶部导航栏（Logo + 退出按钮）
- 侧边栏（仪表板 / 测评列表）
- 鉴权检查（cookie 中有 admin_token 才显示）

**Step 2: 登录页**

`app/admin/login/page.tsx`:
- 居中登录卡片
- 用户名/密码输入
- 提交后 POST /api/v1/admin/login
- 成功后跳转 /admin

**Step 3: 仪表板**

`app/admin/page.tsx`:
- 统计卡片（总测评数、今日新增、主要类型分布）
- 测评列表表格（姓名、主类型、公司、时间、AI分析状态）
- 分页功能
- 搜索功能（可选）

**Step 4: 测评详情页**

`app/admin/assessments/[id]/page.tsx`:
- 用户基本信息展示
- DISC 饼图（同 H5 端复用组件）
- AI 分析区域：
  - "生成 AI 分析" 按钮
  - 流式显示 AI 分析内容（Markdown 渲染）
  - 已有分析则直接显示

---

## Task 11: 配置文件

**Files:**
- Create: `next.config.mjs`
- Create: `.env.example`
- Create: `CLAUDE.md`

**Step 1: next.config.mjs**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

export default nextConfig
```

**Step 2: .env.example**

```env
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/disc_assessment

# JWT
JWT_SECRET=your-secret-key-here

# AI 配置 (OpenAI Compatible)
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-api-key-here
AI_MODEL=gpt-4o-mini

# App
PORT=3000
NODE_ENV=development
```

---

## Task 12: Docker 配置

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `docker-entrypoint.sh`

**Step 1: Dockerfile**

参考 daka 项目的多阶段构建：
- base: node:20-alpine + 国内镜像源 + pnpm
- deps: 安装依赖
- builder: 生成 Prisma Client + 构建
- runner: 精简生产镜像

**Step 2: docker-compose.yml**

```yaml
services:
  disc-assessment:
    build: .
    image: disc-assessment:latest
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - AI_BASE_URL=${AI_BASE_URL}
      - AI_API_KEY=${AI_API_KEY}
      - AI_MODEL=${AI_MODEL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - 1panel-network

networks:
  1panel-network:
    external: true
```

**Step 3: docker-entrypoint.sh**

```bash
#!/bin/sh
set -e
echo "Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy
echo "Starting disc-assessment..."
exec node server.js
```

---

## Task 13: 完整 DISC 题目数据填充

`lib/disc-data.ts` 中填充完整30题数据（基于 DISC测试 docx）

---

## 执行顺序

1. Task 1 (初始化项目) → Task 2 (Prisma) → Task 3 (DISC数据) → Task 4 (基础设施)
2. Task 5 (Service层) → Task 6 (API层) → Task 7 (H5欢迎+信息)
3. Task 8 (H5答题) → Task 9 (H5结果) → Task 10 (Admin端)
4. Task 11 (配置) → Task 12 (Docker) → Task 13 (完整题目)

---

## 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| DATABASE_URL | PostgreSQL 连接串 | postgresql://user:pass@host:5432/disc |
| JWT_SECRET | JWT 签名密钥 | random-string |
| AI_BASE_URL | AI API 基础URL | https://api.openai.com/v1 |
| AI_API_KEY | AI API 密钥 | sk-... |
| AI_MODEL | 使用的模型 | gpt-4o-mini |
| PORT | 服务端口 | 3002 |
