'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { QuestionCard } from '@/components/disc/question-card'
import { DISC_QUESTIONS } from '@/lib/disc-data'
import type { DiscColor } from '@/lib/disc-data'
import { toast } from 'sonner'

interface UserInfo {
  name: string
  phone?: string
  company?: string
  department?: string
  age?: number
  gender?: string
}

interface DiscAnswer {
  questionIndex: number
  color: DiscColor
}

export default function TestPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, DiscColor>>({})
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const info = sessionStorage.getItem('disc_user_info')
    if (!info) {
      router.replace('/info')
      return
    }
    setUserInfo(JSON.parse(info))
  }, [router])

  const currentQuestion = DISC_QUESTIONS[currentIndex]
  const totalQuestions = DISC_QUESTIONS.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const answeredCount = Object.keys(answers).length
  const currentAnswer = answers[currentQuestion?.index]

  const handleSelect = useCallback((color: DiscColor) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.index]: color }))
  }, [currentQuestion?.index])

  const handleNext = useCallback(async () => {
    if (!currentAnswer) {
      toast.error('请先选择一个选项')
      return
    }
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      // 提交
      if (!userInfo) return
      setIsSubmitting(true)
      try {
        const answersArray: DiscAnswer[] = Object.entries(answers).map(([questionIndex, color]) => ({
          questionIndex: Number(questionIndex),
          color,
        }))
        const res = await fetch('/api/v1/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...userInfo,
            answers: answersArray,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || '提交失败')
        }
        const { id } = await res.json()
        sessionStorage.removeItem('disc_user_info')
        router.push(`/result/${id}`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '提交失败，请重试')
        setIsSubmitting(false)
      }
    }
  }, [currentAnswer, currentIndex, totalQuestions, userInfo, answers, router])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }, [currentIndex])

  if (!userInfo || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-2 -ml-2 text-slate-400 disabled:opacity-30 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{currentIndex + 1}</span>
          <span> / {totalQuestions}</span>
        </div>
        <div className="w-9" />
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <Progress value={progress} className="h-1.5 rounded-full" />
        <p className="text-xs text-slate-400 mt-2">
          已完成 {answeredCount} / {totalQuestions} 题
        </p>
      </div>

      {/* 题目 */}
      <div className="flex-1">
        <div className="mb-2">
          <span className="inline-block text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-3 py-1">
            第 {currentIndex + 1} 题
          </span>
        </div>
        <QuestionCard
          question={currentQuestion}
          selectedColor={currentAnswer}
          onSelect={handleSelect}
        />
      </div>

      {/* 下一题/提交按钮 */}
      <div className="pt-6">
        <Button
          onClick={handleNext}
          disabled={!currentAnswer || isSubmitting}
          size="lg"
          className="w-full h-14 text-base rounded-2xl bg-gradient-to-r from-slate-800 to-slate-600 hover:from-slate-700 hover:to-slate-500 shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              正在分析...
            </>
          ) : currentIndex < totalQuestions - 1 ? (
            <>
              下一题
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          ) : (
            <>
              提交并查看结果
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
