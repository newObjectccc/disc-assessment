import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'
import { DISC_COLORS } from '@/lib/disc-data'
import type { DiscScores } from '@/lib/disc-calculator'

function getProvider() {
  return createOpenAICompatible({
    name: 'custom',
    baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.AI_API_KEY || '',
  })
}

interface AssessmentForAI {
  name: string
  company?: string | null
  department?: string | null
  age?: number | null
  gender?: string | null
  scores: DiscScores
  primaryType: string
}

export function streamDISCAnalysis(assessment: AssessmentForAI) {
  const scores = assessment.scores
  const total = scores.red + scores.blue + scores.yellow + scores.green
  const percentages = [
    `${DISC_COLORS.red.label}: ${Math.round((scores.red / total) * 100)}%`,
    `${DISC_COLORS.blue.label}: ${Math.round((scores.blue / total) * 100)}%`,
    `${DISC_COLORS.yellow.label}: ${Math.round((scores.yellow / total) * 100)}%`,
    `${DISC_COLORS.green.label}: ${Math.round((scores.green / total) * 100)}%`,
  ].join('、')

  const primaryColor = DISC_COLORS[assessment.primaryType as keyof typeof DISC_COLORS]
  const genderText = assessment.gender === 'male' ? '男' : assessment.gender === 'female' ? '女' : ''

  const prompt = `你是一名专业的 DISC 性格色彩测评师，拥有丰富的心理学和职业发展咨询经验。请根据以下测评结果，为该用户提供一份专业、详细且具有实用价值的性格分析报告。

**被测评者信息：**
- 姓名：${assessment.name}${assessment.company ? `\n- 公司/组织：${assessment.company}` : ''}${assessment.department ? `\n- 部门：${assessment.department}` : ''}${assessment.age ? `\n- 年龄：${assessment.age}岁` : ''}${genderText ? `\n- 性别：${genderText}` : ''}

**DISC 测评结果：**
- 主要性格类型：**${primaryColor.name}**（${primaryColor.label}）
- 各维度得分分布：${percentages}
- 核心特质：${primaryColor.description}

请提供以下分析内容（使用 Markdown 格式，语言亲切专业）：

## 性格概述

（基于测评结果，描述该用户的主要性格特征、行为模式和内在驱动力，200字左右）

## 核心优势

（列出3-5个主要优势，每条用简短的标题+2-3句解释说明）

## 潜在挑战

（列出2-3个需要关注的发展领域，实事求是，给出具体表现）

## 沟通风格建议

（描述与该性格类型人有效沟通的技巧和注意事项，100字左右）

## 职业发展建议

（适合的工作环境、工作风格和职业方向推荐，150字左右）

## 个人成长建议

（针对该性格类型提供3条具体的个人成长行动建议）`

  const provider = getProvider()
  return streamText({
    model: provider(process.env.AI_MODEL || 'gpt-4o-mini'),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    maxTokens: 2000,
  })
}
