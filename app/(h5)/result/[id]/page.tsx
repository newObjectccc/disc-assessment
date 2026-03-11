import { notFound } from 'next/navigation'
import { Award, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResultChart } from '@/components/disc/result-chart'
import { DISC_COLORS } from '@/lib/disc-data'
import type { DiscColor } from '@/lib/disc-data'
import type { DiscScores } from '@/lib/disc-calculator'

async function getAssessment(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    const res = await fetch(`${baseUrl}/api/v1/assessments/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params
  const assessment = await getAssessment(id)

  if (!assessment) notFound()

  const primaryType = assessment.primaryType as DiscColor
  const colorInfo = DISC_COLORS[primaryType]
  const scores = assessment.scores as DiscScores

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* 主要结果 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-3">
          <Award className="w-6 h-6 text-slate-400 mr-2" />
          <span className="text-sm text-slate-500">{assessment.name} 的测评结果</span>
        </div>
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${colorInfo.lightBgClass} border-2 ${colorInfo.borderClass} mb-4`}>
          <div className={`w-4 h-4 rounded-full ${colorInfo.bgClass}`} />
          <span className={`text-xl font-bold ${colorInfo.textClass}`}>{colorInfo.name}</span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          {colorInfo.label}
        </p>
      </div>

      {/* 饼图 */}
      <Card className="mb-5 shadow-sm border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">性格分布</CardTitle>
        </CardHeader>
        <CardContent>
          <ResultChart scores={scores} />
        </CardContent>
      </Card>

      {/* 性格描述 */}
      <Card className="mb-5 shadow-sm border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">性格特征</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {colorInfo.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {colorInfo.traits.map((trait) => (
              <Badge
                key={trait}
                variant="secondary"
                className={`${colorInfo.lightBgClass} ${colorInfo.textClass} border ${colorInfo.borderClass}`}
              >
                {trait}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 重新测评 */}
      <div className="pt-4">
        <Link href="/">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 rounded-2xl text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重新测评
          </Button>
        </Link>
        <p className="text-center text-xs text-slate-400 mt-4">
          如需详细 AI 分析报告，请联系您的测评顾问
        </p>
      </div>
    </div>
  )
}
