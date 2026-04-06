'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FormSchema, Question } from '@/types'
import { useFlowLeadState } from '../useFlowLeadState'
import { useIsMobile } from '../useIsMobile'
import { WidgetLeadCapture } from '../WidgetLeadCapture'
import { HookTextBanner } from '../HookTextBanner'
import { OtherOptionInput } from '../OtherOptionInput'

const slide = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
}
const spring = { type: 'spring' as const, stiffness: 480, damping: 40, mass: 0.7 }

// 現代卡片配色：紫色 + 白色 + 紅色點綴
const PURPLE = '#7c3aed'
const RED    = '#dc2626'

interface LayoutProps {
  formId: string
  schema: FormSchema
  theme: Record<string, string>
  isTest?: boolean
  onComplete?: (data: { answers: Record<string, string>; leadData: Record<string, string> }) => void
}

export default function DefaultLayout({ formId, schema, theme, isTest = false, onComplete }: LayoutProps) {
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

  const accent     = theme.accent || PURPLE
  const red        = theme.red    || RED
  const bg         = theme.bg     || '#ffffff'
  const textColor  = theme.text   || '#111827'
  const mutedColor = theme.muted  || '#6b7280'
  const borderColor = theme.border || '#e5e7eb'

  const activeQuestion = widgetState === 'idle' ? questions[0] : current
  const animKey = widgetState === 'idle' ? 'idle' : currentIndex
  const qLabel = widgetState === 'idle'
    ? schema.form_title
    : `${schema.form_title} · ${currentIndex + 1} / ${total}`

  function handlePick(opt: string) {
    if (widgetState === 'idle') pick(questions[0], opt, true)
    else pick(current, opt)
  }

  function handlePickOther(text: string) {
    const val = '其他:' + text
    if (widgetState === 'idle') pick(questions[0], val, true)
    else pick(current, val)
  }

  const card = {
    background: bg,
    borderRadius: theme.radius || '12px',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.05)',
    overflow: 'hidden' as const,
    position: 'relative' as const,
  }

  // ── THANK YOU ──
  if (widgetState === 'thank_you') {
    return (
      <div style={card}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${accent},${red})`, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="ty" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ textAlign: 'center', padding: '24px 20px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: textColor, margin: '0 0 6px' }}>感謝你的填寫！</p>
            <p style={{ fontSize: 13, color: mutedColor, margin: 0 }}>資訊已送出，我們將盡快與你聯繫。</p>
            {isTest && <p style={{ fontSize: 11, color: '#b45309', marginTop: 8 }}>此筆已標記為測試資料</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── LEAD CAPTURE ──
  if (widgetState === 'lead_capture') {
    return (
      <div style={card}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${accent},${red})`, width: '100%' }} />
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key="lead" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: isMobile ? '16px 16px' : '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}12`, border: `1px solid ${accent}30`, borderRadius: 99, padding: '3px 10px', marginBottom: 10 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill={accent}><circle cx="5" cy="5" r="5"/></svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: '.5px' }}>分析完成</span>
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: textColor, lineHeight: 1.35, margin: '0 0 4px' }}>{lc.title}</p>
              <p style={{ fontSize: 13, color: mutedColor, margin: 0 }}>{lc.description}</p>
            </div>
            <WidgetLeadCapture
              lc={lc} fields={fields} leadData={leadData} errors={errors} submitting={submitting}
              accent={accent} textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
              onSubmit={submit}
              onFieldChange={(id, v) => setLeadData(p => ({ ...p, [id]: v }))}
              onErrorClear={id => setError(id, false)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── IDLE / ANSWERING ──

  /* ── MOBILE: 上下直排 ── */
  if (isMobile) {
    return (
      <div style={card}>
        {/* 紫→紅漸層進度條 */}
        <div style={{ height: 3, background: '#e5e7eb', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: `linear-gradient(90deg,${accent},${red})`, width: `${progress}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
        </div>
        {isTest && <TestBadge />}
        <AnimatePresence mode="wait">
          <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
            style={{ padding: '12px 16px 14px' }}>
            <HookTextBanner text={schema.hook_text || ''} variant="purple" />
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 3, height: 12, background: red, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '.6px', textTransform: 'uppercase' }}>{qLabel}</span>
              {responseCount && widgetState === 'idle' && (
                <span style={{ fontSize: 10, color: mutedColor, marginLeft: 'auto' }}>· {responseCount.toLocaleString()} 人</span>
              )}
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: textColor, margin: '0 0 10px', lineHeight: 1.35 }}>
              {activeQuestion?.question_text}
            </p>
            <OptionsGrid
              question={activeQuestion!}
              tapped={tapped}
              accent={accent}
              red={red}
              textColor={textColor}
              borderColor={borderColor}
              onPick={handlePick}
              onPickOther={handlePickOther}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  /* ── DESKTOP: 左欄題目 + 右欄選項 ── */
  return (
    <div style={card}>
      {/* 紫→紅漸層進度條 */}
      <div style={{ height: 3, background: '#e5e7eb', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: `linear-gradient(90deg,${accent},${red})`, width: `${progress}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      {isTest && <TestBadge />}
      <AnimatePresence mode="wait">
        <motion.div key={animKey} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
          style={{ display: 'flex', alignItems: 'stretch' }}>

          {/* 左欄 40%：hook + label + 題目 */}
          <div style={{ width: '40%', padding: '14px 18px', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <HookTextBanner text={schema.hook_text || ''} variant="purple" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 3, height: 12, background: red, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '.6px', textTransform: 'uppercase' }}>{qLabel}</span>
              {responseCount && widgetState === 'idle' && (
                <span style={{ fontSize: 10, color: mutedColor, marginLeft: 4 }}>· {responseCount.toLocaleString()} 人</span>
              )}
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: textColor, margin: 0, lineHeight: 1.4 }}>
              {activeQuestion?.question_text}
            </p>
          </div>

          {/* 右欄 60%：選項 */}
          <div style={{ width: '60%', padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
            <OptionsGrid
              question={activeQuestion!}
              tapped={tapped}
              accent={accent}
              red={red}
              textColor={textColor}
              borderColor={borderColor}
              onPick={handlePick}
              onPickOther={handlePickOther}
              desktop
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ── Options Grid ── */
function OptionsGrid({ question, tapped, accent, red, textColor, borderColor, onPick, onPickOther, desktop }: {
  question: Question
  tapped: string | null
  accent: string
  red: string
  textColor: string
  borderColor: string
  onPick: (opt: string) => void
  onPickOther: (text: string) => void
  desktop?: boolean
}) {
  if (!question) return null
  const count = question.options.length
  const avgLen = question.options.reduce((s, o) => s + o.length, 0) / count
  const cols = desktop
    ? (count <= 2 ? 1 : 2)
    : (avgLen <= 10 && count >= 3 ? Math.min(count, 3) : 1)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6, width: '100%' }}>
      {question.options.map(opt => {
        if (opt === '__other__') {
          return (
            <OtherOptionInput
              key="__other__"
              onConfirm={onPickOther}
              accent={accent}
              textColor={textColor}
              borderColor={borderColor}
              buttonStyle={{ background: '#f9fafb', border: `1.5px solid ${borderColor}`, borderRadius: 8, padding: desktop ? '10px 12px' : '8px 12px', fontSize: 12, fontWeight: 600, color: textColor, cursor: 'pointer', textAlign: 'left' as const, transition: 'all .12s', lineHeight: 1.35 }}
            />
          )
        }
        const isSelected = tapped === opt
        return (
          <motion.button
            key={opt}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPick(opt)}
            style={{
              background: isSelected ? accent : '#f9fafb',
              border: `1.5px solid ${isSelected ? accent : borderColor}`,
              borderRadius: 8,
              padding: desktop ? '10px 12px' : (cols > 1 ? '8px 6px' : '8px 12px'),
              fontSize: 12,
              fontWeight: 600,
              color: isSelected ? '#fff' : textColor,
              cursor: 'pointer',
              textAlign: cols > 1 ? 'center' : 'left',
              transition: 'all .12s',
              lineHeight: 1.35,
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = red
                el.style.background = `${red}08`
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = borderColor
                el.style.background = '#f9fafb'
              }
            }}
          >
            {opt}
          </motion.button>
        )
      })}
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
