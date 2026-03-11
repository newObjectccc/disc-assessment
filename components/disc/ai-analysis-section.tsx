'use client'

import { useState } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

interface AiAnalysisSectionProps {
  assessmentId: string
  initialAnalysis?: string | null
}

export function AiAnalysisSection({ assessmentId, initialAnalysis }: AiAnalysisSectionProps) {
  const [analysis, setAnalysis] = useState(initialAnalysis || '')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateAnalysis = async () => {
    setIsGenerating(true)
    setAnalysis('')

    try {
      const res = await fetch(`/api/v1/admin/ai-analysis/${assessmentId}`, {
        method: 'POST',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }))
        throw new Error(err.error || 'AI 分析失败')
      }

      if (!res.body) throw new Error('无响应数据')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // 解析 SSE 数据格式（Vercel AI SDK data stream）
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            // 文本 chunk
            try {
              const text = JSON.parse(line.slice(2))
              fullText += text
              setAnalysis(fullText)
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      if (!fullText) throw new Error('AI 未返回内容')
      toast.success('AI 分析生成完成')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 分析失败')
      setAnalysis(initialAnalysis || '')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            AI 性格分析
          </CardTitle>
          <Button
            size="sm"
            onClick={generateAnalysis}
            disabled={isGenerating}
            variant={analysis ? 'outline' : 'default'}
            className="text-xs h-8"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                生成中...
              </>
            ) : analysis ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1.5" />
                重新生成
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1.5" />
                生成 AI 分析
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !isGenerating && (
          <div className="text-center py-12 text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">点击"生成 AI 分析"按钮，获取专业的性格分析报告</p>
          </div>
        )}
        {isGenerating && !analysis && (
          <div className="text-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p className="text-sm">AI 正在分析中，请稍候...</p>
          </div>
        )}
        {analysis && (
          <div className="prose prose-sm max-w-none text-slate-700">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold text-slate-800 mt-5 mb-2 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-slate-700 mt-4 mb-1.5">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1.5 mb-3 ml-4">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-slate-600 list-disc leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-slate-800">{children}</strong>
                ),
              }}
            >
              {analysis}
            </ReactMarkdown>
            {isGenerating && (
              <span className="inline-block w-1.5 h-4 bg-slate-400 animate-pulse ml-0.5 rounded-sm" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
