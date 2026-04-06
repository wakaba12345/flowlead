'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FormSchema } from '@/types'
import { useFlowLeadState } from '../useFlowLeadState'
import { useIsMobile } from '../useIsMobile'
import { WidgetFieldInput } from '../WidgetFieldInput'
import { HookTextBanner } from '../HookTextBanner'
import { OtherOptionInput } from '../OtherOptionInput'

const slide = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
}
const spring = { type: 'spring' as const, stiffness: 480, damping: 40, mass: 0.7 }

interface LayoutProps {
  formId: string
  schema: FormSchema
  theme: Record<string, string>
  isTest?: boolean
  onComplete?: (data: { answers: Record<string, string>; leadData: Record<string, string> }) => void
}

export default function MinimalLayout({ formId, schema, theme, isTest = false, onComplete }: LayoutProps) {
  const state = useFlowLeadState({ formId, schema, isTest, onComplete })
  const isMobile = useIsMobile()

  const {
    widgetState,
    currentIndex,
    current,
    questions,
    total,
    lc,
    fields,
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
  } = state

  const accent = theme.accent || '#6366F1'
  const bg = theme.bg || '#FFFFFF'
  const textColor = '#111827'
  const mutedColor = '#9CA3AF'
  const borderColor = '#E5E7EB'
  const inputBg = '#FAFAFA'
  const accentLight = `${accent}0F`

  const activeQuestion = widgetState === 'idle' ? questions[0] : current

  function handlePick(opt: string) {
    if (widgetState === 'idle') {
      pick(questions[0], opt, true)
    } else {
      pick(current, opt)
    }
  }

  function handlePickOther(text: string) {
    const val = '其他:' + text
    if (widgetState === 'idle') pick(questions[0], val, true)
    else pick(current, val)
  }

  const stepNum = widgetState === 'idle' ? 1 : currentIndex + 1
  const qLabel = `${schema.form_title} · 步驟 ${stepNum} / ${total}`

  // ── THANK YOU ──
  if (widgetState === 'thank_you') {
    return (
      <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: 2, background: accent, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="ty" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ textAlign: 'center', padding: '44px 24px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: textColor, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>感謝你的填寫</p>
            <p style={{ fontSize: 13, color: mutedColor, margin: 0 }}>資訊已送出，我們將盡快與你聯繫。</p>
            {isTest && <p style={{ fontSize: 11, color: '#b45309', marginTop: 12 }}>此筆已標記為測試資料</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── LEAD CAPTURE ──
  if (widgetState === 'lead_capture') {
    return (
      <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: 2, background: accent, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="lead" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: isMobile ? '24px 20px' : '28px 32px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6, margin: '0 0 6px' }}>
              最後一步
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: textColor, lineHeight: 1.3, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>{lc.title}</p>
            <p style={{ fontSize: 13, color: mutedColor, margin: '0 0 20px' }}>{lc.description}</p>
            <form onSubmit={submit}>
              {fields.map(field => (
                <WidgetFieldInput key={field.id} field={field} value={leadData[field.id] || ''} error={errors[field.id]}
                  accent={accent} textColor={textColor} mutedColor={mutedColor} borderColor={borderColor} inputBg={inputBg}
                  onChange={v => { setLeadData(p => ({ ...p, [field.id]: v })); setError(field.id, false) }}
                />
              ))}
              <button type="submit" disabled={submitting}
                style={{
                  width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 8,
                  padding: '11px', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: 8, opacity: submitting ? 0.7 : 1, transition: 'opacity .15s',
                }}>
                {submitting ? '傳送中...' : lc.button_text}
              </button>
              {lc.note && (
                <p style={{ fontSize: 11, color: mutedColor, marginTop: 10, padding: '8px 12px', background: '#F9FAFB', borderRadius: 6, lineHeight: 1.6 }}>
                  🔒 {lc.note}
                </p>
              )}
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── IDLE / ANSWERING ──
  const animKey = widgetState === 'idle' ? 'idle' : currentIndex

  if (isMobile) {
    return (
      <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: 2, background: '#E5E7EB', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: accent, width: `${progress}%`, transition: 'width .5s' }} />
        </div>
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: '14px 16px' }}>
            <HookTextBanner text={schema.hook_text || ''} variant="indigo" />
            <p style={{ fontSize: 10, fontWeight: 600, color: accent, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 3 }}>
              {qLabel}
            </p>
            {responseCount && widgetState === 'idle' && (
              <p style={{ fontSize: 10, color: mutedColor, margin: '0 0 6px' }}>· {responseCount.toLocaleString()} 人已完成</p>
            )}
            <p style={{ fontSize: 15, fontWeight: 700, color: textColor, margin: '0 0 12px', lineHeight: 1.35, fontFamily: 'Georgia, serif' }}>
              {activeQuestion?.question_text}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {activeQuestion?.options.map(opt => {
                if (opt === '__other__') return <OtherOptionInput key="__other__" onConfirm={handlePickOther} accent={accent} textColor={textColor} borderColor={borderColor} />
                const isSelected = tapped === opt
                return (
                  <motion.button key={opt} whileTap={{ scale: 0.98 }} onClick={() => handlePick(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: isSelected ? accentLight : 'transparent',
                      border: `1.5px solid ${isSelected ? accent : borderColor}`,
                      borderRadius: 7, padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all .12s',
                    }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? accent : 'transparent',
                      border: `1.5px solid ${isSelected ? accent : '#D1D5DB'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ fontSize: 12, color: isSelected ? textColor : '#374151', lineHeight: 1.3, fontWeight: isSelected ? 600 : 400 }}>{opt}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // Desktop layout: horizontal 2-column
  return (
    <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
      {/* Thin accent line at very top */}
      <div style={{ height: 2, background: '#E5E7EB', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: accent, width: `${progress}%`, transition: 'width .5s' }} />
      </div>
      {isTest && <TestBadge />}

      <AnimatePresence mode="wait">
        <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
          style={{ display: 'flex', minHeight: 180, alignItems: 'stretch' }}>

          {/* Left 45% */}
          <div style={{ width: '45%', padding: '16px 20px', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <HookTextBanner text={schema.hook_text || ''} variant="indigo" />
            <p style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: '.8px', textTransform: 'uppercase', margin: '0 0 8px' }}>
              {qLabel}
            </p>
            {responseCount && widgetState === 'idle' && (
              <p style={{ fontSize: 11, color: mutedColor, margin: '0 0 10px' }}>· {responseCount.toLocaleString()} 人已完成</p>
            )}
            <p style={{ fontSize: 18, fontWeight: 700, color: textColor, margin: 0, lineHeight: 1.5, fontFamily: 'Georgia, serif' }}>
              {activeQuestion?.question_text}
            </p>
          </div>

          {/* Right 55% — clean list options */}
          <div style={{ width: '55%', padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
            {activeQuestion?.options.map(opt => {
              if (opt === '__other__') return <OtherOptionInput key="__other__" onConfirm={handlePickOther} accent={accent} textColor={textColor} borderColor={borderColor} />
              const isSelected = tapped === opt
              return (
                <motion.button key={opt} whileTap={{ scale: 0.98 }} onClick={() => handlePick(opt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: isSelected ? accentLight : 'transparent',
                    border: `1.5px solid ${isSelected ? accent : 'transparent'}`,
                    borderRadius: 8, padding: '9px 12px', cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all .12s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = accentLight
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: isSelected ? accent : 'transparent',
                    border: `1.5px solid ${isSelected ? accent : '#D1D5DB'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .12s',
                  }}>
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontSize: 13, color: isSelected ? textColor : '#374151', lineHeight: 1.4, fontWeight: isSelected ? 600 : 400, transition: 'all .12s' }}>{opt}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function TestBadge() {
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 600, background: '#fff3cd', color: '#b45309', borderRadius: 99, padding: '2px 8px', letterSpacing: '.5px', zIndex: 10 }}>
      TEST
    </div>
  )
}
