'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Response, Form, FormSchema } from '@/types'
import { Download, FlaskConical, Search, X, ChevronRight, Link as LinkIcon } from 'lucide-react'

interface Props {
  leads: Response[]
  forms: Form[]
  schema?: FormSchema
  selectedFormId?: string
  includeTest?: boolean
  singleForm?: boolean
}

export default function LeadsTable({ leads, forms, schema, selectedFormId, includeTest, singleForm }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<Response | null>(null)

  const questions = schema?.questions || []

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (!singleForm && params.form_id) sp.set('form_id', params.form_id)
    if (params.include_test) sp.set('include_test', params.include_test)
    const q = sp.toString()
    return q ? `${pathname}?${q}` : pathname
  }

  function selectForm(formId: string | undefined) {
    router.push(buildUrl({ form_id: formId, include_test: includeTest ? '1' : undefined }))
    setSearchQuery('')
  }

  function exportCSV() {
    const leadDataKeys = Array.from(new Set(leads.flatMap(l => Object.keys(l.lead_data || {}))))
    const headers = [
      ...leadDataKeys,
      ...questions.map((q, i) => `Q${i + 1} ${q.question_text}`),
      ...(questions.length === 0 ? ['作答內容'] : []),
      '來源頁面', 'UTM Source', 'UTM Medium', 'UTM Campaign', '填寫時間', '測試資料',
    ]
    const rows = leads.map(l => [
      ...leadDataKeys.map(k => (l.lead_data || {})[k] || ''),
      ...questions.map(q => l.answers?.[q.id] || ''),
      ...(questions.length === 0 ? [JSON.stringify(l.answers || {})] : []),
      l.page_url || '', l.utm_source || '', l.utm_medium || '', l.utm_campaign || '',
      new Date(l.created_at).toLocaleString('zh-TW'),
      l.is_test ? '是' : '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `flowlead-leads-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filteredForms = searchQuery.trim()
    ? forms.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : forms
  const selectedForm = forms.find(f => f.id === selectedFormId)
  const showSearch = forms.length > 5

  return (
    <div className="relative">
      {/* ── Filter bar (multi-form mode) ── */}
      {!singleForm && (
        <div className="mb-5 rounded-xl border border-gray-800 bg-gray-900/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {showSearch && (
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="搜尋表單..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 w-44 rounded-lg border border-gray-700 bg-gray-800 pl-7 pr-7 text-xs text-gray-300 outline-none placeholder:text-gray-600 focus:border-violet-500" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"><X size={11} /></button>
                )}
              </div>
            )}
            {showSearch && filteredForms.length > 0 && <div className="h-5 w-px bg-gray-700" />}
            {!searchQuery && (
              <button onClick={() => selectForm(undefined)}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${!selectedFormId ? 'bg-violet-600 text-white' : 'border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}>
                全部
                <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${!selectedFormId ? 'bg-violet-500 text-white' : 'bg-gray-700 text-gray-400'}`}>{forms.length}</span>
              </button>
            )}
            {filteredForms.map(f => (
              <button key={f.id} onClick={() => selectForm(f.id)} title={f.title}
                className={`flex h-8 max-w-[180px] items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${selectedFormId === f.id ? 'bg-violet-600 text-white' : 'border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}>
                <span className="truncate">{f.title}</span>
                {selectedFormId === f.id && (
                  <X size={11} className="shrink-0 opacity-70" onClick={e => { e.stopPropagation(); selectForm(undefined) }} />
                )}
              </button>
            ))}
            {searchQuery && filteredForms.length === 0 && <span className="text-xs text-gray-600">找不到「{searchQuery}」</span>}
            <div className="ml-auto flex items-center gap-2">
              {selectedFormId && selectedForm && (
                <span className="hidden items-center gap-1 text-xs text-gray-500 sm:flex">
                  篩選：<span className="max-w-[120px] truncate font-medium text-violet-400">{selectedForm.title}</span>
                </span>
              )}
              <button onClick={() => router.push(buildUrl({ form_id: selectedFormId, include_test: includeTest ? undefined : '1' }))}
                className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${includeTest ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
                <FlaskConical size={13} />{includeTest ? '含測試' : '測試資料'}
              </button>
              <button onClick={exportCSV} disabled={leads.length === 0}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-700 px-3 text-xs text-gray-300 transition hover:bg-gray-800 disabled:opacity-40">
                <Download size={13} />匯出 CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Single-form toolbar ── */}
      {singleForm && (
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => router.push(buildUrl({ include_test: includeTest ? undefined : '1' }))}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${includeTest ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
            <FlaskConical size={13} />{includeTest ? '含測試資料' : '顯示測試資料'}
          </button>
          <span className="text-xs text-gray-600">{leads.length} 筆</span>
          <button onClick={exportCSV} disabled={leads.length === 0}
            className="ml-auto flex h-8 items-center gap-1.5 rounded-lg border border-gray-700 px-3 text-xs text-gray-300 transition hover:bg-gray-800 disabled:opacity-40">
            <Download size={13} />匯出 CSV
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 py-16 text-center text-gray-500">
          <p className="mb-2 text-3xl">👤</p><p>還沒有名單</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">聯絡資訊</th>
                {questions.length > 0 && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    作答摘要
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">來源</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">時間</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => {
                const ld = lead.lead_data || {}
                const primaryContact = ld.email || ld['email'] || lead.contact_email || ld.name || ld['姓名'] || ''
                const secondaryContact = ld.name || ld['姓名'] || (primaryContact !== ld.email ? '' : '')
                const q1Answer = questions[0] ? lead.answers?.[questions[0].id] : null
                const answeredCount = questions.filter(q => lead.answers?.[q.id]).length
                const isSelected = selected?.id === lead.id

                return (
                  <tr key={lead.id}
                    onClick={() => setSelected(isSelected ? null : lead)}
                    className={`cursor-pointer border-b border-gray-800 transition ${isSelected ? 'bg-violet-950/30' : i % 2 === 0 ? 'bg-gray-950 hover:bg-gray-900' : 'bg-gray-900/50 hover:bg-gray-900'}`}>
                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-900/50 text-xs font-semibold text-violet-300">
                          {(primaryContact?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-200">{primaryContact || <span className="text-gray-600">—</span>}</p>
                          {secondaryContact && secondaryContact !== primaryContact && (
                            <p className="truncate text-xs text-gray-500">{secondaryContact}</p>
                          )}
                        </div>
                        {lead.is_test && (
                          <span className="shrink-0 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] text-orange-400">測試</span>
                        )}
                      </div>
                    </td>
                    {/* Answer summary */}
                    {questions.length > 0 && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {q1Answer ? (
                            <span className="max-w-[160px] truncate rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{q1Answer}</span>
                          ) : (
                            <span className="text-xs text-gray-600">未作答</span>
                          )}
                          {answeredCount > 1 && (
                            <span className="text-xs text-gray-600">+{answeredCount - 1}</span>
                          )}
                        </div>
                      </td>
                    )}
                    {/* Source */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {lead.utm_source
                        ? <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-400">{lead.utm_source}</span>
                        : <span className="text-gray-600">Direct</span>}
                    </td>
                    {/* Time */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleString('zh-TW')}
                    </td>
                    {/* Expand indicator */}
                    <td className="px-2 py-3">
                      <ChevronRight size={14} className={`text-gray-600 transition-transform ${isSelected ? 'rotate-90 text-violet-400' : ''}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setSelected(null)}
            />
            {/* Panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-800 bg-gray-950 shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
                <div>
                  <p className="font-semibold text-gray-100">作答詳情</p>
                  <p className="text-xs text-gray-500">{new Date(selected.created_at).toLocaleString('zh-TW')}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-200 transition">
                  <X size={18} />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Test badge */}
                {selected.is_test && (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs text-orange-400">
                    此筆為測試資料
                  </div>
                )}

                {/* Contact info */}
                <section>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">聯絡資訊</p>
                  <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
                    {Object.entries(selected.lead_data || {}).length > 0
                      ? Object.entries(selected.lead_data || {}).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-3 px-4 py-2.5">
                            <span className="text-xs text-gray-500 shrink-0">{k}</span>
                            <span className="text-xs text-right text-gray-200 break-all">{v || <span className="text-gray-600">—</span>}</span>
                          </div>
                        ))
                      : <div className="px-4 py-3 text-xs text-gray-600">無聯絡資訊</div>
                    }
                  </div>
                </section>

                {/* Q&A */}
                {questions.length > 0 && (
                  <section>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">作答內容</p>
                    <div className="flex flex-col gap-2">
                      {questions.map((q, i) => {
                        const ans = selected.answers?.[q.id]
                        return (
                          <div key={q.id} className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
                            <p className="mb-1.5 text-xs text-gray-500">Q{i + 1}｜{q.question_text}</p>
                            {ans
                              ? <span className="rounded-full bg-violet-900/40 px-3 py-1 text-xs font-medium text-violet-300">{ans}</span>
                              : <span className="text-xs text-gray-600">未作答</span>
                            }
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Tracking */}
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
                            ? <a href={value} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-400 hover:underline break-all text-right">
                                <LinkIcon size={10} className="shrink-0" />{value}
                              </a>
                            : <span className="text-xs text-right text-gray-200 break-all">{value}</span>
                          : <span className="text-xs text-gray-600">—</span>
                        }
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
