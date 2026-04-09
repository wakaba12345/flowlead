'use client'

import { FileText, Loader2 } from 'lucide-react'
import type { Response, Form } from '@/types'
import { useReportGeneration } from '@/contexts/ReportGenerationContext'

interface Props {
  responses: Response[]
  form: Form
  onShareReady?: (url: string) => void
}

export default function ReportButton({ responses, form, onShareReady }: Props) {
  const { status, startGeneration } = useReportGeneration()
  const isGenerating = status === 'generating'

  return (
    <button
      onClick={() => startGeneration(form, responses, onShareReady)}
      disabled={isGenerating || responses.length === 0}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40"
    >
      {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
      {isGenerating ? 'AI 分析中...' : '生成 AI 報告'}
    </button>
  )
}
