'use client'

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { FormSchema, Question, LeadField, LeadCapture } from '@/types'

export type WidgetState = 'idle' | 'answering' | 'lead_capture' | 'thank_you'

interface UseFlowLeadStateOptions {
  formId: string
  schema: FormSchema
  isTest?: boolean
  onComplete?: (data: { answers: Record<string, string>; leadData: Record<string, string> }) => void
}

export function useFlowLeadState({ formId, schema, isTest = false, onComplete }: UseFlowLeadStateOptions) {
  const [widgetState, setWidgetState] = useState<WidgetState>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [leadData, setLeadData] = useState<Record<string, string>>({})
  const [tapped, setTapped] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [responseCount, setResponseCount] = useState<number | null>(null)

  const questions = schema.questions
  const total = questions.length
  const lc: LeadCapture = schema.lead_capture
  const fields: LeadField[] = lc.fields?.length
    ? lc.fields
    : [{ id: 'email', label: 'Email', type: 'email', placeholder: lc.input_placeholder || 'your@email.com', required: true }]

  const progress =
    widgetState === 'idle' ? 0
    : widgetState === 'lead_capture' || widgetState === 'thank_you' ? 100
    : Math.round((currentIndex / total) * 100)

  const current: Question = questions[currentIndex]

  useEffect(() => {
    fetch(`/api/responses/count?form_id=${formId}`)
      .then(r => r.json())
      .then(d => { if (d.count > 10) setResponseCount(d.count) })
      .catch(() => {})
  }, [formId])

  function pick(question: Question, option: string, isFirst = false) {
    setTapped(option)
    setTimeout(() => {
      const newAnswers = isFirst
        ? { q1: option }
        : { ...answers, [question.id]: option }
      setAnswers(newAnswers)
      setTapped(null)
      if (isFirst) {
        setCurrentIndex(1)
        setWidgetState('answering')
      } else if (currentIndex + 1 >= total) {
        setWidgetState('lead_capture')
      } else {
        setCurrentIndex(i => i + 1)
      }
    }, 200)
  }

  function validate() {
    const errs: Record<string, boolean> = {}
    fields.forEach(f => { if (f.required && !leadData[f.id]?.trim()) errs[f.id] = true })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function setError(id: string, value: boolean) {
    setErrors(p => ({ ...p, [id]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: formId,
          answers,
          lead_data: leadData,
          contact_email: leadData.email || null,
          contact_phone: leadData.phone || null,
          page_url: window.location.href,
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          completed: true,
          is_test: isTest,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error('FlowLead API error:', err)
        alert(`送出失敗：${err.error || res.status}`)
        return
      }

      setWidgetState('thank_you')
      onComplete?.({ answers, leadData })
    } catch {
      alert('網路錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    widgetState,
    currentIndex,
    current,
    questions,
    total,
    lc,
    fields,
    answers,
    leadData,
    tapped,
    submitting,
    errors,
    responseCount,
    progress,
    pick,
    submit,
    setLeadData,
    setError,
  }
}
