'use client'

import { useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FlaskConical, X, ChevronRight, Link as LinkIcon, Copy, Check, ExternalLink } from 'lucide-react'
import type { Response, Form } from '@/types'
import ReportButton from '@/components/dashboard/ReportButton'
import ReportHistory from '@/components/dashboard/ReportHistory'

const COLORS = ['#7c3aed','#06b6d4','#f59e0b','#10b981','#ef4444','#8b5cf6','#3b82f6','#f97316','#ec4899','#14b8a6']
const SKIP_KEYS = new Set(['Email','電話','地址','email','phone','address','姓名','name'])
const BAR_KEYS  = new Set(['年齡','年收入','age','income'])
const INCOME_ORDER = ['30萬以下','30-60萬','60-100萬','100~200萬','200~300萬','300~500萬','500萬以上']
const AGE_ORDER    = ['17以下','18-24','25-34','35-44','45-54','55-64','65以上']

// 將純數字年齡字串轉換成對應區間（相容舊資料）
function bucketAge(val: string): string {
  const n = parseInt(val)
  if (isNaN(n)) return val
  if (n <= 17) return '17以下'
  if (n <= 24) return '18-24'
  if (n <= 34) return '25-34'
  if (n <= 44) return '35-44'
  if (n <= 54) return '45-54'
  if (n <= 64) return '55-64'
  return '65以上'
}

type Filter = { type: 'lead' | 'q'; key: string; value: string; label: string }
interface Props { responses: Response[]; form: Form; includeTest: boolean }

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function arc(cx: number, cy: number, r: number, s: number, e: number) {
  if (e - s >= 360) e = s + 359.99
  const p1 = polar(cx, cy, r, s), p2 = polar(cx, cy, r, e)
  return `M ${cx} ${cy} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`
}

