import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { withBodyValidation } from '@/lib/hofs/with-body-validation'
import { createAssessmentSchema } from '@/lib/dto/assessment.dto'
import { createAssessment } from '@/services/assessment.service'

export const POST = withErrorHandler(
  withBodyValidation(createAssessmentSchema)(async (req) => {
    const assessment = await createAssessment({
      name: req.__parsedBody.name,
      phone: req.__parsedBody.phone,
      email: req.__parsedBody.email,
      company: req.__parsedBody.company,
      department: req.__parsedBody.department,
      age: req.__parsedBody.age,
      gender: req.__parsedBody.gender,
      answers: req.__parsedBody.answers,
    })
    return NextResponse.json({ id: assessment.id }, { status: 201 })
  })
) as (req: NextRequest) => Promise<NextResponse>
