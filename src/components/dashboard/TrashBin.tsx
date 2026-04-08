'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, RotateCcw, Trash } from 'lucide-react'
import type { Response, Form } from '@/types'

interface Props {
  deletedResponses: Response[]
  form: Form
}

export default function TrashBin({ deletedResponses, form }: Props) {
  const router = useRouter()
  const [restoring, setRestoring] = useState<string | null>(null)
  const [permanently, setPermanently] = useState<string | null>(null)

  async function restoreResponse(id: string) {
    setRestoring(id)
    try {
      const res = await fetch('/api/responses/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) router.refresh()
    } catch (e) {
      console.error('恢復失敗', e)
    } finally {
      setRestoring(null)
    }
  }

  async function permanentlyDelete(id: string) {
    if (!confirm('確定要永久刪除此筆？此操作無法復原')) return
    setPermanently(id)
    try {
      const res = await fetch('/api/responses/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) router.refresh()
    } catch (e) {
      console.error('永久刪除失敗', e)
    } finally {
      setPermanently(null)
    }
  }

  if (deletedResponses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 py-16 text-center text-gray-500">
        <p className="mb-2 text-3xl">🗑️</p>
        <p>回收區為空</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        已刪除名單 <span className="text-gray-400 font-normal">({deletedResponses.length} 筆)</span>
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">聯絡資訊</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">刪除時間</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {deletedResponses.map((item, i) => {
              const ld = item.lead_data || {}
              const primary = ld.email || ld['Email'] || item.contact_email || ld.name || ld['姓名'] || '—'
              return (
                <tr key={item.id} className={`border-b border-gray-800 transition ${i % 2 === 0 ? 'bg-gray-950 hover:bg-gray-900' : 'bg-gray-900/50 hover:bg-gray-900'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-gray-500">
                        {(primary?.[0] || '?').toUpperCase()}
                      </div>
                      <p className="text-sm text-gray-300">{primary}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {item.deleted_at ? new Date(item.deleted_at).toLocaleString('zh-TW') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => restoreResponse(item.id)}
                        disabled={restoring === item.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 transition"
                      >
                        <RotateCcw size={12} />
                        恢復
                      </button>
                      <button
                        onClick={() => permanentlyDelete(item.id)}
                        disabled={permanently === item.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition"
                      >
                        <Trash size={12} />
                        永久刪除
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
