import { db } from '@/lib/db'
import { calculateScores, getPrimaryType } from '@/lib/disc-calculator'
import { NotFoundError } from '@/lib/errors/http-error'
import type { DiscAnswer, DiscScores } from '@/lib/disc-calculator'

export interface CreateAssessmentData {
  name: string
  phone?: string
  email?: string
  company?: string
  department?: string
  age?: number
  gender?: string
  answers: DiscAnswer[]
}

export async function createAssessment(data: CreateAssessmentData) {
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
      answers: data.answers as unknown as object[],
      scores: scores as unknown as object,
      primaryType,
    },
  })
}

export async function getAssessmentById(id: string) {
  const assessment = await db.assessment.findUnique({ where: { id } })
  if (!assessment) throw new NotFoundError('测评记录不存在')
  return assessment
}

export async function listAssessments(page = 1, limit = 20) {
  const [list, total] = await Promise.all([
    db.assessment.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        primaryType: true,
        scores: true,
        company: true,
        department: true,
        createdAt: true,
        aiAnalysis: true,
      },
    }),
    db.assessment.count(),
  ])
  return {
    list,
    total,
    totalPages: Math.ceil(total / limit),
    page,
    limit,
  }
}

export async function saveAiAnalysis(id: string, analysis: string) {
  return db.assessment.update({
    where: { id },
    data: { aiAnalysis: analysis },
  })
}

export async function getAssessmentStats() {
  const [total, byType] = await Promise.all([
    db.assessment.count(),
    db.assessment.groupBy({
      by: ['primaryType'],
      _count: { primaryType: true },
    }),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayCount = await db.assessment.count({
    where: { createdAt: { gte: today } },
  })

  return { total, todayCount, byType }
}
