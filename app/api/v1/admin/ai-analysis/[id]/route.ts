import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/utils/jwt'
import { UnauthorizedError } from '@/lib/errors/http-error'
import { getAssessmentById, saveAiAnalysis } from '@/services/assessment.service'
import { streamDISCAnalysis } from '@/services/ai.service'
import type { DiscScores } from '@/lib/disc-calculator'

export async function POST(req: NextRequest, ctx: unknown) {
  try {
    // 手动鉴权（因为流式响应返回 Response 而非 NextResponse）
    const token = req.cookies.get('admin_token')?.value
      || req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    const payload = verifyAdminToken(token)
    if (!payload) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
    }

    const { id } = await (ctx as { params: Promise<{ id: string }> }).params
    const assessment = await getAssessmentById(id)
    const scores = assessment.scores as unknown as DiscScores

    const result = streamDISCAnalysis({
      name: assessment.name,
      company: assessment.company,
      department: assessment.department,
      age: assessment.age,
      gender: assessment.gender,
      scores,
      primaryType: assessment.primaryType,
    })

    // 异步保存完整分析（不阻塞流）
    result.text
      .then((text) => saveAiAnalysis(id, text))
      .catch((err) => console.error('Failed to save AI analysis:', err))

    return result.toDataStreamResponse()
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      const httpError = error as { status: number; message: string }
      return NextResponse.json({ error: httpError.message }, { status: httpError.status })
    }
    console.error('[AI Analysis Error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
