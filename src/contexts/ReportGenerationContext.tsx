'use client'

import { createContext, useContext, useState, useRef, useCallback } from 'react'
import type { Response, Form } from '@/types'
import { buildStats, injectShareBar } from '@/lib/reportStats'

export type GenStatus = 'idle' | 'generating' | 'done' | 'error'

interface ReportGenerationState {
  status: GenStatus
  formTitle: string
  resultUrl: string | null
  errorMsg: string | null
  startGeneration: (form: Form, responses: Response[], onShareReady?: (url: string) => void) => void
  dismiss: () => void
}

const Ctx = createContext<ReportGenerationState | null>(null)

export function useReportGeneration() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useReportGeneration must be used within ReportGenerationProvider')
  return c
}

export function ReportGenerationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<GenStatus>('idle')
  const [formTitle, setFormTitle] = useState('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const generatingRef = useRef(false)

  const startGeneration = useCallback(async (
    form: Form,
    responses: Response[],
    onShareReady?: (url: string) => void,
  ) => {
    if (generatingRef.current) return
    generatingRef.current = true

    setStatus('generating')
    setFormTitle(form.title)
    setResultUrl(null)
    setErrorMsg(null)


    try {
      const stats = buildStats(responses, form)

      const res = await fetch('/api/ai-generate/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_title: form.title,
          conversion_goal: '',
          ...stats,
          openEndedStats: stats.openEndedStats.map(q => ({ ...q, answers: q.answers.slice(0, 30) })),
        }),
      })
      const { html, error } = await res.json()
      if (error || !html || html.trim().length < 50) throw new Error(error || 'AI 回傳內容異常')

      let finalHtml = html

      // Save to DB for share URL
      try {
        const shareRes = await fetch('/api/reports/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, form_title: form.title, form_id: form.id }),
        })
        const { id } = await shareRes.json()
        if (id) {
          const url = `${window.location.origin}/r/${id}`
          setResultUrl(url)
          onShareReady?.(url)
          finalHtml = injectShareBar(html, url)
        }
      } catch { /* share save failed, continue without bar */ }

      // Open report in new tab
      const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl; a.target = '_blank'; a.rel = 'noopener'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000)

      setStatus('done')

    } catch (e) {
      setErrorMsg(`生成失敗：${e}`)
      setStatus('error')
    } finally {
      generatingRef.current = false
    }
  }, [])

  return (
    <Ctx.Provider value={{ status, formTitle, resultUrl, errorMsg, startGeneration, dismiss: () => setStatus('idle') }}>
      {children}
    </Ctx.Provider>
  )
}
