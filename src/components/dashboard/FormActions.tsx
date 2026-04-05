'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2 } from 'lucide-react'

interface Props {
  formId: string
  status: string
}

export default function FormActions({ formId, status }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function archive() {
    if (!confirm('確定要刪除這個表單嗎？（名單資料不會刪除）')) return
    setLoading(true)
    setOpen(false)
    await fetch(`/api/forms/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="rounded-lg border border-gray-700 p-1.5 text-gray-400 transition hover:bg-gray-800 active:scale-95 active:bg-gray-700 disabled:opacity-50">
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-xl">
            <button onClick={archive}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 active:bg-gray-700">
              <Trash2 size={13} />刪除表單
            </button>
          </div>
        </>
      )}
    </div>
  )
}
