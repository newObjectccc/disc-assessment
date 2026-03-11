import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { withAdminAuth } from '@/lib/hofs/with-admin-auth'
import { listAssessments, getAssessmentStats } from '@/services/assessment.service'

export const GET = withErrorHandler(
  withAdminAuth(async (req) => {
    const page = Number(req.nextUrl.searchParams.get('page') || '1')
    const limit = Number(req.nextUrl.searchParams.get('limit') || '20')
    const data = await listAssessments(page, limit)
    return NextResponse.json(data)
  })
)
