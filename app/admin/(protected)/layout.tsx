import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Brain, LayoutDashboard, ClipboardList, LogOut } from 'lucide-react'
import { verifyAdminToken } from '@/lib/utils/jwt'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  const payload = token ? verifyAdminToken(token) : null

  if (!payload) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">DISC 测评管理</span>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              仪表板
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <ClipboardList className="w-4 h-4 mr-1.5" />
              测评记录
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {payload.username}
          </span>
          <form action="/api/v1/admin/logout" method="POST">
            <Button variant="ghost" size="sm" type="submit" className="text-slate-500 hover:text-red-600">
              <LogOut className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </header>

      {/* 主内容 */}
      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>
}
