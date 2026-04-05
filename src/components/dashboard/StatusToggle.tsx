'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  formId: string
  currentStatus: string
}

export default function StatusToggle({ formId, currentStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState(currentStatus === 'active')

  async function toggle() {
    const next = optimistic ? 'inactive' : 'active'
    setOptimistic(!optimistic)
    await fetch(`/api/forms/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    startTransition(() => router.refresh())
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={optimistic ? '點擊停用' : '點擊啟用'}
      className="shrink-0 transition-opacity disabled:opacity-50"
    >
      <div className={`relative h-6 w-11 rounded-full transition-colors ${optimistic ? 'bg-green-500' : 'bg-gray-700'}`}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${optimistic ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  )
}
