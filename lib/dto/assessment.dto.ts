import { z } from 'zod'

export const discAnswerSchema = z.object({
  questionIndex: z.number().int().min(1).max(30),
  color: z.enum(['red', 'blue', 'yellow', 'green']),
})

export const createAssessmentSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名过长'),
  phone: z.string().optional(),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')).transform(v => v || undefined),
  company: z.string().optional(),
  department: z.string().optional(),
  age: z.number().int().min(1).max(150).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  answers: z.array(discAnswerSchema).length(30, '必须完成全部30道题目'),
})

export type CreateAssessmentRequest = z.infer<typeof createAssessmentSchema>
