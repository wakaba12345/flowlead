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

export default function StormLayout({ formId, schema, theme, isTest = false, onComplete }: LayoutProps) {
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

  const accent = theme.accent || '#CC0000'
  const bg = '#FFFFFF'
  const headerBg = '#1C1C1C'
  const textColor = '#1A1A1A'
  const mutedColor = '#666666'
  const borderColor = '#E0E0E0'
  const inputBg = '#F5F5F5'

  const activeQuestion = widgetState === 'idle' ? questions[0] : current

  function handlePick(opt: string) {
    if (widgetState === 'idle') {
      pick(questions[0], opt, true)
    } else {
      pick(current, opt)
    }
  }

  const questionLabel = widgetState === 'idle'
    ? schema.form_title
    : `${currentIndex + 1} / ${total}`

  // ── THANK YOU ──
  if (widgetState === 'thank_you') {
    return (
      <div style={{ background: bg, borderRadius: 4, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: 4, background: accent, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="ty" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: textColor, margin: '0 0 8px', fontFamily: 'sans-serif' }}>感謝你的填寫！</p>
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
      <div style={{ background: bg, borderRadius: 4, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: 4, background: accent, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="lead" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: isMobile ? '20px' : '24px 28px' }}>
            {/* Header bar */}
            <div style={{ background: headerBg, margin: isMobile ? '-20px -20px 16px' : '-24px -28px 20px', padding: isMobile ? '12px 20px' : '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 16, background: accent, borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: '1px', textTransform: 'uppercase' }}>分析完成</span>
            </div>
            <p style={{ fontSize: 19, fontWeight: 800, color: textColor, lineHeight: 1.3, margin: '0 0 4px' }}>{lc.title}</p>
            <p style={{ fontSize: 13, color: mutedColor, margin: '0 0 18px', borderBottom: `1px solid ${borderColor}`, paddingBottom: 14 }}>{lc.description}</p>

            <form onSubmit={submit}>
              {fields.map(field => (
                <WidgetFieldInput key={field.id} field={field} value={leadData[field.id] || ''} error={errors[field.id]}
                  accent={accent} textColor={textColor} mutedColor={mutedColor} borderColor={borderColor} inputBg={inputBg}
                  onChange={v => { setLeadData(p => ({ ...p, [field.id]: v })); setError(field.id, false) }}
                />
              ))}
              <button type="submit" disabled={submitting}
                style={{
                  width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 2,
                  padding: '12px', fontSize: 14, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: 8, opacity: submitting ? 0.7 : 1, transition: 'opacity .15s', letterSpacing: '.5px',
                  textTransform: 'uppercase',
                }}>
                {submitting ? '傳送中...' : lc.button_text}
              </button>
              {lc.note && (
                <p style={{ fontSize: 11, color: mutedColor, marginTop: 10, padding: '8px 12px', background: '#F5F5F5', borderRadius: 2, lineHeight: 1.6 }}>
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
      <div style={{ background: bg, borderRadius: 4, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
        {/* Red progress bar */}
        <div style={{ height: 4, background: '#E0E0E0', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: accent, width: `${progress}%`, transition: 'width .5s' }} />
        </div>
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}>
            {/* Dark header bar */}
            <div style={{ background: headerBg, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 3, height: 14, background: accent, borderRadius: 1 }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', letterSpacing: '.5px', textTransform: 'uppercase' }}>
                  {widgetState === 'idle' ? schema.form_title : questionLabel}
                </span>
              </div>
              {responseCount && widgetState === 'idle' && (
                <span style={{ fontSize: 10, color: '#999' }}>{responseCount.toLocaleString()} 人完成</span>
              )}
            </div>

            <div style={{ padding: '12px 14px' }}>
              {widgetState === 'idle' && <HookTextBanner text={schema.hook_text || ''} variant="default" />}
              <p style={{ fontSize: 15, fontWeight: 800, color: textColor, margin: '0 0 10px', lineHeight: 1.35 }}>
                {activeQuestion?.question_text}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {activeQuestion?.options.map(opt => {
                  const isSelected = tapped === opt
                  return (
                    <motion.button key={opt} whileTap={{ scale: 0.98 }} onClick={() => handlePick(opt)}
                      style={{
                        background: isSelected ? `${accent}08` : bg,
                        border: `1px solid ${isSelected ? accent : borderColor}`,
                        borderLeft: `3px solid ${isSelected ? accent : '#D0D0D0'}`,
                        borderRadius: 2, padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                        transition: 'all .12s',
                      }}>
                      <span style={{ fontSize: 12, fontWeight: isSelected ? 700 : 400, color: isSelected ? accent : textColor, lineHeight: 1.3 }}>{opt}</span>
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

  // Desktop layout: dark header bar + question left + options right
  return (
    <div style={{ background: bg, borderRadius: 4, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
      {/* Red progress bar */}
      <div style={{ height: 4, background: '#E0E0E0', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: accent, width: `${progress}%`, transition: 'width .5s' }} />
      </div>
      {isTest && <TestBadge />}

      <AnimatePresence mode="wait">
        <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}>

          {/* Header bar */}
          <div style={{ background: headerBg, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 16, background: accent, borderRadius: 1 }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {widgetState === 'idle' ? schema.form_title : questionLabel}
              </span>
            </div>
            {responseCount && widgetState === 'idle' && (
              <span style={{ fontSize: 11, color: '#888' }}>{responseCount.toLocaleString()} 人已完成</span>
            )}
          </div>

          {/* Body: left question | right options */}
          <div style={{ display: 'flex', minHeight: 180, alignItems: 'stretch' }}>
            {/* Left 40% */}
            <div style={{ width: '40%', padding: '20px 24px', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {widgetState === 'idle' && <HookTextBanner text={schema.hook_text || ''} variant="default" />}
              <p style={{ fontSize: 18, fontWeight: 800, color: textColor, margin: 0, lineHeight: 1.5 }}>
                {activeQuestion?.question_text}
              </p>
            </div>

            {/* Right 60% */}
            <div style={{ width: '60%', padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 7 }}>
              {activeQuestion?.options.map(opt => {
                const isSelected = tapped === opt
                return (
                  <motion.button key={opt} whileTap={{ scale: 0.98 }} onClick={() => handlePick(opt)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: isSelected ? `${accent}08` : bg,
                      border: `1px solid ${isSelected ? accent : borderColor}`,
                      borderLeft: `4px solid ${isSelected ? accent : '#D0D0D0'}`,
                      borderRadius: 2, padding: '9px 14px', cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'all .12s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderLeftColor = accent
                        el.style.background = `${accent}05`
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderLeftColor = '#D0D0D0'
                        el.style.background = bg
                      }
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 400, color: isSelected ? accent : textColor, lineHeight: 1.4, transition: 'color .12s' }}>{opt}</span>
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
