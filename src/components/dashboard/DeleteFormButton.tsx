'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeleteFormButton({ formId }: { formId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function doDelete() {
    setDeleting(true)
    await fetch(`/api/forms/${formId}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1.5" onClick={e => e.preventDefault()}>
        <span className="text-xs text-gray-400">確定刪除？</span>
        <button
          onClick={doDelete}
          disabled={deleting}
          className="flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition"
        >
          {deleting ? <Loader2 size={11} className="animate-spin" /> : '確定'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-800 transition"
        >
          取消
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={e => { e.preventDefault(); setConfirming(true) }}
      className="shrink-0 rounded-md p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition"
      title="刪除名單"
    >
      <Trash2 size={15} />
    </button>
  )
}
