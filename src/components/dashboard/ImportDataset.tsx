'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ChevronRight, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react'

// Known lead field keywords → auto-classify
const LEAD_FIELD_MAP: Record<string, { id: string; label: string }> = {
  '姓名': { id: 'name', label: '姓名' }, 'name': { id: 'name', label: '姓名' },
  'email': { id: 'email', label: 'Email' }, 'e-mail': { id: 'email', label: 'Email' },
  'Email': { id: 'email', label: 'Email' }, 'EMAIL': { id: 'email', label: 'Email' },
  '電話': { id: 'phone', label: '電話' }, 'phone': { id: 'phone', label: '電話' }, '手機': { id: 'phone', label: '電話' },
  '年齡': { id: 'age', label: '年齡' }, 'age': { id: 'age', label: '年齡' },
  '性別': { id: 'gender', label: '性別' }, 'gender': { id: 'gender', label: '性別' },
  '年收入': { id: 'income', label: '年收入' }, 'income': { id: 'income', label: '年收入' },
  '地址': { id: 'address', label: '地址' }, 'address': { id: 'address', label: '地址' },
  '婚姻狀況': { id: 'marital', label: '婚姻狀況' }, '有無子女': { id: 'has_children', label: '有無子女' },
  '時間戳記': { id: '_ts', label: '時間戳記' }, 'Timestamp': { id: '_ts', label: '時間戳記' },
  '時間戳記\n': { id: '_ts', label: '時間戳記' }, '填寫時間': { id: '_ts', label: '填寫時間' },
}

type ColType = 'lead' | 'question' | 'skip'

interface ColConfig {
  header: string
  type: ColType
  leadId?: string
  leadLabel?: string
}

type Row = Record<string, string>
type Step = 'upload' | 'map' | 'done'

function parseCSV(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  function parseLine(line: string): string[] {
    const result: string[] = []; let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
      else cur += ch
    }
    result.push(cur.trim())
    return result
  }
  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(l => {
    const vals = parseLine(l)
    const row: Row = {}
    headers.forEach((h, i) => { row[h] = vals[i] || '' })
    return row
  }).filter(r => Object.values(r).some(v => v))
  return { headers, rows }
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

  function autoClassify(headers: string[]): ColConfig[] {
    return headers.map(h => {
      const lf = LEAD_FIELD_MAP[h] || LEAD_FIELD_MAP[h.trim()]
      if (lf && lf.id !== '_ts') return { header: h, type: 'lead', leadId: lf.id, leadLabel: lf.label }
      if (lf?.id === '_ts') return { header: h, type: 'skip' }
      return { header: h, type: 'question' }
    })
  }

  function decodeBuffer(buf: ArrayBuffer): string {
    // Try UTF-8 first (strict); fall back to Big5 for Traditional Chinese files
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buf)
    } catch {
      try {
        return new TextDecoder('big5').decode(buf)
      } catch {
        return new TextDecoder('utf-8', { fatal: false }).decode(buf)
      }
    }
  }

  function handleFile(file: File) {
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const buf = e.target?.result as ArrayBuffer
      const text = decodeBuffer(buf).replace(/^\uFEFF/, '') // strip BOM
      const { headers, rows } = parseCSV(text)
      if (!headers.length || rows.length === 0) { setError('無法解析 CSV，請確認格式正確且包含資料'); return }
      setHeaders(headers)
      setRows(rows)
      setCols(autoClassify(headers))
      setTitle('')
      setStep('map')
    }
    reader.readAsArrayBuffer(file)
  }

  function updateCol(idx: number, patch: Partial<ColConfig>) {
    setCols(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  async function doImport() {
    if (!title.trim()) { setError('請輸入資料集名稱'); return }
    const questionCols = cols.filter(c => c.type === 'question').map(c => ({ csvHeader: c.header, questionText: c.header }))
    const leadCols = cols.filter(c => c.type === 'lead').map(c => ({ csvHeader: c.header, fieldId: c.leadId!, fieldLabel: c.leadLabel! }))
    if (questionCols.length === 0 && leadCols.length === 0) { setError('請至少設定一個問題或名單欄位'); return }

    setImporting(true)
    setError('')
    try {
      const res = await fetch('/api/import-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), leadColumns: leadCols, questionColumns: questionCols, rows }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '匯入失敗'); return }
      setStep('done')
      setTimeout(() => {
        setOpen(false)
        router.push(`/dashboard/leads/${data.form_id}`)
      }, 1200)
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setImporting(false)
    }
  }

  function close() {
    setOpen(false)
    setStep('upload')
    setHeaders([]); setRows([]); setCols([]); setTitle(''); setError('')
  }

  const questionCount = cols.filter(c => c.type === 'question').length
  const leadCount = cols.filter(c => c.type === 'lead').length

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
                <p className="text-xs text-gray-500 mt-0.5">上傳 CSV → 設定欄位 → 自動建立統計分析</p>
              </div>
              <button onClick={close} className="text-gray-500 hover:text-gray-300 transition"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* ── Step 1: Upload ── */}
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
                    <p className="mt-1.5 text-xs text-gray-600">支援 Google 表單、SurveyMonkey、Excel 匯出的 CSV（UTF-8）</p>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                  </div>
                  {error && <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle size={13} />{error}</p>}
                </>
              )}

              {/* ── Step 2: Column mapping ── */}
              {step === 'map' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-400">資料集名稱</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="例：2024 客戶滿意度調查"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-400">欄位設定</p>
                      <p className="text-xs text-gray-600">{rows.length} 筆資料 · {headers.length} 欄</p>
                    </div>
                    <p className="mb-3 text-xs text-gray-600">
                      <span className="text-violet-400">問題</span> = 作答統計 ·
                      <span className="text-cyan-400 ml-1">名單</span> = 受訪者資訊 ·
                      <span className="text-gray-500 ml-1">略過</span> = 不匯入
                    </p>
                    <div className="space-y-1.5 rounded-xl border border-gray-800 bg-gray-800/40 p-3">
                      {cols.map((col, idx) => (
                        <div key={col.header} className="flex items-center gap-3">
                          <span className="min-w-0 flex-1 truncate text-sm text-gray-300" title={col.header}>{col.header}</span>
                          <div className="flex shrink-0 gap-1">
                            {(['question', 'lead', 'skip'] as ColType[]).map(t => (
                              <button key={t} onClick={() => updateCol(idx, { type: t })}
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${col.type === t
                                  ? t === 'question' ? 'bg-violet-600 text-white'
                                    : t === 'lead' ? 'bg-cyan-600 text-white'
                                    : 'bg-gray-600 text-white'
                                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                                {t === 'question' ? '問題' : t === 'lead' ? '名單' : '略過'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      問題 <span className="text-violet-300 font-medium">{questionCount}</span> 欄 ·
                      名單 <span className="text-cyan-300 font-medium ml-1">{leadCount}</span> 欄
                    </p>
                  </div>

                  {error && <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle size={13} />{error}</p>}
                </>
              )}

              {/* ── Step 3: Done ── */}
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
