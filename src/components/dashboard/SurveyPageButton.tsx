'use client'

import { useState } from 'react'
import { ExternalLink, Check } from 'lucide-react'

export default function SurveyPageButton({ formId }: { formId: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const url = `${window.location.origin}/survey/${formId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      title="複製問卷頁面連結"
      className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-gray-800 active:scale-95 active:bg-gray-700"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <ExternalLink size={12} />}
      {copied ? '已複製' : '問卷頁面'}
    </button>
  )
}
