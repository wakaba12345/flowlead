'use client'

import { useState, useEffect, useRef } from 'react'
import { Shuffle, Users, RotateCcw, Download, Trophy } from 'lucide-react'
import type { Form, Response } from '@/types'

interface Props {
  forms: Form[]
}

function getPrimary(r: Response): string {
  const ld = r.lead_data || {}
  return ld['姓名'] || ld['name'] || ld['Email'] || ld['email'] || r.contact_email || '匿名'
}

function getContact(r: Response): string {
  const ld = r.lead_data || {}
  const email = ld['Email'] || ld['email'] || r.contact_email
  const phone = ld['電話'] || ld['phone'] || r.contact_phone
  return email || phone || ''
}

const RANK_STYLE = [
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-gray-400/15 text-gray-300 border-gray-500/30',
  'bg-orange-700/20 text-orange-400 border-orange-600/30',
]
const RANK_EMOJI = ['🥇', '🥈', '🥉']

export default function LotteryDraw({ forms }: Props) {
  const [formId, setFormId]         = useState('')
  const [count, setCount]           = useState(3)
  const [responses, setResponses]   = useState<Response[]>([])
  const [loading, setLoading]       = useState(false)
  const [drawing, setDrawing]       = useState(false)
  const [winners, setWinners]       = useState<Response[]>([])
  const [drawn, setDrawn]           = useState(false)
  const [cyclingName, setCyclingName] = useState('')
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clean up interval on unmount
  useEffect(() => () => { if (cycleRef.current) clearInterval(cycleRef.current) }, [])

  async function loadResponses(fid: string) {
    setLoading(true)
    setWinners([])
    setDrawn(false)
    try {
      const res = await fetch(`/api/responses?form_id=${fid}&no_limit=1`)
      const data: Response[] = await res.json()
      setResponses(Array.isArray(data) ? data : [])
    } catch {
      setResponses([])
    }
    setLoading(false)
  }

  function handleFormChange(fid: string) {
    setFormId(fid)
    setWinners([])
    setDrawn(false)
    setResponses([])
    if (fid) loadResponses(fid)
  }

  async function draw() {
    if (drawing || responses.length === 0) return
    setDrawing(true)
    setDrawn(false)
    setWinners([])

    // Cycle names rapidly
    cycleRef.current = setInterval(() => {
      const r = responses[Math.floor(Math.random() * responses.length)]
      setCyclingName(getPrimary(r))
    }, 60)

    await new Promise(res => setTimeout(res, 2600))

    if (cycleRef.current) clearInterval(cycleRef.current)

    // Fisher-Yates shuffle → take first N
    const pool = [...responses]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const selected = pool.slice(0, Math.min(count, pool.length))

    setCyclingName('')
    setWinners(selected)
    setDrawing(false)
    setDrawn(true)
  }

  function reset() {
    setWinners([])
    setDrawn(false)
  }

  function exportWinners() {
    if (!winners.length) return
    const ldKeys = Array.from(new Set(winners.flatMap(w => Object.keys(w.lead_data || {}))))
    const headers = ['名次', ...ldKeys, '填寫時間']
    const rows = winners.map((w, i) => [
      `第 ${i + 1} 名`,
      ...ldKeys.map(k => (w.lead_data || {})[k] || ''),
      new Date(w.created_at).toLocaleString('zh-TW'),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `抽獎結果-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const effectiveCount = Math.min(count, responses.length)

  return (
    <div className="space-y-6">
      {/* ── Settings card ── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Form selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-400">選擇表單</label>
            <select
              value={formId}
              onChange={e => handleFormChange(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">— 請選擇表單 —</option>
              {forms.map(f => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>
          </div>

          {/* Count input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-400">抽出人數</label>
            <input
              type="number"
              min={1}
              max={responses.length || 999}
              value={count}
              onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        {/* Response count info */}
        {formId && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Users size={14} />
            {loading
              ? '載入名單中...'
              : <>{responses.length} 筆有效名單
                  {count > responses.length && responses.length > 0 && (
                    <span className="ml-2 text-amber-400">（最多可抽 {responses.length} 人）</span>
                  )}
                </>
            }
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={draw}
            disabled={!formId || loading || drawing || responses.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40"
          >
            <Shuffle size={15} />
            {drawing ? '抽獎中...' : drawn ? '再抽一次' : '開始抽獎'}
          </button>

          {drawn && (
            <>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-gray-800"
              >
                <RotateCcw size={13} /> 重置
              </button>
              <button
                onClick={exportWinners}
                className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-gray-800"
              >
                <Download size={13} /> 匯出名單
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Drawing animation ── */}
      {drawing && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 py-12 text-center">
          <div className="mb-3 text-5xl">🎰</div>
          <p className="mb-3 text-xs text-gray-500">正在從 {responses.length} 筆名單中抽出 {effectiveCount} 位...</p>
          <p className="min-h-[40px] animate-pulse text-2xl font-bold tracking-wide text-violet-300">
            {cyclingName}
          </p>
        </div>
      )}

      {/* ── Winners ── */}
      {drawn && winners.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={15} className="text-amber-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              得獎名單 · {winners.length} 位得獎者
            </p>
          </div>

          <div className="space-y-3">
            {winners.map((w, i) => {
              const primary   = getPrimary(w)
              const contact   = getContact(w)
              const ld        = w.lead_data || {}
              const extraTags = Object.entries(ld)
                .filter(([k]) => !['姓名', 'name', 'Email', 'email', '電話', 'phone'].includes(k))
                .slice(0, 4)

              return (
                <div
                  key={w.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4"
                >
                  {/* Rank badge */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    i < 3 ? RANK_STYLE[i] : 'border-violet-500/20 bg-violet-900/20 text-violet-300'
                  }`}>
                    {i < 3 ? RANK_EMOJI[i] : i + 1}
                  </div>

                  {/* Name + contact */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-100">{primary}</p>
                    {contact && (
                      <p className="mt-0.5 text-xs text-gray-500">{contact}</p>
                    )}
                  </div>

                  {/* Extra tags */}
                  {extraTags.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {extraTags.map(([k, v]) => (
                        <span key={k} className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
