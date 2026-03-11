import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { withAdminAuth } from '@/lib/hofs/with-admin-auth'
import { getAssessmentStats } from '@/services/assessment.service'

export const GET = withErrorHandler(
  withAdminAuth(async () => {
    const stats = await getAssessmentStats()
    return NextResponse.json(stats)
  })
)
