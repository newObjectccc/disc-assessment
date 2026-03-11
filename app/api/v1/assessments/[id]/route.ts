import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { getAssessmentById } from '@/services/assessment.service'

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params
  const assessment = await getAssessmentById(id)
  return NextResponse.json(assessment)
})
