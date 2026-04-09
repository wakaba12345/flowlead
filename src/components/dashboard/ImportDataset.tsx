'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ChevronRight, Loader2, AlertCircle, FileSpreadsheet, Sparkles } from 'lucide-react'

type ColType = 'lead' | 'question' | 'multi_question' | 'checkbox_option' | 'open_question' | 'skip'

interface ColConfig {
  header: string
  type: ColType
  leadId?: string
  leadLabel?: string
  groupName?: string   // for checkbox_option: the question this option belongs to
  optionLabel?: string // for checkbox_option: display text of this option
}

type Row = Record<string, string>
type Step = 'upload' | 'classifying' | 'map' | 'done'

// ── CSV parser: handles quoted fields with embedded newlines ───────────────
function parseCSV(text: string): { headers: string[]; rows: Row[] } {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const allRows: string[][] = []
  let row: string[] = [], cur = '', inQ = false
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    if (ch === '"') {
      if (inQ && normalized[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === ',' && !inQ) {
      row.push(cur.trim()); cur = ''
    } else if (ch === '\n' && !inQ) {
      row.push(cur.trim()); cur = ''
      if (row.some(v => v)) allRows.push(row)
      row = []
    } else {
      cur += ch
    }
  }
  if (cur || row.length > 0) { row.push(cur.trim()); if (row.some(v => v)) allRows.push(row) }
  if (allRows.length < 2) return { headers: [], rows: [] }
  const headers = allRows[0]
  const rows = allRows.slice(1).map(vals => {
    const r: Row = {}
    headers.forEach((h, i) => { r[h] = vals[i] || '' })
    return r
  }).filter(r => Object.values(r).some(v => v))
  return { headers, rows }
}

function decodeBuffer(buf: ArrayBuffer): string {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf) }
  catch { try { return new TextDecoder('big5').decode(buf) } catch { return new TextDecoder('utf-8', { fatal: false }).decode(buf) } }
}

