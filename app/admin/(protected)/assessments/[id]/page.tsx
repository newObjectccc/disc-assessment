import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, Building2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ResultChart } from '@/components/disc/result-chart'
import { AiAnalysisSection } from '@/components/disc/ai-analysis-section'
import { DISC_COLORS } from '@/lib/disc-data'
import type { DiscColor } from '@/lib/disc-data'
import type { DiscScores } from '@/lib/disc-calculator'
import { scoresToPercentages } from '@/lib/disc-calculator'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

async function getAssessment(id: string, token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    const res = await fetch(`${baseUrl}/api/v1/admin/assessments/${id}`, {
      headers: { Cookie: `admin_token=${token}` },
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

const colorBadgeConfig: Record<DiscColor, { className: string }> = {
  red: { className: 'bg-red-100 text-red-700 border-red-200' },
  blue: { className: 'bg-blue-100 text-blue-700 border-blue-200' },
  yellow: { className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  green: { className: 'bg-green-100 text-green-700 border-green-200' },
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value || ''
  const assessment = await getAssessment(id, token)

  if (!assessment) notFound()

  const primaryType = assessment.primaryType as DiscColor
  const colorInfo = DISC_COLORS[primaryType]
  const scores = assessment.scores as DiscScores
  const percentages = scoresToPercentages(scores)
  const badge = colorBadgeConfig[primaryType]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回 + 标题 */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{assessment.name} 的测评详情</h1>
          <p className="text-sm text-slate-500">
            {format(new Date(assessment.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：用户信息 + 结果 */}
        <div className="md:col-span-1 space-y-4">
          {/* 用户信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">姓名</p>
                <p className="font-semibold text-slate-800">{assessment.name}</p>
              </div>
              {assessment.company && (
                <div>
                  <p className="text-xs text-slate-400">公司</p>
                  <p className="text-sm text-slate-700">{assessment.company}</p>
                </div>
              )}
              {assessment.department && (
                <div>
                  <p className="text-xs text-slate-400">部门</p>
                  <p className="text-sm text-slate-700">{assessment.department}</p>
                </div>
              )}
              {assessment.age && (
                <div>
                  <p className="text-xs text-slate-400">年龄</p>
                  <p className="text-sm text-slate-700">{assessment.age} 岁</p>
                </div>
              )}
              {assessment.gender && (
                <div>
                  <p className="text-xs text-slate-400">性别</p>
                  <p className="text-sm text-slate-700">
                    {assessment.gender === 'male' ? '男' : assessment.gender === 'female' ? '女' : '其他'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 主要类型 */}
          <Card>
            <CardContent className="pt-5">
              <div className="text-center">
                <Badge className={`${badge.className} border text-sm px-4 py-1.5 mb-3`}>
                  {colorInfo.name}
                </Badge>
                <p className="text-xs text-slate-500 mb-4">{colorInfo.label}</p>
                <div className="space-y-2">
                  {(['red', 'blue', 'yellow', 'green'] as DiscColor[]).map((c) => {
                    const ci = DISC_COLORS[c]
                    const pct = percentages[c]
                    return (
                      <div key={c} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${ci.bgClass}`} />
                        <span className="text-xs text-slate-500 w-14">{ci.name}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${ci.bgClass} rounded-full`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：饼图 + AI 分析 */}
        <div className="md:col-span-2 space-y-4">
          {/* 饼图 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">性格分布图</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultChart scores={scores} />
            </CardContent>
          </Card>

          {/* AI 分析 */}
          <AiAnalysisSection assessmentId={id} initialAnalysis={assessment.aiAnalysis} />
        </div>
      </div>
    </div>
  )
}
