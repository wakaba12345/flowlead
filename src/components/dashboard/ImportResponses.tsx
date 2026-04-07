'use client'

import { useState, useRef } from 'react'
import { Upload, X, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { Form } from '@/types'

interface Props {
  form: Form
  onImported: () => void
}

type Row = Record<string, string>

export default function ImportResponses({ form, onImported }: Props) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const questions = form.schema?.questions || []
  const leadFields = form.schema?.lead_capture?.fields || []

  // Download a CSV template matching this form
  function downloadTemplate() {
    const leadCols = leadFields.map(f => f.label)
    const qCols = questions.map((q, i) => `Q${i + 1}_${q.question_text.slice(0, 20)}`)
    const headers = [...leadCols, ...qCols]
    const csv = headers.map(h => `"${h}"`).join(',') + '\n'
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.title}_匯入範本.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function parseCSV(text: string): { headers: string[]; rows: Row[] } {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
    if (lines.length < 2) return { headers: [], rows: [] }

    function parseLine(line: string): string[] {
      const result: string[] = []
      let cur = '', inQuote = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
          else inQuote = !inQuote
        } else if (ch === ',' && !inQuote) {
          result.push(cur.trim()); cur = ''
        } else {
          cur += ch
        }
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

  function handleFile(file: File) {
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      if (!headers.length) { setError('無法解析 CSV，請確認格式正確'); return }
      setHeaders(headers)
      setRows(rows)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function doImport() {
    if (!rows.length) return
    setImporting(true)
    setResult(null)

    // Map CSV headers to lead fields + question IDs
    const leadMap: Record<string, string> = {} // csvHeader → fieldId
    leadFields.forEach(f => {
      const match = headers.find(h => h === f.label || h.toLowerCase() === f.label.toLowerCase())
      if (match) leadMap[match] = f.id
    })

    const qMap: Record<string, string> = {} // csvHeader → questionId
    questions.forEach((q, i) => {
      const prefix = `Q${i + 1}_`
      const match = headers.find(h => h.startsWith(prefix) || h === q.question_text)
      if (match) qMap[match] = q.id
    })

    let ok = 0, fail = 0
    for (const row of rows) {
      const lead_data: Record<string, string> = {}
      const answers: Record<string, string> = {}

      for (const [h, v] of Object.entries(row)) {
        if (!v) continue
        if (leadMap[h]) lead_data[leadMap[h]] = v
        else if (qMap[h]) answers[qMap[h]] = v
      }

      try {
        const res = await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form_id: form.id,
            answers,
            lead_data,
            contact_email: lead_data['email'] || null,
            contact_phone: lead_data['phone'] || null,
            completed: true,
            is_test: false,
          }),
        })
        if (res.ok) ok++; else fail++
      } catch { fail++ }
    }

    setResult({ ok, fail })
    setImporting(false)
    if (ok > 0) onImported()
  }

  function close() {
    setOpen(false)
    setRows([])
    setHeaders([])
    setResult(null)
    setError('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
      >
        <Upload size={13} /> 匯入作答
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
              <p className="font-semibold text-gray-100">匯入作答資料</p>
              <button onClick={close} className="text-gray-500 hover:text-gray-300 transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Template download */}
              <div className="rounded-lg border border-gray-800 bg-gray-800/50 px-4 py-3">
                <p className="text-xs text-gray-400 mb-2">先下載範本 CSV，填入資料後再上傳</p>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition">
                  <Download size={12} /> 下載 {form.title} 範本
                </button>
              </div>

              {/* File upload */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 py-8 hover:border-violet-500 transition"
              >
                <Upload size={24} className="mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">點擊或拖曳 CSV 檔案到此處</p>
                <p className="mt-1 text-xs text-gray-600">支援 UTF-8 編碼的 CSV</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle size={13} /> {error}
                </p>
              )}

              {/* Preview */}
              {rows.length > 0 && !result && (
                <div className="rounded-lg border border-gray-800 bg-gray-800/40 px-4 py-3">
                  <p className="text-xs text-gray-400">
                    已解析 <span className="font-semibold text-gray-200">{rows.length}</span> 筆資料，
                    欄位：{headers.slice(0, 4).join('、')}{headers.length > 4 ? `… 等 ${headers.length} 欄` : ''}
                  </p>
                </div>
              )}

              {result && (
                <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${result.fail === 0 ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                  <CheckCircle size={15} />
                  成功匯入 {result.ok} 筆{result.fail > 0 ? `，失敗 ${result.fail} 筆` : ''}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button onClick={close}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition">
                  關閉
                </button>
                {rows.length > 0 && !result && (
                  <button onClick={doImport} disabled={importing}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40 transition">
                    {importing ? <><Loader2 size={14} className="animate-spin" /> 匯入中...</> : `匯入 ${rows.length} 筆`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