export default function ImportDataset() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [cols, setCols] = useState<ColConfig[]>([])
  const [title, setTitle] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Fallback rule-based classification ────────────────────────────────────
  function rulesClassify(headers: string[], sampleRows: Row[]): ColConfig[] {
    return headers.map(h => {
      const ht = h.trim()
      // Timestamp
      if (ht.includes('時間戳記') || ht.toLowerCase() === 'timestamp' || ht.includes('填寫時間'))
        return { header: h, type: 'skip' }
      // Wide-format checkbox: header contains \n- or \n - pattern
      const cbMatch = ht.match(/^(.+?)\n[-–]\s*(.+)$/)
      if (cbMatch)
        return { header: h, type: 'checkbox_option', groupName: cbMatch[1].trim(), optionLabel: cbMatch[2].trim() }
      // Lead fields by keyword
      const lower = ht.toLowerCase()
      if (ht === '姓名' || ht === '名字' || lower === 'name')
        return { header: h, type: 'lead', leadId: 'name', leadLabel: '姓名' }
      if (lower.includes('email') || lower.includes('e-mail') || ht.includes('電子郵件') || ht.includes('電郵'))
        return { header: h, type: 'lead', leadId: 'email', leadLabel: 'Email' }
      if (ht.includes('電話') || ht.includes('手機') || lower.includes('phone'))
        return { header: h, type: 'lead', leadId: 'phone', leadLabel: '電話' }
      if (ht === '性別' || lower === 'gender')
        return { header: h, type: 'lead', leadId: 'gender', leadLabel: '性別' }
      if (ht === '年齡' || lower === 'age')
        return { header: h, type: 'lead', leadId: 'age', leadLabel: '年齡' }
      if (ht === '稱呼')
        return { header: h, type: 'skip' }
      // Heuristic: if >5 unique non-empty values and avg frequency < 2 → likely open-ended
      const vals = sampleRows.map(r => (r[h] || '').trim()).filter(Boolean)
      if (vals.length > 0) {
        const unique = new Set(vals)
        const avgFreq = vals.length / unique.size
        if (unique.size > 5 && avgFreq < 2) return { header: h, type: 'open_question' }
      }
      return { header: h, type: 'question' }
    })
  }

  // ── AI classification ─────────────────────────────────────────────────────
  async function aiClassify(headers: string[], sampleRows: Row[]): Promise<ColConfig[]> {
    const res = await fetch('/api/classify-columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, sampleRows: sampleRows.slice(0, 3) }),
    })
    if (!res.ok) throw new Error('AI 分類失敗')
    const { columns, error } = await res.json()
    if (error || !columns) throw new Error(error || 'AI 回傳異常')

    // Map AI result back to ColConfig[]
    return headers.map(h => {
      const ai = columns.find((c: { header: string }) => c.header === h || c.header === h.trim())
      if (!ai) return { header: h, type: 'question' as ColType }
      const type = (['lead','question','multi_question','checkbox_option','open_question','skip'].includes(ai.type)
        ? ai.type : 'question') as ColType
      return {
        header: h,
        type,
        leadId:      ai.field_id,
        leadLabel:   ai.field_label,
        groupName:   ai.group_name,
        optionLabel: ai.option_label,
      }
    })
  }

  function handleFile(file: File) {
    setError('')
    const reader = new FileReader()
    reader.onload = async e => {
      const buf = e.target?.result as ArrayBuffer
      const text = decodeBuffer(buf).replace(/^\uFEFF/, '')
      const { headers, rows } = parseCSV(text)
      if (!headers.length || rows.length === 0) { setError('無法解析 CSV，請確認格式正確且包含資料'); return }
      setHeaders(headers)
      setRows(rows)
      // Pre-fill title from filename (strip .csv extension)
      setTitle(file.name.replace(/\.csv$/i, '').trim())
      setStep('classifying')

      try {
        const classified = await aiClassify(headers, rows)
        setCols(classified)
      } catch {
        // Fallback to rule-based if AI fails
        setCols(rulesClassify(headers, rows))
      }
      setStep('map')
    }
    reader.readAsArrayBuffer(file)
  }

  function updateCol(idx: number, patch: Partial<ColConfig>) {
    setCols(prev => prev.map((c, i) => {
      if (i !== idx) return c
      return { ...c, ...patch }
    }))
  }

  async function doImport() {
    if (!title.trim()) { setError('請輸入資料集名稱'); return }

    let qIdx = 0
    const questionCols = cols.filter(c => c.type === 'question' || c.type === 'multi_question' || c.type === 'open_question').map(c => ({
      csvHeader: c.header, questionText: c.header, questionId: `q${++qIdx}`,
      isMulti: c.type === 'multi_question', isOpen: c.type === 'open_question',
    }))
    const leadCols = cols.filter(c => c.type === 'lead' && c.leadId).map(c => ({
      csvHeader: c.header, fieldId: c.leadId!, fieldLabel: c.leadLabel || c.header,
    }))

    // Build checkbox groups: group columns by groupName
    const cbCols = cols.filter(c => c.type === 'checkbox_option' && c.groupName)
    const cbGroups: Record<string, { groupName: string; headers: string[]; optionLabels: string[] }> = {}
    for (const c of cbCols) {
      if (!cbGroups[c.groupName!]) cbGroups[c.groupName!] = { groupName: c.groupName!, headers: [], optionLabels: [] }
      cbGroups[c.groupName!].headers.push(c.header)
      cbGroups[c.groupName!].optionLabels.push(c.optionLabel || c.header.split(/\n[-–]\s*/).pop() || c.header)
    }
    const checkboxGroups = Object.values(cbGroups).map((g, i) => ({
      groupName: g.groupName, questionId: `cg${i + 1}`,
      headers: g.headers, optionLabels: g.optionLabels,
    }))

    if (questionCols.length === 0 && leadCols.length === 0 && checkboxGroups.length === 0) {
      setError('請至少設定一個統計欄位或個人資料欄位'); return
    }

    setImporting(true); setError('')
    try {
      const step1Res = await fetch('/api/import-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(), leadColumns: leadCols,
          questionColumns: questionCols, checkboxGroups,
          sampleRows: rows.slice(0, 200),
        }),
      })
      const step1 = await step1Res.json().catch(() => ({ error: '伺服器回應異常' }))
      if (!step1Res.ok) { setError(step1.error || '建立資料集失敗'); return }
      const { form_id, tenant_id } = step1

      const BATCH = 200
      for (let i = 0; i < rows.length; i += BATCH) {
        const batchRes = await fetch('/api/import-dataset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form_id, tenant_id, leadColumns: leadCols,
            questionColumns: questionCols, checkboxGroups,
            rows: rows.slice(i, i + BATCH),
          }),
        })
        const batchData = await batchRes.json().catch(() => ({ error: '批次匯入失敗' }))
        if (!batchRes.ok) { setError(batchData.error || '匯入資料時發生錯誤'); return }
      }

      setStep('done')
      setTimeout(() => { setOpen(false); router.push(`/dashboard/leads/${form_id}`) }, 1200)
    } catch (e) {
      setError(`匯入失敗：${e}`)
    } finally {
      setImporting(false)
    }
  }

  function close() {
    setOpen(false); setStep('upload')
    setHeaders([]); setRows([]); setCols([]); setTitle(''); setError('')
  }

  const questionCount = cols.filter(c => ['question','multi_question','open_question','checkbox_option'].includes(c.type)).length
  const leadCount = cols.filter(c => c.type === 'lead').length
  // unique checkbox groups
  const cbGroupCount = new Set(cols.filter(c => c.type === 'checkbox_option' && c.groupName).map(c => c.groupName)).size

  const TYPE_BTNS: { t: ColType; label: string; cls: string }[] = [
    { t: 'question',        label: '統計欄位', cls: 'bg-violet-600' },
    { t: 'multi_question',  label: '複選統計', cls: 'bg-orange-600' },
    { t: 'checkbox_option', label: '核取選項', cls: 'bg-pink-600'   },
    { t: 'open_question',   label: '開放式',   cls: 'bg-amber-600'  },
    { t: 'lead',            label: '個人資料', cls: 'bg-cyan-600'   },
    { t: 'skip',            label: '略過',     cls: 'bg-gray-600'   },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-gray-600 bg-gray-900 px-4 py-3 text-sm text-gray-400 transition hover:border-violet-500 hover:bg-gray-800 hover:text-violet-300"
      >
        <FileSpreadsheet size={16} />
        匯入外部資料分析
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 shrink-0">
              <div>
                <p className="font-semibold text-gray-100">匯入外部作答資料</p>
                <p className="text-xs text-gray-500 mt-0.5">上傳 CSV → AI 自動分析欄位 → 建立統計分析</p>
              </div>
              <button onClick={close} className="text-gray-500 hover:text-gray-300 transition"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Step 1: Upload */}
              {step === 'upload' && (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 py-16 hover:border-violet-500 transition"
                  >
                    <Upload size={32} className="mb-3 text-gray-500" />
                    <p className="text-sm font-medium text-gray-300">點擊或拖曳 CSV 檔案</p>
                    <p className="mt-1.5 text-xs text-gray-600">支援 Google 表單、SurveyMonkey、Excel 匯出的 CSV（UTF-8 / Big5）</p>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                  </div>
                  {error && <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle size={13} />{error}</p>}
                </>
              )}

              {/* AI classifying */}
              {step === 'classifying' && (
                <div className="py-16 text-center">
                  <Sparkles size={32} className="mx-auto mb-3 text-violet-400 animate-pulse" />
                  <p className="font-semibold text-gray-100">AI 正在分析欄位…</p>
                  <p className="mt-1 text-sm text-gray-400">自動辨識個人資料、問卷題目、核取方塊群組</p>
                </div>
              )}

              {/* Step 2: Column mapping */}
              {step === 'map' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-400">資料集名稱</label>
                    <input
                      type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="例：2024 客戶滿意度調查"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-violet-400" /> AI 已自動分類，可手動調整
                      </p>
                      <p className="text-xs text-gray-600">{rows.length} 筆 · {headers.length} 欄</p>
                    </div>

                    {/* Legend */}
                    <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-xs">
                      <p><span className="font-semibold text-violet-300">統計欄位</span> — 單選/評分題</p>
                      <p><span className="font-semibold text-orange-300">複選統計</span> — 逗號分隔多選（同格）</p>
                      <p><span className="font-semibold text-pink-300">核取選項</span> — v/空白的 checkbox 欄位，系統自動合併成一題</p>
                      <p><span className="font-semibold text-amber-300">開放式</span> — 自由填寫文字</p>
                      <p><span className="font-semibold text-cyan-300">個人資料</span> — 姓名/Email/電話等</p>
                      <p><span className="font-semibold text-gray-400">略過</span> — 不匯入</p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-gray-800 bg-gray-800/40 p-3">
                      {cols.map((col, idx) => (
                        <div key={col.header} className="flex items-start gap-2 py-0.5">
                          <div className="min-w-0 flex-1 pt-1">
                            <p className="truncate text-sm text-gray-300" title={col.header.replace(/\n/g, ' / ')}>
                              {col.header.replace(/\n/g, ' / ')}
                            </p>
                            {col.type === 'checkbox_option' && col.groupName && (
                              <p className="text-xs text-pink-400 truncate">群組：{col.groupName}</p>
                            )}
                            {col.type === 'lead' && col.leadLabel && (
                              <p className="text-xs text-cyan-500">→ {col.leadLabel}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-1 justify-end">
                            {TYPE_BTNS.map(({ t, label, cls }) => (
                              <button key={t} onClick={() => updateCol(idx, { type: t })}
                                className={`rounded-md px-2 py-0.5 text-xs font-semibold transition ${col.type === t ? cls + ' text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-gray-600">
                      統計欄位 <span className="text-violet-300 font-medium">{questionCount - cbGroupCount}</span> ·
                      核取群組 <span className="text-pink-300 font-medium ml-1">{cbGroupCount}</span> 組 ·
                      個人資料 <span className="text-cyan-300 font-medium ml-1">{leadCount}</span> 欄
                    </p>
                  </div>

                  {error && <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle size={13} />{error}</p>}
                </>
              )}

              {/* Step 3: Done */}
              {step === 'done' && (
                <div className="py-10 text-center">
                  <div className="mb-3 text-5xl">✅</div>
                  <p className="font-semibold text-gray-100">匯入成功！</p>
                  <p className="mt-1 text-sm text-gray-400">正在跳轉到統計分析頁面…</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {step === 'map' && (
              <div className="flex justify-end gap-3 border-t border-gray-800 px-6 py-4 shrink-0">
                <button onClick={() => setStep('upload')}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition">
                  重新上傳
                </button>
                <button onClick={doImport} disabled={importing}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40 transition">
                  {importing
                    ? <><Loader2 size={14} className="animate-spin" />匯入中...</>
                    : <>{`匯入 ${rows.length} 筆並分析`}<ChevronRight size={14} /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
