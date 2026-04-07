'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, ExternalLink, Trash2, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

interface ReportRecord {
  id: string
  form_title: string
  created_at: string
}

interface Props {
  formId: string
  refreshTrigger?: number
}

export default function ReportHistory({ formId, refreshTrigger }: Props) {
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copyLink(id: string) {
    const url = `${window.location.origin}/r/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/share?form_id=${formId}`)
      const { reports: data } = await res.json()
      setReports(data || [])
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  // Auto-open and refresh when a new report is generated
  useEffect(() => {
    if (!refreshTrigger) return
    setOpen(true)
    load()
  }, [refreshTrigger, load])

  async function deleteReport(id: string) {
    if (!confirm('確定要刪除這份報告嗎？')) return
    setDeletingId(id)
    try {
      await fetch(`/api/reports/share?id=${id}`, { method: 'DELETE' })
      setReports(prev => prev.filter(r => r.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition"
      >
        <span className="flex items-center gap-2">
          <FileText size={15} className="text-violet-400" />
          歷史 AI 報告
          {reports.length > 0 && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
              {reports.length}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-gray-500">
          {open && (
            <button
              onClick={e => { e.stopPropagation(); load() }}
              className="rounded p-1 hover:bg-gray-800 hover:text-gray-300 transition"
              title="重新整理"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* List */}
      {open && (
        <div className="border-t border-gray-800 px-4 pb-4 pt-3">
          {loading && reports.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">載入中…</p>
          ) : reports.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">尚無歷史報告。生成第一份報告後會自動儲存於此。</p>
          ) : (
            <ul className="space-y-2">
              {reports.map(r => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-200">{r.form_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(r.created_at).toLocaleString('zh-TW', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => copyLink(r.id)}
                      className="flex items-center gap-1 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition"
                      title="複製分享連結"
                    >
                      {copiedId === r.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {copiedId === r.id ? '已複製' : '複製連結'}
                    </button>
                    <a
                      href={`/r/${r.id}`}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-1 rounded-lg bg-violet-600/20 px-2.5 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-600/40 transition"
                    >
                      <ExternalLink size={12} />
                      開啟
                    </a>
                    <button
                      onClick={() => deleteReport(r.id)}
                      disabled={deletingId === r.id}
                      className="rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-40"
                      title="刪除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