export default function LeadsAnalytics({ responses, form, includeTest }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [filters, setFilters] = useState<Filter[]>([])
  const [selected, setSelected] = useState<Response | null>(null)
  const [otherExpanded, setOtherExpanded] = useState<Record<string, boolean>>({})
  const [latestShareUrl, setLatestShareUrl] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  function copyShareUrl() {
    if (!latestShareUrl) return
    navigator.clipboard.writeText(latestShareUrl).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }
  const questions = form.schema?.questions || []

  const filtered = useMemo(() =>
    responses.filter(r => filters.every(f => {
      if (f.type === 'q') return r.answers?.[f.key] === f.value
      const raw = (r.lead_data || {})[f.key] || ''
      // 年齡欄位：比對前先 bucket，讓舊數字格式（如 "28"）也能命中
      const val = (f.key === '年齡' || f.key === 'age') ? bucketAge(raw) : raw
      return val === f.value
    }))
  , [responses, filters])

  const leadStats = useMemo(() => {
    const keys = Array.from(new Set(filtered.flatMap(r => Object.keys(r.lead_data || {})))).filter(k => !SKIP_KEYS.has(k))
    return keys.map(key => {
      const counts: Record<string, number> = {}
      for (const r of filtered) {
        const v = (r.lead_data || {})[key]
        if (v) counts[v] = (counts[v] || 0) + 1
      }
      const total = Object.values(counts).reduce((s, n) => s + n, 0)
      if (total < 2) return null
      const isBar = BAR_KEYS.has(key)
      // 年齡：先把純數字轉成區間，再合併計數
      let entries: [string, number][]
      if (isBar && (key === '年齡' || key === 'age')) {
        const bucketed: Record<string, number> = {}
        for (const [v, c] of Object.entries(counts)) {
          const b = bucketAge(v)
          bucketed[b] = (bucketed[b] || 0) + c
        }
        entries = Object.entries(bucketed).sort((a, b) => {
          const ai = AGE_ORDER.indexOf(a[0]), bi = AGE_ORDER.indexOf(b[0])
          return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
        })
      } else if (isBar && key === '年收入') {
        entries = Object.entries(counts).sort((a, b) => {
          const ai = INCOME_ORDER.indexOf(a[0]), bi = INCOME_ORDER.indexOf(b[0])
          return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
        })
      } else {
        entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
      }
      return { key, total, entries, isBar }
    }).filter(Boolean) as { key: string; total: number; entries: [string, number][]; isBar: boolean }[]
  }, [filtered])

  const qStats = useMemo(() =>
    questions.map((q, i) => {
      const counts: Record<string, number> = {}
      const otherAnswers: string[] = []
      for (const r of filtered) {
        const ans = r.answers?.[q.id]
        if (!ans) continue
        if (ans.startsWith('其他:')) {
          counts['其他'] = (counts['其他'] || 0) + 1
          otherAnswers.push(ans.slice(3))
        } else {
          counts[ans] = (counts[ans] || 0) + 1
        }
      }
      const total = Object.values(counts).reduce((s, n) => s + n, 0)
      // Sort by count desc, keep 其他 at end
      const regularOptions = q.options.filter(o => o !== '__other__')
        .map(o => ({ label: o, count: counts[o] || 0 }))
        .sort((a, b) => b.count - a.count)
      return {
        id: q.id,
        title: `Q${i+1}｜${q.question_text}`,
        questionText: q.question_text,
        options: q.options.filter(o => o !== '__other__'),
        total,
        data: [...regularOptions, ...(counts['其他'] ? [{ label: '其他', count: counts['其他'] }] : [])],
        otherAnswers,
      }
    })
  , [filtered, questions])

  function toggleFilter(f: Filter) {
    setFilters(prev => {
      const idx = prev.findIndex(x => x.type === f.type && x.key === f.key && x.value === f.value)
      return idx >= 0 ? prev.filter((_, i) => i !== idx) : [...prev, f]
    })
  }
  function isActive(type: 'lead' | 'q', key: string, value: string) {
    return filters.some(f => f.type === type && f.key === key && f.value === value)
  }

  function exportCSV() {
    const ldKeys = Array.from(new Set(filtered.flatMap(l => Object.keys(l.lead_data || {}))))
    const headers = [...ldKeys, ...questions.map((q, i) => `Q${i+1} ${q.question_text}`), '來源頁面','UTM Source','UTM Medium','UTM Campaign','填寫時間','測試資料']
    const rows = filtered.map(l => [
      ...ldKeys.map(k => (l.lead_data || {})[k] || ''),
      ...questions.map(q => l.answers?.[q.id] || ''),
      l.page_url || '', l.utm_source || '', l.utm_medium || '', l.utm_campaign || '',
      new Date(l.created_at).toLocaleString('zh-TW'), l.is_test ? '是' : '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `leads-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function toggleTestMode() {
    const sp = new URLSearchParams()
    if (!includeTest) sp.set('include_test', '1')
    const q = sp.toString()
    router.push(q ? `${pathname}?${q}` : pathname)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">
          顯示 <span className="font-semibold text-gray-300">{filtered.length}</span>
          {filtered.length !== responses.length && <> / {responses.length}</>} 筆
          {filters.length > 0 && <span className="ml-1 text-violet-400">（已篩選）</span>}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleTestMode}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${includeTest ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
            <FlaskConical size={13} />{includeTest ? '含測試資料' : '顯示測試資料'}
          </button>
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-700 px-3 text-xs text-gray-300 transition hover:bg-gray-800 disabled:opacity-40">
            <Download size={13} />匯出 CSV{filters.length > 0 && '（篩選後）'}
          </button>
        </div>
      </div>

      {/* Active filters */}
      {filters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
          <span className="text-xs font-semibold text-violet-400">篩選條件：</span>
          {filters.map((f, i) => (
            <button key={i} onClick={() => toggleFilter(f)}
              className="flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300 transition hover:bg-violet-500/20">
              {f.label}: {f.value} <X size={10} />
            </button>
          ))}
          <button onClick={() => setFilters([])} className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition">清除全部</button>
        </div>
      )}

      {/* AI Report CTA */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/60 to-indigo-950/60 px-5 py-4">
        <div>
          <p className="font-semibold text-gray-100">AI 數據分析報告</p>
          <p className="mt-0.5 text-xs text-gray-400">
            自動分析{filters.length > 0 ? '篩選後的' : '全部'} <span className="text-violet-300 font-medium">{filtered.length}</span> 筆名單，找出性別／年齡／收入的偏好差異與離群值
          </p>
        </div>
        <ReportButton responses={filtered} form={form} onShareReady={url => { setLatestShareUrl(url) }} />
      </div>

      {/* Share URL bar — shown after report is generated */}
      {latestShareUrl && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-950/40 px-4 py-3">
          <LinkIcon size={14} className="shrink-0 text-violet-400" />
          <span className="min-w-0 flex-1 truncate text-xs text-violet-300">{latestShareUrl}</span>
          <button
            onClick={copyShareUrl}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600/30 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-600/50 transition"
          >
            {shareCopied ? <Check size={12} /> : <Copy size={12} />}
            {shareCopied ? '已複製' : '複製連結'}
          </button>
          <a
            href={latestShareUrl}
            target="_blank"
            rel="noopener"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600/30 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-600/50 transition"
          >
            <ExternalLink size={12} />
            開啟
          </a>
        </div>
      )}

      {/* Report history */}
      <div className="mb-6">
        <ReportHistory formId={form.id} />
      </div>

      {/* Charts */}
      {(leadStats.length > 0 || qStats.some(q => q.total > 0)) && (
        <div className="mb-6">
          {leadStats.length > 0 && (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                名單統計
                <span className="ml-2 font-normal normal-case text-gray-600">點選區塊可篩選名單</span>
              </p>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {leadStats.map(stat => stat.isBar
                  ? <BarChart key={stat.key} title={stat.key} entries={stat.entries} total={stat.total}
                      isActive={v => isActive('lead', stat.key, v)}
                      onToggle={v => toggleFilter({ type: 'lead', key: stat.key, value: v, label: stat.key })} />
                  : <PieChartInteractive key={stat.key} title={stat.key}
                      data={stat.entries.map(([label, count]) => ({ label, count }))}
                      total={stat.total}
                      isActive={v => isActive('lead', stat.key, v)}
                      onToggle={v => toggleFilter({ type: 'lead', key: stat.key, value: v, label: stat.key })} />
                )}
              </div>
            </>
          )}
          {qStats.some(q => q.total > 0) && (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">作答統計</p>
              {/* Charts — 2-col grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {qStats.filter(q => q.total > 0).map(q => (
                  <PieChartInteractive key={q.id} title={q.title} data={q.data} total={q.total}
                    isActive={v => isActive('q', q.id, v)}
                    onToggle={v => toggleFilter({ type: 'q', key: q.id, value: v, label: q.title.slice(0, 10) })} />
                ))}
              </div>

              {/* 其他自填 — full-width, below charts */}
              {qStats.filter(q => q.total > 0 && q.otherAnswers.length > 0).map(q => (
                <div key={`${q.id}-other`} className="mt-3 rounded-xl border border-gray-600 bg-gray-800">
                  <button
                    onClick={() => setOtherExpanded(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700/50 transition rounded-xl"
                  >
                    <span>✏️ 其他自填回答（{q.otherAnswers.length} 筆）</span>
                    <ChevronRight size={14} className={`text-gray-300 transition-transform ${otherExpanded[q.id] ? 'rotate-90' : ''}`} />
                  </button>
                  {otherExpanded[q.id] && (
                    <div className="border-t border-gray-600 px-4 pb-4 pt-3 space-y-3">
                      <div className="rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">題目</p>
                        <p className="text-sm font-medium text-white">{q.questionText}</p>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">原有選項</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{q.options.join('　/　')}</p>
                      </div>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {q.otherAnswers.map((a, idx) => (
                          <li key={idx} className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white leading-snug">「{a}」</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 py-16 text-center text-gray-500">
          <p className="mb-2 text-3xl">👤</p>
          <p>{responses.length > 0 ? '沒有符合篩選條件的名單' : '還沒有名單'}</p>
          {filters.length > 0 && <button onClick={() => setFilters([])} className="mt-3 text-xs text-violet-400 hover:underline">清除篩選條件</button>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">聯絡資訊</th>
                {questions.length > 0 && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">作答摘要</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">來源</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">時間</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => {
                const ld = lead.lead_data || {}
                const primary = ld.email || ld['Email'] || lead.contact_email || ld.name || ld['姓名'] || ''
                const secondary = ld.name || ld['姓名'] || ''
                const q1ans = questions[0] ? lead.answers?.[questions[0].id] : null
                const answeredCount = questions.filter(q => lead.answers?.[q.id]).length
                const isSel = selected?.id === lead.id
                return (
                  <tr key={lead.id} onClick={() => setSelected(isSel ? null : lead)}
                    className={`cursor-pointer border-b border-gray-800 transition ${isSel ? 'bg-violet-950/30' : i % 2 === 0 ? 'bg-gray-950 hover:bg-gray-900' : 'bg-gray-900/50 hover:bg-gray-900'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-900/50 text-xs font-semibold text-violet-300">
                          {(primary?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-200">{primary || <span className="text-gray-600">—</span>}</p>
                          {secondary && secondary !== primary && <p className="truncate text-xs text-gray-500">{secondary}</p>}
                        </div>
                        {lead.is_test && <span className="shrink-0 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] text-orange-400">測試</span>}
                      </div>
                    </td>
                    {questions.length > 0 && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {q1ans ? <span className="max-w-[160px] truncate rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{q1ans}</span>
                                 : <span className="text-xs text-gray-600">未作答</span>}
                          {answeredCount > 1 && <span className="text-xs text-gray-600">+{answeredCount - 1}</span>}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {lead.utm_source ? <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-400">{lead.utm_source}</span>
                                       : <span className="text-gray-600">Direct</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-2 py-3">
                      <ChevronRight size={14} className={`text-gray-600 transition-transform ${isSel ? 'rotate-90 text-violet-400' : ''}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="fixed inset-0 z-40 bg-black/50" onClick={() => setSelected(null)} />
            <motion.div key="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-800 bg-gray-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
                <div>
                  <p className="font-semibold text-gray-100">作答詳情</p>
                  <p className="text-xs text-gray-500">{new Date(selected.created_at).toLocaleString('zh-TW')}</p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-200 transition"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {selected.is_test && <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs text-orange-400">此筆為測試資料</div>}
                <section>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">聯絡資訊</p>
                  <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
                    {Object.entries(selected.lead_data || {}).length > 0
                      ? Object.entries(selected.lead_data || {}).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-3 px-4 py-2.5">
                            <span className="text-xs text-gray-500 shrink-0">{k}</span>
                            <span className="text-xs text-right text-gray-200 break-all">{v || '—'}</span>
                          </div>
                        ))
                      : <div className="px-4 py-3 text-xs text-gray-600">無聯絡資訊</div>}
                  </div>
                </section>
                {questions.length > 0 && (
                  <section>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">作答內容</p>
                    <div className="flex flex-col gap-2">
                      {questions.map((q, i) => {
                        const ans = selected.answers?.[q.id]
                        return (
                          <div key={q.id} className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
                            <p className="mb-1.5 text-xs text-gray-500">Q{i+1}｜{q.question_text}</p>
                            {ans ? <span className="rounded-full bg-violet-900/40 px-3 py-1 text-xs font-medium text-violet-300">{ans}</span>
                                 : <span className="text-xs text-gray-600">未作答</span>}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}
                <section>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">追蹤資訊</p>
                  <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
                    {[
                      { label: 'UTM Source', value: selected.utm_source },
                      { label: 'UTM Medium', value: selected.utm_medium },
                      { label: 'UTM Campaign', value: selected.utm_campaign },
                      { label: '來源頁面', value: selected.page_url },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <span className="text-xs text-gray-500 shrink-0">{label}</span>
                        {value
                          ? label === '來源頁面'
                            ? <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:underline break-all text-right"><LinkIcon size={10} className="shrink-0" />{value}</a>
                            : <span className="text-xs text-right text-gray-200 break-all">{value}</span>
                          : <span className="text-xs text-gray-600">—</span>}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Interactive Pie Chart ─────────────────────────────────────────────────
function PieChartInteractive({ title, data, total, isActive, onToggle }: {
  title: string
  data: { label: string; count: number }[]
  total: number
  isActive: (v: string) => boolean
  onToggle: (v: string) => void
}) {
  const anyActive = data.some(d => isActive(d.label))
  let angle = 0
  const slices = data.map((d, i) => {
    const deg = total > 0 ? (d.count / total) * 360 : 0
    const s = { ...d, startAngle: angle, endAngle: angle + deg, color: COLORS[i % COLORS.length] }
    angle += deg
    return s
  })
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="mb-3 text-xs font-semibold text-gray-300 leading-snug" title={title}>{title}</p>
      <div className="flex items-start gap-4">
        <svg viewBox="0 0 100 100" width={88} height={88} className="shrink-0">
          {slices.map((s, i) => {
            const active = isActive(s.label)
            const dim = anyActive && !active
            return (
              <path key={i} d={arc(50,50,46,s.startAngle,s.endAngle)}
                fill={s.color} stroke="#111827" strokeWidth="1.5"
                opacity={dim ? 0.2 : 1}
                style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                onClick={() => onToggle(s.label)} />
            )
          })}
          {anyActive && <circle cx="50" cy="50" r="20" fill="#111827" />}
        </svg>
        <ul className="flex flex-col gap-1.5 min-w-0 flex-1">
          {slices.map((s, i) => {
            const active = isActive(s.label)
            const dim = anyActive && !active
            return (
              <li key={i} onClick={() => onToggle(s.label)}
                className={`flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-0.5 text-xs transition hover:bg-white/5 ${active ? 'bg-white/5 ring-1 ring-inset ring-white/10' : ''} ${dim ? 'opacity-35' : ''}`}>
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
                <span className="min-w-0 flex-1 text-gray-300 leading-tight break-words">{s.label}</span>
                <span className="shrink-0 tabular-nums text-gray-500">
                  {s.count} <span className="text-gray-600">({total > 0 ? ((s.count/total)*100).toFixed(0) : 0}%)</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// ── Horizontal Bar Chart ──────────────────────────────────────────────────
function BarChart({ title, entries, total, isActive, onToggle }: {
  title: string
  entries: [string, number][]
  total: number
  isActive: (v: string) => boolean
  onToggle: (v: string) => void
}) {
  const max = Math.max(...entries.map(([, n]) => n), 1)
  const anyActive = entries.some(([v]) => isActive(v))
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="mb-3 text-xs font-semibold text-gray-300 leading-snug">{title}</p>
      <div className="flex flex-col gap-2">
        {entries.map(([label, count], i) => {
          const active = isActive(label)
          const dim = anyActive && !active
          const color = COLORS[i % COLORS.length]
          return (
            <div key={label} onClick={() => onToggle(label)}
              className={`cursor-pointer rounded-md px-2 py-1.5 transition hover:bg-white/5 ${active ? 'bg-white/5 ring-1 ring-violet-500/40' : ''} ${dim ? 'opacity-35' : ''}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-300 truncate">{label}</span>
                <span className="shrink-0 text-xs tabular-nums text-gray-500">
                  {count} <span className="text-gray-600">({total > 0 ? ((count/total)*100).toFixed(0) : 0}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(count / max) * 100}%`, background: active ? color : `${color}99` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
