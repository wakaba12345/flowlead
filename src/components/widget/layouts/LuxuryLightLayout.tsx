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

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

interface LayoutProps {
  formId: string
  schema: FormSchema
  theme: Record<string, string>
  isTest?: boolean
  onComplete?: (data: { answers: Record<string, string>; leadData: Record<string, string> }) => void
}

export default function LuxuryLightLayout({ formId, schema, theme, isTest = false, onComplete }: LayoutProps) {
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

  const accent = theme.accent || '#C5A55A'
  const bg = '#F8F4ED'
  const textColor = '#1A1208'
  const mutedColor = '#8B7355'
  const borderColor = '#E8DFD0'
  const inputBg = '#FFFFFF'

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

  const questionLabel = widgetState === 'idle'
    ? schema.form_title
    : `${schema.form_title} · ${currentIndex + 1} / ${total}`

  // ── THANK YOU ──
  if (widgetState === 'thank_you') {
    return (
      <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="ty" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accent}20`, border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: textColor, margin: '0 0 8px' }}>感謝你的填寫！</p>
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
        <div style={{ height: 3, background: `linear-gradient(90deg,${accent},${accent}88)`, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="lead" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: isMobile ? '24px 20px' : '28px 32px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 99, padding: '3px 12px', marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '1px', textTransform: 'uppercase' }}>分析完成</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: textColor, lineHeight: 1.3, margin: '0 0 6px' }}>{lc.title}</p>
              <p style={{ fontSize: 13, color: mutedColor, margin: 0 }}>{lc.description}</p>
            </div>
            <form onSubmit={submit}>
              <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: fields.length > 2 ? '1fr 1fr' : '1fr', gap: '0 16px' }}>
                {fields.map(field => (
                  <WidgetFieldInput key={field.id} field={field} value={leadData[field.id] || ''} error={errors[field.id]}
                    accent={accent} textColor={textColor} mutedColor={mutedColor} borderColor={borderColor} inputBg={inputBg}
                    onChange={v => { setLeadData(p => ({ ...p, [field.id]: v })); setError(field.id, false) }}
                  />
                ))}
              </div>
              <button type="submit" disabled={submitting}
                style={{
                  width: '100%', background: accent, color: '#1A1208', border: 'none', borderRadius: 8,
                  padding: '12px', fontSize: 14, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: 8, opacity: submitting ? 0.7 : 1, transition: 'opacity .15s', letterSpacing: '.5px',
                }}>
                {submitting ? '傳送中...' : lc.button_text}
              </button>
              {lc.note && (
                <p style={{ fontSize: 11, color: mutedColor, marginTop: 10, padding: '8px 12px', background: '#EDE7DC', borderRadius: 6, lineHeight: 1.6 }}>
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
        <div style={{ height: 3, background: borderColor, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: `linear-gradient(90deg,${accent},${accent}99)`, width: `${progress}%`, transition: 'width .5s' }} />
        </div>
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: '14px 16px' }}>
            <HookTextBanner text={schema.hook_text || ''} variant="light" />
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: mutedColor, letterSpacing: '.8px', textTransform: 'uppercase' }}>{questionLabel}</span>
              {responseCount && widgetState === 'idle' && (
                <span style={{ fontSize: 10, color: accent, marginLeft: 8 }}>· {responseCount.toLocaleString()} 人已完成</span>
              )}
              <p style={{ fontSize: 15, fontWeight: 700, color: textColor, margin: '6px 0 0', lineHeight: 1.35 }}>
                {activeQuestion?.question_text}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {activeQuestion?.options.map((opt, i) => {
                if (opt === '__other__') return <OtherOptionInput key="__other__" onConfirm={handlePickOther} accent={accent} textColor={textColor} borderColor={borderColor} inputBg={inputBg} />
                const isSelected = tapped === opt
                return (
                  <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => handlePick(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: isSelected ? `${accent}15` : '#FFFFFF',
                      border: `1.5px solid ${isSelected ? accent : borderColor}`,
                      borderRadius: 10, padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all .12s',
                    }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? accent : 'transparent',
                      border: `1.5px solid ${isSelected ? accent : '#C8B89A'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: isSelected ? '#F8F4ED' : mutedColor,
                    }}>
                      {LETTERS[i] || String(i + 1)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: textColor, lineHeight: 1.3 }}>{opt}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // Desktop horizontal layout
  return (
    <div style={{ background: bg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: 3, background: borderColor, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: `linear-gradient(90deg,${accent},${accent}99)`, width: `${progress}%`, transition: 'width .5s' }} />
      </div>
      {isTest && <TestBadge />}

      <AnimatePresence mode="wait">
        <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
          style={{ display: 'flex', padding: '12px 0', minHeight: 160, alignItems: 'stretch' }}>

          {/* Left 38% */}
          <div style={{ width: '38%', padding: '0 16px', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <HookTextBanner text={schema.hook_text || ''} variant="light" />
            <span style={{ fontSize: 10, fontWeight: 700, color: mutedColor, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
              {questionLabel}
            </span>
            {responseCount && widgetState === 'idle' && (
              <span style={{ fontSize: 11, color: accent, marginBottom: 8 }}>· {responseCount.toLocaleString()} 人已完成</span>
            )}
            <p style={{ fontSize: 17, fontWeight: 700, color: textColor, lineHeight: 1.45, margin: 0 }}>
              {activeQuestion?.question_text}
            </p>
          </div>

          {/* Center 47% — lettered circles */}
          <div style={{ width: '47%', padding: '0 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: (activeQuestion?.options.length ?? 0) <= 3 ? `repeat(${activeQuestion?.options.length ?? 2}, 1fr)` : 'repeat(4, 1fr)', gap: '8px 10px' }}>
              {activeQuestion?.options.map((opt, i) => {
                if (opt === '__other__') return <OtherOptionInput key="__other__" onConfirm={handlePickOther} accent={accent} textColor={textColor} borderColor={borderColor} inputBg={inputBg} />
                const isSelected = tapped === opt
                return (
                  <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => handlePick(opt)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isSelected ? accent : 'transparent',
                      border: `1.5px solid ${isSelected ? accent : '#C8B89A'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: isSelected ? '#F8F4ED' : mutedColor,
                      transition: 'all .12s',
                    }}>
                      {LETTERS[i] || String(i + 1)}
                    </div>
                    <span style={{ fontSize: 10, color: isSelected ? accent : mutedColor, lineHeight: 1.25, textAlign: 'center', maxWidth: 72, transition: 'color .12s' }}>
                      {opt}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Right 15% — decorative */}
          <div style={{ width: '15%', padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 1, height: 48, background: `linear-gradient(${accent},transparent)` }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
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
