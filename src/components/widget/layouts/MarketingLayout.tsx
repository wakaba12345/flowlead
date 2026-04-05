'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FormSchema } from '@/types'
import { useFlowLeadState } from '../useFlowLeadState'
import { useIsMobile } from '../useIsMobile'
import { WidgetFieldInput } from '../WidgetFieldInput'
import { HookTextBanner } from '../HookTextBanner'

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

export default function MarketingLayout({ formId, schema, theme, isTest = false, onComplete }: LayoutProps) {
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

  const accent = theme.accent || '#F97316'
  const bg = '#FFFFFF'
  const textColor = '#111827'
  const mutedColor = '#6B7280'
  const borderColor = '#E5E7EB'
  const inputBg = '#F9FAFB'

  const activeQuestion = widgetState === 'idle' ? questions[0] : current

  function handlePick(opt: string) {
    if (widgetState === 'idle') {
      pick(questions[0], opt, true)
    } else {
      pick(current, opt)
    }
  }

  // ── THANK YOU ──
  if (widgetState === 'thank_you') {
    return (
      <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
        <div style={{ height: 4, background: accent, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="ty" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ display: 'inline-block', background: `${accent}15`, borderRadius: 99, padding: '4px 14px', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>完成！</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: textColor, margin: '0 0 8px' }}>感謝你的參與！</p>
            <p style={{ fontSize: 14, color: mutedColor, margin: 0 }}>資訊已送出，我們將盡快與你聯繫。</p>
            {isTest && <p style={{ fontSize: 11, color: '#b45309', marginTop: 12 }}>此筆已標記為測試資料</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── LEAD CAPTURE ──
  if (widgetState === 'lead_capture') {
    return (
      <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
        <div style={{ height: 4, background: accent, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="lead" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: isMobile ? '20px' : '24px 28px' }}>
            {/* Urgency header */}
            <div style={{ background: `${accent}10`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, borderLeft: `3px solid ${accent}` }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: accent, margin: 0 }}>幾乎完成！填寫資訊領取結果</p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: textColor, lineHeight: 1.3, margin: '0 0 4px' }}>{lc.title}</p>
            <p style={{ fontSize: 13, color: mutedColor, margin: '0 0 16px' }}>{lc.description}</p>

            <form onSubmit={submit}>
              {fields.map(field => (
                <WidgetFieldInput key={field.id} field={field} value={leadData[field.id] || ''} error={errors[field.id]}
                  accent={accent} textColor={textColor} mutedColor={mutedColor} borderColor={borderColor} inputBg={inputBg}
                  onChange={v => { setLeadData(p => ({ ...p, [field.id]: v })); setError(field.id, false) }}
                />
              ))}
              <button type="submit" disabled={submitting}
                style={{
                  width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 10,
                  padding: '13px', fontSize: 16, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: 8, opacity: submitting ? 0.7 : 1, transition: 'all .15s',
                  boxShadow: submitting ? 'none' : `0 4px 14px ${accent}40`,
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
  const qLabel = widgetState === 'idle' ? 1 : currentIndex + 1

  if (isMobile) {
    return (
      <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
        {/* Prominent progress bar */}
        <div style={{ height: 5, background: '#F3F4F6', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: accent, width: `${progress}%`, transition: 'width .5s', borderRadius: '0 3px 3px 0' }} />
        </div>
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: '14px 14px' }}>
            {widgetState === 'idle' && <HookTextBanner text={schema.hook_text || ''} variant="default" />}
            {/* Badge + question counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ background: `${accent}15`, borderRadius: 99, padding: '2px 8px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: accent }}>快速測驗</span>
              </div>
              <span style={{ fontSize: 11, color: mutedColor }}>Q {qLabel}/{total}</span>
              {responseCount && widgetState === 'idle' && (
                <span style={{ fontSize: 10, color: accent, marginLeft: 'auto' }}>🔥 {responseCount.toLocaleString()} 人</span>
              )}
            </div>
            <p style={{ fontSize: 15, fontWeight: 800, color: textColor, margin: '0 0 10px', lineHeight: 1.35 }}>
              {activeQuestion?.question_text}
            </p>
            {/* 2-column grid options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {activeQuestion?.options.map(opt => {
                const isSelected = tapped === opt
                return (
                  <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => handlePick(opt)}
                    style={{
                      background: isSelected ? accent : '#F9FAFB',
                      border: `2px solid ${isSelected ? accent : borderColor}`,
                      borderRadius: 8, padding: '8px 8px',
                      fontSize: 12, fontWeight: 700,
                      color: isSelected ? '#fff' : textColor,
                      cursor: 'pointer', textAlign: 'center', lineHeight: 1.3,
                      transition: 'all .12s',
                      boxShadow: isSelected ? `0 2px 8px ${accent}40` : 'none',
                    }}>
                    {opt}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
      {/* Prominent progress bar */}
      <div style={{ height: 5, background: '#F3F4F6', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: accent, width: `${progress}%`, transition: 'width .5s', borderRadius: '0 3px 3px 0' }} />
      </div>
      {isTest && <TestBadge />}

      <AnimatePresence mode="wait">
        <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
          style={{ display: 'flex', padding: '0', minHeight: 180, alignItems: 'stretch' }}>

          {/* Left 42% — badge + question */}
          <div style={{ width: '42%', padding: '16px 20px', background: '#FAFAFA', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {widgetState === 'idle' && <HookTextBanner text={schema.hook_text || ''} variant="default" />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ background: `${accent}15`, borderRadius: 99, padding: '3px 10px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>🔥 快速測驗</span>
              </div>
              {responseCount && widgetState === 'idle' && (
                <span style={{ fontSize: 11, color: accent }}>· {responseCount.toLocaleString()} 人已完成</span>
              )}
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: textColor, margin: '0 0 10px', lineHeight: 1.4 }}>
              {activeQuestion?.question_text}
            </p>
            <span style={{ fontSize: 12, color: mutedColor, fontWeight: 600 }}>
              Q {qLabel} / {total}
            </span>
          </div>

          {/* Right 58% — 2-col option cards */}
          <div style={{ width: '58%', padding: '16px 16px', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
              {activeQuestion?.options.map(opt => {
                const isSelected = tapped === opt
                return (
                  <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => handlePick(opt)}
                    style={{
                      background: isSelected ? accent : '#FFFFFF',
                      border: `2px solid ${isSelected ? accent : borderColor}`,
                      borderRadius: 10, padding: '12px 14px',
                      fontSize: 13, fontWeight: 700,
                      color: isSelected ? '#fff' : textColor,
                      cursor: 'pointer', textAlign: 'left', lineHeight: 1.35,
                      transition: 'all .12s',
                      boxShadow: isSelected ? `0 2px 8px ${accent}40` : '0 1px 3px rgba(0,0,0,.06)',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = accent
                        el.style.background = `${accent}08`
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = borderColor
                        el.style.background = '#FFFFFF'
                      }
                    }}
                  >
                    {opt}
                  </motion.button>
                )
              })}
            </div>
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
