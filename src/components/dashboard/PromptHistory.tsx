'use client'

import { useEffect, useState } from 'react'
import { History, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export interface HistoryEntry {
  id: string
  text: string
  savedAt: string   // ISO string
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

function storageKey(promptKey: string) {
  return `prompt_history:${promptKey}`
}

export function loadHistory(promptKey: string): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(promptKey))
    if (!raw) return []
    const entries: HistoryEntry[] = JSON.parse(raw)
    // Auto-delete entries older than 1 year
    const cutoff = Date.now() - ONE_YEAR_MS
    return entries.filter(e => new Date(e.savedAt).getTime() > cutoff)
  } catch {
    return []
  }
}

export function saveToHistory(promptKey: string, text: string) {
  if (typeof window === 'undefined') return
  const entries = loadHistory(promptKey)
  const newEntry: HistoryEntry = {
    id: Date.now().toString(),
    text,
    savedAt: new Date().toISOString(),
  }
  // Deduplicate consecutive identical saves
  if (entries[0]?.text === text) return
  const updated = [newEntry, ...entries].slice(0, 50)  // keep max 50
  localStorage.setItem(storageKey(promptKey), JSON.stringify(updated))
}

interface Props {
  promptKey: string
  onRestore: (text: string) => void
}

export default function PromptHistory({ promptKey, onRestore }: Props) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (open) setEntries(loadHistory(promptKey))
  }, [open, promptKey])

  function deleteEntry(id: string) {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem(storageKey(promptKey), JSON.stringify(updated))
  }

  function clearAll() {
    localStorage.removeItem(storageKey(promptKey))
    setEntries([])
  }

  const count = typeof window !== 'undefined'
    ? (loadHistory(promptKey).length)
    : 0

  return (
    <div className="mt-4 rounded-xl border border-gray-800">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-gray-200 transition"
      >
        <span className="flex items-center gap-2">
          <History size={14} />
          歷史紀錄
          {count > 0 && (
            <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">{count} 筆</span>
          )}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="border-t border-gray-800 px-4 pb-4">
          {entries.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-600">尚無歷史紀錄</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between pt-3">
                <p className="text-xs text-gray-600">點擊還原可套用舊版 Prompt，超過一年的紀錄會自動刪除</p>
                <button onClick={clearAll} className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-400 transition">
                  <Trash2 size={11} /> 清除全部
                </button>
              </div>
              <div className="space-y-2">
                {entries.map(entry => (
                  <div key={entry.id} className="rounded-lg border border-gray-800 bg-gray-950">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-gray-500">
                        {new Date(entry.savedAt).toLocaleString('zh-TW', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                          className="text-xs text-gray-600 hover:text-gray-300 transition"
                        >
                          {expanded === entry.id ? '收起' : '預覽'}
                        </button>
                        <button
                          onClick={() => { onRestore(entry.text); setOpen(false) }}
                          className="flex items-center gap-1 rounded-md bg-violet-600/20 px-2 py-0.5 text-xs text-violet-400 hover:bg-violet-600/30 transition"
                        >
                          <RotateCcw size={10} /> 還原
                        </button>
                        <button onClick={() => deleteEntry(entry.id)} className="text-gray-700 hover:text-red-400 transition">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {expanded === entry.id && (
                      <pre className="max-h-48 overflow-y-auto border-t border-gray-800 px-3 py-2 font-mono text-[11px] text-gray-500 whitespace-pre-wrap">
                        {entry.text}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
