'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, X } from 'lucide-react'
import type { Form, FormSchema, LeadField, Question } from '@/types'
import { PRESET_LEAD_FIELDS } from '@/types'

const CONVERSION_GOALS = ['索取報告', '領試用包', '預約賞屋', '名單訂閱', '抽獎名單', '自訂...']
const INDUSTRY_SUGGESTIONS = ['高股息 ETF', '兒童益生菌', '預售屋', '保健品', '科技產品', '壽險/保險', '健身/運動', '美妝/保養']

const LAYOUTS = [
  { value: 'default', label: '現代卡片', desc: '白底 · 紫色' },
  { value: 'luxury-dark', label: '極簡豪華深色', desc: '深藍 · 金色' },
  { value: 'luxury-light', label: '極簡豪華淺色', desc: '奶油 · 金色' },
  { value: 'marketing', label: '行銷強效', desc: '白底 · 橘色' },
  { value: 'minimal', label: '極簡專業', desc: '白底 · 靛藍' },
  { value: 'storm', label: '新聞媒體', desc: '白底 · 深灰紅' },
]

interface Props {
  initialForm?: Form
}

export default function FormEditor({ initialForm }: Props) {
  const router = useRouter()
  const isEdit = !!initialForm

  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'ai' | 'manual'>(initialForm ? 'ai' : 'ai')
  const [questionCount, setQuestionCount] = useState(initialForm?.schema?.questions?.length || 3)

  const [aiInput, setAiInput] = useState({
    client_name: initialForm?.title || '',
    industry: '',
    product_features: '',
    conversion_goal: '名單訂閱',
    conversion_goal_custom: '',
    free_text: '',
  })

  const [generatedSchema, setGeneratedSchema] = useState<FormSchema | null>(
    initialForm?.schema || null
  )
  const [questions, setQuestions] = useState<Question[]>(
    initialForm?.schema?.questions || []
  )
  const [formTitle, setFormTitle] = useState(initialForm?.title || '')
  const [hookText, setHookText] = useState(initialForm?.schema?.hook_text || '')
  const [hookLoading, setHookLoading] = useState(false)

  // Status & end date
  const [status, setStatus] = useState<'active' | 'inactive'>(
    initialForm?.status === 'active' ? 'active' : 'inactive'
  )
  const [endsAt, setEndsAt] = useState<string>(
    initialForm?.ends_at ? initialForm.ends_at.slice(0, 10) : ''
  )

  // Widget layout
  const [widgetLayout, setWidgetLayout] = useState<string>(initialForm?.theme?.layout || 'default')

  // Lead capture config
  const lc = initialForm?.schema?.lead_capture
  const [leadFields, setLeadFields] = useState<LeadField[]>(
    lc?.fields?.length
      ? lc.fields
      : [{ id: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', required: true }]
  )
  const [leadTitle, setLeadTitle] = useState(lc?.title || '')
  const [leadDesc, setLeadDesc] = useState(lc?.description || '')
  const [leadNote, setLeadNote] = useState(lc?.note || '')
  const [leadBtn, setLeadBtn] = useState(lc?.button_text || '立即送出')

  const effectiveGoal = aiInput.conversion_goal === '自訂...'
    ? aiInput.conversion_goal_custom
    : aiInput.conversion_goal

  // ── Question helpers ──
  function updateQuestion(i: number, patch: Partial<Question>) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q))
  }
  function removeQuestion(i: number) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i))
  }
  function moveQuestion(i: number, dir: -1 | 1) {
    setQuestions(qs => {
      const next = [...qs]
      const target = i + dir
      if (target < 0 || target >= next.length) return next
      ;[next[i], next[target]] = [next[target], next[i]]
      return next
    })
  }
  function addQuestion() {
    const newQ: Question = {
      id: `q${Date.now()}`,
      type: 'single_choice',
      question_text: '',
      options: ['', ''],
    }
    setQuestions(qs => [...qs, newQ])
  }
  function updateOption(qi: number, oi: number, value: string) {
    setQuestions(qs => qs.map((q, idx) => idx !== qi ? q : {
      ...q,
      options: q.options.map((o, oidx) => oidx === oi ? value : o),
    }))
  }
  function addOption(qi: number) {
    setQuestions(qs => qs.map((q, idx) => idx !== qi ? q : {
      ...q,
      options: [...q.options, ''],
    }))
  }
  function removeOption(qi: number, oi: number) {
    setQuestions(qs => qs.map((q, idx) => idx !== qi ? q : {
      ...q,
      options: q.options.filter((_, oidx) => oidx !== oi),
    }))
  }
  function addOtherOption(qi: number) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi || q.options.includes('__other__')) return q
      return { ...q, options: [...q.options, '__other__'] }
    }))
  }

  async function handleGenerateHook() {
    setHookLoading(true)
    try {
      const res = await fetch('/api/ai-generate/hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: aiInput.client_name || formTitle,
          industry: aiInput.industry,
          product_features: aiInput.product_features,
          conversion_goal: effectiveGoal,
          free_text: aiInput.free_text,
        }),
      })
      const { hook_text } = await res.json()
      if (hook_text) setHookText(hook_text)
    } finally {
      setHookLoading(false)
    }
  }

  function addPresetField(field: LeadField) {
    if (leadFields.find(f => f.id === field.id)) return
    setLeadFields([...leadFields, { ...field }])
  }

  function addCustomField() {
    setLeadFields([...leadFields, {
      id: `custom_${Date.now()}`, label: '自訂欄位', type: 'text', placeholder: '', required: false,
    }])
  }

  function updateField(i: number, patch: Partial<LeadField>) {
    setLeadFields(leadFields.map((f, idx) => idx === i ? { ...f, ...patch } : f))
  }

  function removeField(i: number) {
    setLeadFields(leadFields.filter((_, idx) => idx !== i))
  }

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: aiInput.client_name,
          industry: aiInput.industry,
          product_features: aiInput.product_features,
          conversion_goal: effectiveGoal,
          free_text: aiInput.free_text,
          question_count: questionCount,
        }),
      })
      const { schema } = await res.json()
      setGeneratedSchema(schema)
      setQuestions(schema.questions || [])
      if (!formTitle) setFormTitle(schema.form_title || aiInput.client_name)
      if (schema.hook_text) setHookText(schema.hook_text)
      if (schema.lead_capture) {
        setLeadTitle(schema.lead_capture.title || '')
        setLeadDesc(schema.lead_capture.description || '')
        setLeadBtn(schema.lead_capture.button_text || '立即送出')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSwitchToManual() {
    setMode('manual')
    if (!generatedSchema) {
      const emptySchema: FormSchema = {
        form_title: formTitle,
        questions: [{ id: `q${Date.now()}`, type: 'single_choice', question_text: '', options: ['', ''] }],
        lead_capture: {
          title: '',
          description: '',
          fields: leadFields,
          button_text: '立即送出',
        },
      }
      setGeneratedSchema(emptySchema)
      setQuestions(emptySchema.questions)
    }
  }

  async function handleSave() {
    if (!formTitle) return
    setLoading(true)

    const finalSchema: FormSchema = {
      ...(generatedSchema || {}),
      form_title: formTitle,
      questions,
      hook_text: hookText || undefined,
      lead_capture: {
        title: leadTitle,
        description: leadDesc,
        note: leadNote,
        fields: leadFields,
        button_text: leadBtn,
      },
    }

    const payload = {
      title: formTitle,
      schema: finalSchema,
      status,
      ends_at: endsAt ? new Date(endsAt + 'T23:59:59').toISOString() : null,
      theme: { ...(initialForm?.theme || {}), layout: widgetLayout },
    }

    try {
      if (isEdit) {
        await fetch(`/api/forms/${initialForm!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      router.push('/dashboard/forms')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? '編輯表單' : '新增表單'}</h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* Mode toggle */}
        {!isEdit && (
          <div className="flex rounded-xl border border-gray-800 bg-gray-900 p-1 gap-1">
            <button
              type="button"
              onClick={handleSwitchToManual}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                mode === 'manual' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Plus size={14} /> 手動建立
            </button>
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                mode === 'ai' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sparkles size={14} /> AI 自動生成
            </button>
          </div>
        )}

        {/* AI generation section */}
        {mode === 'ai' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
            <Sparkles size={12} /> AI 生成問卷
          </p>
          <div className="flex flex-col gap-3">
            <Field label="客戶名稱">
              <input className="input-base" placeholder="例：OO 投信"
                value={aiInput.client_name} onChange={e => setAiInput({ ...aiInput, client_name: e.target.value })} />
            </Field>
            <Field label="產業屬性">
              <input className="input-base" placeholder="可自行填寫，例：高股息 ETF"
                list="industry-list" value={aiInput.industry}
                onChange={e => setAiInput({ ...aiInput, industry: e.target.value })} />
              <datalist id="industry-list">
                {INDUSTRY_SUGGESTIONS.map(i => <option key={i} value={i} />)}
              </datalist>
            </Field>
            <Field label="產品名稱及特色">
              <textarea className="input-base min-h-[72px] resize-none" placeholder="列出 3 個最大賣點"
                value={aiInput.product_features} onChange={e => setAiInput({ ...aiInput, product_features: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="轉換目標">
                <select className="input-base" value={aiInput.conversion_goal}
                  onChange={e => setAiInput({ ...aiInput, conversion_goal: e.target.value })}>
                  {CONVERSION_GOALS.map(g => <option key={g}>{g}</option>)}
                </select>
                {aiInput.conversion_goal === '自訂...' && (
                  <input className="input-base mt-2" placeholder="請輸入自訂目標"
                    value={aiInput.conversion_goal_custom}
                    onChange={e => setAiInput({ ...aiInput, conversion_goal_custom: e.target.value })} />
                )}
              </Field>
              <Field label={`題目數量：${questionCount} 題`}>
                <div className="flex items-center gap-2">
                  <input type="range" min={1} max={50} value={questionCount}
                    onChange={e => setQuestionCount(Number(e.target.value))}
                    className="flex-1 accent-violet-500" />
                  <input type="number" min={1} max={50} value={questionCount}
                    onChange={e => setQuestionCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="input-base w-14 text-center" />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {questionCount <= 3 ? '轉換率最高' : questionCount <= 10 ? '適合深度篩選' : '注意完成率'}
                </p>
              </Field>
            </div>
            <Field label="補充說明（選填）">
              <textarea className="input-base min-h-[56px] resize-none" placeholder="受眾、語氣、禁忌詞等"
                value={aiInput.free_text} onChange={e => setAiInput({ ...aiInput, free_text: e.target.value })} />
            </Field>
            <button onClick={handleGenerate}
              disabled={loading || !aiInput.client_name || !aiInput.industry || !aiInput.product_features}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
              <Sparkles size={13} />
              {loading ? 'AI 生成中...' : isEdit && generatedSchema ? '重新 AI 生成' : 'AI 自動生成問卷'}
            </button>
          </div>
        </div>
        )}

        {/* Questions preview */}
        {generatedSchema && (
          <>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">問卷題目</p>
              <Field label="表單名稱">
                <input className="input-base" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              </Field>

              {/* Hook text */}
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <span>🎁</span> 第一頁吸引文案
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateHook}
                    disabled={hookLoading || (!aiInput.client_name && !formTitle)}
                    className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-40"
                  >
                    <Sparkles size={10} />
                    {hookLoading ? 'AI 生成中...' : 'AI 生成'}
                  </button>
                </div>
                <input
                  className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-600 focus:border-amber-400"
                  placeholder="例：填寫問卷抽 2000 元日本旅遊折價券，限量 50 名！"
                  value={hookText}
                  onChange={e => setHookText(e.target.value)}
                />
                <p className="mt-1.5 text-[11px] text-amber-600/70">此文案會在第一頁以醒目 Banner 方式顯示，吸引網友填寫</p>
              </div>

              <div className="mt-4 space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                    {/* Question header */}
                    <div className="mb-2 flex items-center gap-2">
                      <span className="shrink-0 rounded bg-gray-700 px-1.5 py-0.5 text-[11px] font-semibold text-gray-400">Q{i + 1}</span>
                      <input
                        className="flex-1 rounded-lg border border-gray-600 bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-100 outline-none placeholder:text-gray-600 focus:border-violet-500"
                        placeholder="輸入題目文字"
                        value={q.question_text}
                        onChange={e => updateQuestion(i, { question_text: e.target.value })}
                      />
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button onClick={() => moveQuestion(i, -1)} disabled={i === 0}
                          className="rounded p-1 text-gray-600 hover:bg-gray-700 hover:text-gray-300 disabled:opacity-30">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1}
                          className="rounded p-1 text-gray-600 hover:bg-gray-700 hover:text-gray-300 disabled:opacity-30">
                          <ChevronDown size={14} />
                        </button>
                        <button onClick={() => removeQuestion(i)} disabled={questions.length <= 1}
                          className="rounded p-1 text-gray-600 hover:bg-gray-700 hover:text-red-400 disabled:opacity-30">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Options */}
                    <div className="ml-7 space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          {opt === '__other__' ? (
                            <>
                              <span className="shrink-0 h-4 w-4 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center text-[9px]">✏️</span>
                              <span className="flex-1 rounded border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-500 italic">其他（自填）</span>
                            </>
                          ) : (
                            <>
                              <span className="shrink-0 h-4 w-4 rounded-full border border-gray-600 bg-gray-900" />
                              <input
                                className="flex-1 rounded border border-gray-600 bg-gray-900 px-2.5 py-1 text-xs text-gray-300 outline-none placeholder:text-gray-600 focus:border-violet-500"
                                placeholder={`選項 ${oi + 1}`}
                                value={opt}
                                onChange={e => updateOption(i, oi, e.target.value)}
                              />
                            </>
                          )}
                          <button onClick={() => removeOption(i, oi)} disabled={opt !== '__other__' && q.options.filter(o => o !== '__other__').length <= 2}
                            className="shrink-0 text-gray-600 hover:text-red-400 disabled:opacity-30">
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addOption(i)}
                        className="flex items-center gap-1 pl-6 text-xs text-gray-500 hover:text-violet-400 transition">
                        <Plus size={11} /> 新增選項
                      </button>
                      {!q.options.includes('__other__') && (
                        <button onClick={() => addOtherOption(i)}
                          className="flex items-center gap-1 pl-6 text-xs text-gray-500 hover:text-indigo-400 transition">
                          <Plus size={11} /> 新增「其他（自填）」
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addQuestion}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-700 py-2.5 text-xs font-medium text-gray-500 transition hover:border-violet-500 hover:text-violet-400">
                <Plus size={13} /> 新增題目
              </button>
            </div>

            {/* Widget layout selector */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">介面風格</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {LAYOUTS.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setWidgetLayout(l.value)}
                    className={`flex shrink-0 flex-col items-center gap-2 rounded-xl border p-2 transition ${
                      widgetLayout === l.value
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                    }`}
                  >
                    <LayoutPreview value={l.value} />
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${widgetLayout === l.value ? 'text-violet-400' : 'text-gray-300'}`}>{l.label}</p>
                      <p className="text-[10px] text-gray-600">{l.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lead capture config */}
            <div className="rounded-xl border border-violet-500/20 bg-gray-900 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-violet-400">收網頁設定</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="標題">
                  <input className="input-base" value={leadTitle} onChange={e => setLeadTitle(e.target.value)} />
                </Field>
                <Field label="按鈕文字">
                  <input className="input-base" value={leadBtn} onChange={e => setLeadBtn(e.target.value)} />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="說明文字">
                  <input className="input-base" value={leadDesc} onChange={e => setLeadDesc(e.target.value)} />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="備註（例：中獎將以此 Email 通知，請確認資料無誤）">
                  <input className="input-base" placeholder="選填" value={leadNote} onChange={e => setLeadNote(e.target.value)} />
                </Field>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">收集欄位</p>
                <div className="flex flex-col gap-2 mb-3">
                  {leadFields.map((field, i) => (
                    <div key={field.id} className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2">
                      <GripVertical size={13} className="text-gray-600 shrink-0" />
                      <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                        <input className="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-gray-300 outline-none"
                          value={field.label} onChange={e => updateField(i, { label: e.target.value })} placeholder="欄位名稱" />
                        <select className="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-gray-300 outline-none"
                          value={field.type} onChange={e => updateField(i, { type: e.target.value as LeadField['type'] })}>
                          <option value="text">文字</option>
                          <option value="email">Email</option>
                          <option value="tel">電話</option>
                          <option value="select">下拉選單</option>
                          <option value="radio">單選按鈕</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0 cursor-pointer">
                        <input type="checkbox" checked={field.required}
                          onChange={e => updateField(i, { required: e.target.checked })} className="accent-violet-500" />
                        必填
                      </label>
                      <button onClick={() => removeField(i)} disabled={leadFields.length === 1}
                        className="text-gray-600 hover:text-red-400 disabled:opacity-30">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LEAD_FIELDS.filter(pf => !leadFields.find(f => f.id === pf.id)).map(pf => (
                    <button key={pf.id} onClick={() => addPresetField(pf)}
                      className="rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:border-violet-500 hover:text-violet-400 transition">
                      + {pf.label}
                    </button>
                  ))}
                  <button onClick={addCustomField}
                    className="flex items-center gap-1 rounded-full border border-dashed border-gray-600 px-2.5 py-1 text-xs text-gray-500 hover:border-violet-500 hover:text-violet-400 transition">
                    <Plus size={11} />自訂
                  </button>
                </div>
              </div>
            </div>

            {/* Status & end date */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">發布設定</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-400">啟用狀態</p>
                  <div className="flex gap-2">
                    <button onClick={() => setStatus('active')}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${status === 'active' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
                      ● 啟用
                    </button>
                    <button onClick={() => setStatus('inactive')}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${status === 'inactive' ? 'border-gray-500 bg-gray-700 text-gray-300' : 'border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
                      ○ 停用
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-400">結束日期（不設定 = 永久）</p>
                  <input type="date" className="input-base"
                    value={endsAt}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setEndsAt(e.target.value)} />
                  {endsAt && (
                    <button onClick={() => setEndsAt('')} className="mt-1 text-xs text-gray-500 hover:text-red-400">
                      清除（改為永久）
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="flex gap-2 pb-8">
              <button onClick={handleSave} disabled={loading || !formTitle}
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
                {loading ? '儲存中...' : isEdit ? '儲存變更' : '建立並啟用'}
              </button>
              <button onClick={() => router.back()}
                className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-gray-800">
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      {children}
    </div>
  )
}

function LayoutPreview({ value }: { value: string }) {
  const W = 96, H = 56

  if (value === 'default') return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 6, display: 'block' }}>
      <rect width={W} height={H} fill="#ffffff" rx="6" />
      <rect width={W} height={3} fill="#7c3aed" rx="1" />
      {/* question text lines */}
      <rect x="10" y="12" width="50" height="4" rx="2" fill="#111827" opacity=".8" />
      <rect x="10" y="19" width="38" height="3" rx="1.5" fill="#6b7280" opacity=".5" />
      {/* option buttons */}
      <rect x="10" y="27" width="76" height="7" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth=".8" />
      <rect x="10" y="36" width="76" height="7" rx="3" fill="#7c3aed" />
      <rect x="10" y="45" width="76" height="7" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth=".8" />
    </svg>
  )

  if (value === 'luxury-dark') return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 6, display: 'block' }}>
      <rect width={W} height={H} fill="#0F1B2D" rx="6" />
      <rect width={W} height={2} fill="#C5A55A" rx="1" />
      {/* left column */}
      <rect x="8" y="10" width="28" height="3" rx="1.5" fill="#C5A55A" opacity=".6" />
      <rect x="8" y="16" width="32" height="3" rx="1.5" fill="#ffffff" opacity=".8" />
      <rect x="8" y="22" width="26" height="3" rx="1.5" fill="#ffffff" opacity=".5" />
      {/* divider */}
      <line x1="47" y1="8" x2="47" y2="48" stroke="#1E3A5F" strokeWidth="1" />
      {/* circles grid */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <circle cx={57 + (i % 2) * 18} cy={18 + Math.floor(i / 2) * 16} r="6" fill={i === 1 ? '#C5A55A' : 'none'} stroke="#C5A55A" strokeWidth="1" />
          <rect x={51 + (i % 2) * 18} cy={27 + Math.floor(i / 2) * 16} width="14" height="2" rx="1" fill="#8B9BB4" opacity=".6" y={27 + Math.floor(i / 2) * 16} />
        </g>
      ))}
    </svg>
  )

  if (value === 'luxury-light') return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 6, display: 'block' }}>
      <rect width={W} height={H} fill="#F8F4ED" rx="6" />
      <rect width={W} height={2} fill="#C5A55A" rx="1" />
      <rect x="8" y="10" width="28" height="3" rx="1.5" fill="#C5A55A" opacity=".6" />
      <rect x="8" y="16" width="32" height="3" rx="1.5" fill="#1A1208" opacity=".8" />
      <rect x="8" y="22" width="26" height="3" rx="1.5" fill="#8B7355" opacity=".5" />
      <line x1="47" y1="8" x2="47" y2="48" stroke="#E8DFD0" strokeWidth="1" />
      {[0,1,2,3].map(i => (
        <g key={i}>
          <circle cx={57 + (i % 2) * 18} cy={18 + Math.floor(i / 2) * 16} r="6" fill={i === 0 ? '#C5A55A' : 'none'} stroke="#C5A55A" strokeWidth="1" />
          <rect x={51 + (i % 2) * 18} width="14" height="2" rx="1" fill="#8B7355" opacity=".5" y={27 + Math.floor(i / 2) * 16} />
        </g>
      ))}
    </svg>
  )

  if (value === 'marketing') return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 6, display: 'block' }}>
      <rect width={W} height={H} fill="#ffffff" rx="6" />
      <rect width={W} height={4} fill="#F97316" rx="1" />
      {/* left area */}
      <rect x="8" y="12" width="12" height="3" rx="1.5" fill="#F97316" opacity=".6" />
      <rect x="8" y="18" width="34" height="3" rx="1.5" fill="#111827" opacity=".8" />
      <rect x="8" y="24" width="26" height="3" rx="1.5" fill="#111827" opacity=".5" />
      <line x1="50" y1="8" x2="50" y2="50" stroke="#E5E7EB" strokeWidth="1" />
      {/* 2x2 option cards */}
      <rect x="53" y="10" width="18" height="14" rx="3" fill="#F97316" />
      <rect x="74" y="10" width="18" height="14" rx="3" fill="#f3f4f6" stroke="#E5E7EB" strokeWidth=".8" />
      <rect x="53" y="27" width="18" height="14" rx="3" fill="#f3f4f6" stroke="#E5E7EB" strokeWidth=".8" />
      <rect x="74" y="27" width="18" height="14" rx="3" fill="#f3f4f6" stroke="#E5E7EB" strokeWidth=".8" />
    </svg>
  )

  if (value === 'minimal') return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 6, display: 'block' }}>
      <rect width={W} height={H} fill="#ffffff" rx="6" />
      <rect width="60" height="2" fill="#6366F1" rx="1" />
      {/* left */}
      <rect x="8" y="10" width="20" height="2" rx="1" fill="#6366F1" opacity=".5" />
      <rect x="8" y="15" width="32" height="3" rx="1.5" fill="#111827" opacity=".8" />
      <rect x="8" y="21" width="24" height="2.5" rx="1.25" fill="#111827" opacity=".5" />
      <line x1="48" y1="6" x2="48" y2="50" stroke="#E5E7EB" strokeWidth="1" />
      {/* radio list */}
      {[0,1,2].map(i => (
        <g key={i}>
          <circle cx={55} cy={14 + i * 12} r="3.5" fill={i === 1 ? '#6366F1' : 'none'} stroke={i === 1 ? '#6366F1' : '#D1D5DB'} strokeWidth="1" />
          {i === 1 && <circle cx={55} cy={14 + i * 12} r="1.5" fill="#fff" />}
          <rect x="62" y={11 + i * 12} width="24" height="2.5" rx="1.25" fill={i === 1 ? '#111827' : '#6B7280'} opacity={i === 1 ? '.8' : '.4'} />
        </g>
      ))}
    </svg>
  )

  if (value === 'storm') return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 6, display: 'block' }}>
      <rect width={W} height={H} fill="#ffffff" rx="6" />
      <rect width={W} height={3} fill="#CC0000" rx="1" />
      {/* dark header bar */}
      <rect y="3" width={W} height="12" fill="#1C1C1C" />
      <rect x="8" y="6" width="3" height="6" rx="1" fill="#CC0000" />
      <rect x="14" y="7" width="40" height="3" rx="1.5" fill="#ffffff" opacity=".7" />
      {/* left */}
      <rect x="8" y="20" width="34" height="3" rx="1.5" fill="#1A1A1A" opacity=".9" />
      <rect x="8" y="26" width="26" height="2.5" rx="1.25" fill="#1A1A1A" opacity=".5" />
      <line x1="50" y1="16" x2="50" y2="54" stroke="#E0E0E0" strokeWidth="1" />
      {/* news-style options with left border */}
      {[0,1,2].map(i => (
        <g key={i}>
          <rect x="54" y={18 + i * 11} width="3" height="8" rx="1" fill={i === 0 ? '#CC0000' : '#D0D0D0'} />
          <rect x="60" y={20 + i * 11} width="30" height="3" rx="1.5" fill={i === 0 ? '#CC0000' : '#666'} opacity={i === 0 ? '.9' : '.4'} />
        </g>
      ))}
    </svg>
  )

  return <div style={{ width: W, height: H, background: '#1f2937', borderRadius: 6 }} />
}
