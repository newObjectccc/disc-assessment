'use client'

import { cn } from '@/lib/utils'
import type { DiscQuestion, DiscColor } from '@/lib/disc-data'

interface QuestionCardProps {
  question: DiscQuestion
  selectedColor?: DiscColor
  onSelect: (color: DiscColor) => void
}

const colorStyles: Record<DiscColor, { selected: string; hover: string; dot: string; label: string }> = {
  red: {
    selected: 'bg-red-50 border-red-400 ring-2 ring-red-300',
    hover: 'hover:bg-red-50 hover:border-red-300',
    dot: 'bg-red-500',
    label: '红色',
  },
  blue: {
    selected: 'bg-blue-50 border-blue-400 ring-2 ring-blue-300',
    hover: 'hover:bg-blue-50 hover:border-blue-300',
    dot: 'bg-blue-500',
    label: '蓝色',
  },
  yellow: {
    selected: 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300',
    hover: 'hover:bg-yellow-50 hover:border-yellow-300',
    dot: 'bg-yellow-500',
    label: '黄色',
  },
  green: {
    selected: 'bg-green-50 border-green-400 ring-2 ring-green-300',
    hover: 'hover:bg-green-50 hover:border-green-300',
    dot: 'bg-green-500',
    label: '绿色',
  },
}

export function QuestionCard({ question, selectedColor, onSelect }: QuestionCardProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-800 leading-relaxed">
        {question.text}
      </h3>
      <div className="space-y-3">
        {question.options.map((option) => {
          const styles = colorStyles[option.color]
          const isSelected = selectedColor === option.color
          return (
            <button
              key={option.color}
              onClick={() => onSelect(option.color)}
              className={cn(
                'w-full text-left p-4 rounded-2xl border-2 border-slate-200 bg-white transition-all duration-200',
                'active:scale-[0.98]',
                isSelected ? styles.selected : styles.hover
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-2 transition-all',
                  isSelected ? `${styles.dot} border-transparent` : 'border-slate-300 bg-white'
                )}>
                  {isSelected && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <span className={cn(
                  'text-sm leading-relaxed',
                  isSelected ? 'text-slate-800 font-medium' : 'text-slate-600'
                )}>
                  {option.text}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
