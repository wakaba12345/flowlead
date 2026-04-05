'use client'

import type { LeadField } from '@/types'

interface Props {
  field: LeadField
  value: string
  error?: boolean
  accent: string
  textColor: string
  mutedColor: string
  borderColor: string
  inputBg?: string
  onChange: (v: string) => void
}

export function WidgetFieldInput({ field, value, error, accent, textColor, mutedColor, borderColor, inputBg = '#fafafa', onChange }: Props) {
  const inputStyle = {
    width: '100%',
    border: `1.5px solid ${error ? '#ef4444' : borderColor}`,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 14,
    color: textColor,
    background: inputBg,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: error ? 2 : 0,
    transition: 'border-color .15s',
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: mutedColor, marginBottom: 4, letterSpacing: '.3px' }}>
        {field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>

      {field.type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          <option value="">請選擇</option>
          {field.options?.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : field.type === 'radio' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {field.options?.map(o => (
            <button key={o} type="button" onClick={() => onChange(o)}
              style={{
                border: `1.5px solid ${value === o ? accent : borderColor}`,
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 600,
                background: value === o ? accent : inputBg,
                color: value === o ? '#fff' : textColor,
                cursor: 'pointer',
                transition: 'all .12s',
              }}>
              {o}
            </button>
          ))}
        </div>
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = accent }}
          onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : borderColor }}
        />
      )}
      {error && <p style={{ fontSize: 11, color: '#ef4444', margin: '3px 0 0' }}>此欄位為必填</p>}
    </div>
  )
}
