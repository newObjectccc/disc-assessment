import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { withAdminAuth } from '@/lib/hofs/with-admin-auth'
import { getAssessmentById } from '@/services/assessment.service'

export const GET = withErrorHandler(
  withAdminAuth(async (_req, ctx) => {
    const { id } = await (ctx as { params: Promise<{ id: string }> }).params
    const assessment = await getAssessmentById(id)
    return NextResponse.json(assessment)
  })
)
