'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DISC_COLORS } from '@/lib/disc-data'
import type { DiscColor } from '@/lib/disc-data'
import type { DiscScores } from '@/lib/disc-calculator'
import { scoresToPercentages } from '@/lib/disc-calculator'

interface ResultChartProps {
  scores: DiscScores
}

const COLOR_ORDER: DiscColor[] = ['red', 'blue', 'yellow', 'green']

export function ResultChart({ scores }: ResultChartProps) {
  const percentages = scoresToPercentages(scores)

  const data = COLOR_ORDER.map((color) => ({
    name: DISC_COLORS[color].name,
    label: DISC_COLORS[color].label,
    value: percentages[color],
    rawScore: scores[color],
    hex: DISC_COLORS[color].hex,
  })).filter((d) => d.value > 0)

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.hex} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              fontSize: '13px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 图例 */}
      <div className="grid grid-cols-2 gap-3">
        {COLOR_ORDER.map((color) => {
          const info = DISC_COLORS[color]
          const pct = percentages[color]
          return (
            <div key={color} className={`flex items-center gap-3 p-3 rounded-xl ${info.lightBgClass} border ${info.borderClass}`}>
              <div className={`w-3 h-3 rounded-full ${info.bgClass} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold ${info.textClass}`}>{info.name}</div>
                <div className="text-xs text-slate-500">{pct}%</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
