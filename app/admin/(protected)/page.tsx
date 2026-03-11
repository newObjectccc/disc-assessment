import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, TrendingUp, Brain, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DISC_COLORS } from '@/lib/disc-data'
import type { DiscColor } from '@/lib/disc-data'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

async function fetchAdminData(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  const [statsRes, listRes] = await Promise.all([
    fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: { Cookie: `admin_token=${token}` },
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/v1/admin/assessments?limit=20`, {
      headers: { Cookie: `admin_token=${token}` },
      cache: 'no-store',
    }),
  ])
  const stats = statsRes.ok ? await statsRes.json() : null
  const listData = listRes.ok ? await listRes.json() : { list: [], total: 0 }
  return { stats, listData }
}

const colorBadgeConfig: Record<DiscColor, { className: string; label: string }> = {
  red: { className: 'bg-red-100 text-red-700 border-red-200', label: '影响型' },
  blue: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: '谨慎型' },
  yellow: { className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '主导型' },
  green: { className: 'bg-green-100 text-green-700 border-green-200', label: '稳定型' },
}

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value || ''
  const { stats, listData } = await fetchAdminData(token)

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">总测评人数</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.total ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">今日新增</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.todayCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">已生成 AI 分析</p>
                <p className="text-2xl font-bold text-slate-800">
                  {listData.list.filter((a: { aiAnalysis: string | null }) => a.aiAnalysis).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 类型分布 */}
      {stats?.byType && stats.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">性格类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.byType.map(({ primaryType, _count }: { primaryType: DiscColor; _count: { primaryType: number } }) => {
                const colorInfo = DISC_COLORS[primaryType]
                const badgeCfg = colorBadgeConfig[primaryType]
                return (
                  <div key={primaryType} className={`p-4 rounded-xl ${colorInfo.lightBgClass} border ${colorInfo.borderClass} text-center`}>
                    <div className={`text-2xl font-bold ${colorInfo.textClass}`}>{_count.primaryType}</div>
                    <div className={`text-xs font-medium ${colorInfo.textClass} mt-1`}>{colorInfo.name}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 测评列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            测评记录
            <Badge variant="secondary" className="ml-auto text-xs">
              共 {listData.total} 条
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>性格类型</TableHead>
                <TableHead>公司</TableHead>
                <TableHead>测评时间</TableHead>
                <TableHead>AI 分析</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {listData.list.map((item: {
                id: string
                name: string
                primaryType: DiscColor
                company?: string
                createdAt: string
                aiAnalysis?: string | null
              }) => {
                const badge = colorBadgeConfig[item.primaryType]
                return (
                  <TableRow key={item.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge className={`${badge.className} border`}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {item.company || '—'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(item.createdAt), 'MM/dd HH:mm', { locale: zhCN })}
                    </TableCell>
                    <TableCell>
                      {item.aiAnalysis ? (
                        <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border border-green-200">已生成</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">未生成</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/assessments/${item.id}`}>
                        <ChevronRight className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
              {listData.list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                    暂无测评记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
