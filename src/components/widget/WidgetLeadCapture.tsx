'use client'

import type { FormEvent } from 'react'
import type { LeadCapture, LeadField } from '@/types'
import { WidgetFieldInput } from './WidgetFieldInput'

interface WidgetLeadCaptureProps {
  lc: LeadCapture
  fields: LeadField[]
  leadData: Record<string, string>
  errors: Record<string, boolean>
  submitting: boolean
  accent: string
  textColor: string
  mutedColor: string
  borderColor: string
  inputBg?: string
  onSubmit: (e: FormEvent) => void
  onFieldChange: (id: string, value: string) => void
  onErrorClear: (id: string) => void
}

export function WidgetLeadCapture({
  lc,
  fields,
  leadData,
  errors,
  submitting,
  accent,
  textColor,
  mutedColor,
  borderColor,
  inputBg = '#fafafa',
  onSubmit,
  onFieldChange,
  onErrorClear,
}: WidgetLeadCaptureProps) {
  return (
    <form onSubmit={onSubmit}>
      {fields.map(field => (
        <WidgetFieldInput
          key={field.id}
          field={field}
          value={leadData[field.id] || ''}
          error={errors[field.id]}
          accent={accent}
          textColor={textColor}
          mutedColor={mutedColor}
          borderColor={borderColor}
          inputBg={inputBg}
          onChange={v => {
            onFieldChange(field.id, v)
            if (errors[field.id]) onErrorClear(field.id)
          }}
        />
      ))}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%',
          background: accent,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '11px',
          fontSize: 14,
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          marginTop: 8,
          opacity: submitting ? 0.7 : 1,
          transition: 'opacity .15s',
        }}
      >
        {submitting ? '傳送中...' : lc.button_text}
      </button>

      {lc.note && (
        <p style={{ fontSize: 11, color: mutedColor, marginTop: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 6, lineHeight: 1.6 }}>
          🔒 {lc.note}
        </p>
      )}
    </form>
  )
}
