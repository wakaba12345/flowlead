'use client'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onConfirm: (text: string) => void
  accent: string
  textColor: string
  borderColor: string
  inputBg?: string
  /** Pass the base button style from the layout so it matches visually */
  buttonStyle?: React.CSSProperties
}

export function OtherOptionInput({ onConfirm, accent, textColor, borderColor, inputBg = '#fff', buttonStyle }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (expanded) inputRef.current?.focus() }, [expanded])

  if (!expanded) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setExpanded(true)}
        style={{ ...buttonStyle, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span style={{ fontSize: 12 }}>✏️</span>
        其他（自填）
      </motion.button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && text.trim()) onConfirm(text.trim()) }}
        placeholder="請輸入..."
        style={{
          border: `1.5px solid ${accent}`, borderRadius: 8,
          padding: '7px 10px', fontSize: 12, color: textColor,
          background: inputBg, outline: 'none', width: '100%', boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 5 }}>
        <button
          onClick={() => { setExpanded(false); setText('') }}
          style={{ flex: 1, padding: '5px 0', fontSize: 11, color: '#888', background: 'transparent', border: `1px solid ${borderColor}`, borderRadius: 6, cursor: 'pointer' }}
        >取消</button>
        <button
          disabled={!text.trim()}
          onClick={() => text.trim() && onConfirm(text.trim())}
          style={{ flex: 2, padding: '5px 0', fontSize: 12, fontWeight: 700, color: '#fff', background: text.trim() ? accent : '#6b7280', border: 'none', borderRadius: 6, cursor: text.trim() ? 'pointer' : 'not-allowed', transition: 'background .15s' }}
        >確認</button>
      </div>
    </div>
  )
}
