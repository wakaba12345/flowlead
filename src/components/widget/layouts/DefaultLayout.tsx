'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FormSchema, Question } from '@/types'
import { useFlowLeadState } from '../useFlowLeadState'
import { useIsMobile } from '../useIsMobile'
import { WidgetLeadCapture } from '../WidgetLeadCapture'
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

export default function DefaultLayout({ formId, schema, theme, isTest = false, onComplete }: LayoutProps) {
  const state = useFlowLeadState({ formId, schema, isTest, onComplete })
  useIsMobile() // used for future responsive expansions

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

  const accent = theme.accent || '#7c3aed'
  const bg = theme.bg || '#ffffff'
  const textColor = theme.text || '#111827'
  const mutedColor = theme.muted || '#6b7280'
  const borderColor = theme.border || '#e5e7eb'

  return (
    <div
      className="fl-widget relative overflow-hidden"
      style={{
        background: bg,
        borderRadius: theme.radius || '12px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.05)',
      }}
    >
      {/* Top accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${accent},${accent}88)`, width: `${progress}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />

      {/* Test badge */}
      {isTest && (
        <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 600, background: '#fff3cd', color: '#b45309', borderRadius: 99, padding: '2px 8px', letterSpacing: '.5px' }}>
          TEST
        </div>
      )}

      <div style={{ padding: '14px 20px 16px' }}>

        {/* ── IDLE ── */}
        {widgetState === 'idle' && (
          <div>
            <HookTextBanner text={schema.hook_text || ''} variant="default" />
            <QuestionBlock
              question={questions[0]}
              tapped={tapped}
              accent={accent}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
              label={schema.form_title}
              responseCount={responseCount}
              onPick={opt => pick(questions[0], opt, true)}
            />
          </div>
        )}

        {/* ── ANSWERING ── */}
        {widgetState === 'answering' && current && (
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} variants={slide} initial="enter" animate="center" exit="exit" transition={spring}>
              <QuestionBlock
                question={current}
                tapped={tapped}
                accent={accent}
                textColor={textColor}
                mutedColor={mutedColor}
                borderColor={borderColor}
                label={`${currentIndex + 1} / ${total}`}
                onPick={opt => pick(current, opt)}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── LEAD CAPTURE ── */}
        {widgetState === 'lead_capture' && (
          <AnimatePresence mode="wait">
            <motion.div key="lead" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}>
              {/* Result teaser */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}12`, border: `1px solid ${accent}30`, borderRadius: 99, padding: '3px 10px', marginBottom: 10 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill={accent}><circle cx="5" cy="5" r="5"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: '.5px' }}>分析完成</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: textColor, lineHeight: 1.35, margin: '0 0 4px' }}>{lc.title}</p>
                <p style={{ fontSize: 13, color: mutedColor, margin: 0 }}>{lc.description}</p>
              </div>

              <WidgetLeadCapture
                lc={lc}
                fields={fields}
                leadData={leadData}
                errors={errors}
                submitting={submitting}
                accent={accent}
                textColor={textColor}
                mutedColor={mutedColor}
                borderColor={borderColor}
                onSubmit={submit}
                onFieldChange={(id, v) => setLeadData(p => ({ ...p, [id]: v }))}
                onErrorClear={id => setError(id, false)}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── THANK YOU ── */}
        {widgetState === 'thank_you' && (
          <AnimatePresence mode="wait">
            <motion.div key="ty" variants={slide} initial="enter" animate="center" exit="exit" transition={spring}
              style={{ textAlign: 'center', padding: '20px 0 8px' }}>
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
        )}
      </div>
    </div>
  )
}

/* ── Question Block ── */
function QuestionBlock({ question, tapped, accent, textColor, mutedColor, borderColor, label, responseCount, onPick }: {
  question: Question
  tapped: string | null
  accent: string
  textColor: string
  mutedColor: string
  borderColor: string
  label: string
  responseCount?: number | null
  onPick: (opt: string) => void
}) {
  const optionCount = question.options.length
  const avgLen = question.options.reduce((s, o) => s + o.length, 0) / optionCount
  const useGrid = avgLen <= 10 && optionCount >= 3

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: mutedColor, letterSpacing: '.8px', textTransform: 'uppercase' }}>{label}</span>
        {responseCount && (
          <span style={{ fontSize: 11, color: mutedColor, marginLeft: 10 }}>
            · {responseCount.toLocaleString()} 人已完成
          </span>
        )}
        <p style={{ fontSize: 16, fontWeight: 700, color: textColor, margin: '5px 0 0', lineHeight: 1.35 }}>
          {question.question_text}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: useGrid ? `repeat(${Math.min(optionCount, 3)}, 1fr)` : '1fr',
        gap: 6,
      }}>
        {question.options.map(opt => {
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
                padding: useGrid ? '8px 6px' : '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: isSelected ? '#fff' : textColor,
                cursor: 'pointer',
                textAlign: useGrid ? 'center' : 'left',
                transition: 'all .12s',
                lineHeight: 1.35,
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  (e.target as HTMLElement).style.borderColor = accent
                  ;(e.target as HTMLElement).style.background = `${accent}08`
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  (e.target as HTMLElement).style.borderColor = borderColor
                  ;(e.target as HTMLElement).style.background = '#f9fafb'
                }
              }}
            >
              {opt}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
