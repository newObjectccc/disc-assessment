import Link from 'next/link'
import { ArrowRight, Brain, Zap, Users, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const colorTypes = [
  {
    color: 'red',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700',
    label: '红色 · 影响型',
    desc: '热情洋溢，善于表达，富有感染力',
  },
  {
    color: 'blue',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-700',
    label: '蓝色 · 谨慎型',
    desc: '精确细致，逻辑清晰，追求完美',
  },
  {
    color: 'yellow',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    dotClass: 'bg-yellow-500',
    textClass: 'text-yellow-700',
    label: '黄色 · 主导型',
    desc: '果断直接，目标明确，领导力强',
  },
  {
    color: 'green',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    dotClass: 'bg-green-500',
    textClass: 'text-green-700',
    label: '绿色 · 稳定型',
    desc: '耐心稳重，协作精神，注重和谐',
  },
]

export default function WelcomePage() {
  return (
    <div className="flex flex-col min-h-screen px-5 py-8">
      {/* Header */}
      <div className="flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-green-400 mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">DISC 性格色彩</h1>
          <p className="text-slate-500 text-base leading-relaxed">
            探索你的性格密码<br />发现真实的自己
          </p>
        </div>

        {/* 特点说明 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: <Zap className="w-5 h-5" />, text: '共 30 题' },
            { icon: <Target className="w-5 h-5" />, text: '约 5 分钟' },
            { icon: <Users className="w-5 h-5" />, text: 'AI 深度分析' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
              <div className="text-slate-500">{item.icon}</div>
              <span className="text-xs text-slate-600 font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 四种性格类型 */}
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">四种性格类型</h2>
          {colorTypes.map((type) => (
            <div
              key={type.color}
              className={`flex items-center gap-3 p-4 rounded-2xl border ${type.bgClass} ${type.borderClass}`}
            >
              <div className={`w-3 h-3 rounded-full ${type.dotClass} flex-shrink-0`} />
              <div className="flex-1">
                <div className={`font-semibold text-sm ${type.textClass}`}>{type.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{type.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4">
        <Link href="/info" className="block">
          <Button size="lg" className="w-full h-14 text-base rounded-2xl bg-gradient-to-r from-slate-800 to-slate-600 hover:from-slate-700 hover:to-slate-500 shadow-lg">
            开始测评
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </Link>
        <p className="text-center text-xs text-slate-400 mt-3">
          答案无对错之分，请选择最符合你真实想法的选项
        </p>
      </div>
    </div>
  )
}
