'use client'

import { useState, useEffect, useRef } from 'react'
import { Shuffle, Users, RotateCcw, Download, Trophy, Plus, Trash2 } from 'lucide-react'
import type { Form, Response } from '@/types'

interface Prize {
  id: string
  name: string
  count: number
}

interface PrizeResult {
  prize: Prize
  winners: Response[]
}

interface Props {
  forms: Form[]
}

function getPrimary(r: Response): string {
  const ld = r.lead_data || {}
  return ld['姓名'] || ld['name'] || ld['Email'] || ld['email'] || r.contact_email || '匿名'
}

function getContact(r: Response): string {
  const ld = r.lead_data || {}
  return ld['Email'] || ld['email'] || r.contact_email || ld['電話'] || ld['phone'] || r.contact_phone || ''
}

const RANK_STYLE = [
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-gray-400/15 text-gray-300 border-gray-500/30',
  'bg-orange-700/20 text-orange-400 border-orange-600/30',
]

export default function LotteryDraw({ forms }: Props) {
  const [formId, setFormId]           = useState('')
  const [responses, setResponses]     = useState<Response[]>([])
  const [loading, setLoading]         = useState(false)
  const [drawing, setDrawing]         = useState(false)
  const [results, setResults]         = useState<PrizeResult[]>([])
  const [drawn, setDrawn]             = useState(false)
  const [cyclingName, setCyclingName] = useState('')
  const [currentPrizeName, setCurrentPrizeName] = useState('')
  const [prizes, setPrizes]           = useState<Prize[]>([
    { id: 'p1', name: '頭獎', count: 1 },
    { id: 'p2', name: '貳獎', count: 3 },
    { id: 'p3', name: '參獎', count: 5 },
  ])
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (cycleRef.current) clearInterval(cycleRef.current) }, [])

  async function loadResponses(fid: string) {
    setLoading(true)
    setResults([])
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
    setResults([])
    setDrawn(false)
    setResponses([])
    if (fid) loadResponses(fid)
  }

  function addPrize() {
    setPrizes(p => [...p, { id: `p${Date.now()}`, name: `獎項 ${p.length + 1}`, count: 1 }])
  }

  function updatePrize(id: string, patch: Partial<Prize>) {
    setPrizes(p => p.map(pr => pr.id === id ? { ...pr, ...patch } : pr))
  }

  function removePrize(id: string) {
    setPrizes(p => p.filter(pr => pr.id !== id))
  }

  async function draw() {
    if (drawing || responses.length === 0) return
    setDrawing(true)
    setDrawn(false)
    setResults([])

    // Fisher-Yates shuffle entire pool once
    const pool = [...responses]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    const allResults: PrizeResult[] = []
    let usedCount = 0

    for (const prize of prizes) {
      setCurrentPrizeName(prize.name)

      // Animate cycling names
      cycleRef.current = setInterval(() => {
        const r = responses[Math.floor(Math.random() * responses.length)]
        setCyclingName(getPrimary(r))
      }, 60)

      await new Promise(res => setTimeout(res, 1800))
      if (cycleRef.current) clearInterval(cycleRef.current)
      setCyclingName('')

      const take = Math.min(prize.count, pool.length - usedCount)
      const winners = pool.slice(usedCount, usedCount + take)
      usedCount += take
      allResults.push({ prize, winners })
    }

    setCurrentPrizeName('')
    setResults(allResults)
    setDrawing(false)
    setDrawn(true)
  }

  function reset() {
    setResults([])
    setDrawn(false)
  }

  function exportWinners() {
    if (!results.length) return
    const allWinners = results.flatMap(r => r.winners.map(w => ({ prize: r.prize.name, ...w })))
    const ldKeys = Array.from(new Set(allWinners.flatMap(w => Object.keys(w.lead_data || {}))))
    const headers = ['獎項', '姓名/Email', ...ldKeys, '填寫時間']
    const rows = allWinners.map(w => [
      w.prize,
      getPrimary(w),
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

  const totalNeeded = prizes.reduce((s, p) => s + p.count, 0)

  return (
    <div className="space-y-6">
      {/* ── Settings ── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-5">

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
          {formId && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
              <Users size={13} />
              {loading ? '載入名單中...' : `${responses.length} 筆有效名單`}
              {!loading && totalNeeded > responses.length && responses.length > 0 && (
                <span className="text-amber-400 text-xs">（名單不足，共可抽 {responses.length} 人）</span>
              )}
            </p>
          )}
        </div>

        {/* Prize tiers */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-400">獎項設定</label>
            <button onClick={addPrize}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition">
              <Plus size={12} /> 新增獎項
            </button>
          </div>
          <div className="space-y-2">
            {prizes.map((prize, idx) => (
              <div key={prize.id} className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-gray-600 w-4">{idx + 1}.</span>
                <input
                  type="text"
                  value={prize.name}
                  onChange={e => updatePrize(prize.id, { name: e.target.value })}
                  placeholder="獎項名稱"
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-violet-500"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-gray-500">抽</span>
                  <input
                    type="number"
                    min={1}
                    value={prize.count}
                    onChange={e => updatePrize(prize.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-16 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-violet-500 text-center"
                  />
                  <span className="text-xs text-gray-500">人</span>
                </div>
                <button onClick={() => removePrize(prize.id)} disabled={prizes.length <= 1}
                  className="shrink-0 text-gray-600 hover:text-red-400 disabled:opacity-30 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-600">共抽出 <span className="text-gray-400 font-medium">{totalNeeded}</span> 人</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
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
              <button onClick={reset}
                className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-gray-800">
                <RotateCcw size={13} /> 重置
              </button>
              <button onClick={exportWinners}
                className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-gray-800">
                <Download size={13} /> 匯出名單
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Animation ── */}
      {drawing && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 py-12 text-center">
          <div className="mb-3 text-5xl">🎰</div>
          <p className="mb-1 text-xs font-semibold text-violet-400 tracking-wider">{currentPrizeName}</p>
          <p className="mb-3 text-xs text-gray-500">正在從 {responses.length} 筆名單中抽出...</p>
          <p className="min-h-[40px] animate-pulse text-2xl font-bold tracking-wide text-violet-300">
            {cyclingName}
          </p>
        </div>
      )}

      {/* ── Results by prize tier ── */}
      {drawn && results.length > 0 && (
        <div className="space-y-6">
          {results.map(({ prize, winners }) => (
            <div key={prize.id}>
              <div className="mb-3 flex items-center gap-2">
                <Trophy size={15} className="text-amber-400" />
                <p className="text-sm font-semibold text-gray-200">{prize.name}</p>
                <span className="text-xs text-gray-500">· {winners.length} 位得獎者</span>
              </div>
              <div className="space-y-2">
                {winners.map((w, i) => {
                  const contact = getContact(w)
                  const ld = w.lead_data || {}
                  const extraTags = Object.entries(ld)
                    .filter(([k]) => !['姓名', 'name', 'Email', 'email', '電話', 'phone'].includes(k))
                    .slice(0, 4)

                  return (
                    <div key={w.id}
                      className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        i < 3 ? RANK_STYLE[i] : 'border-violet-500/20 bg-violet-900/20 text-violet-300'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-100">{getPrimary(w)}</p>
                        {contact && <p className="mt-0.5 text-xs text-gray-500">{contact}</p>}
                      </div>
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
          ))}
        </div>
      )}
    </div>
  )
}
