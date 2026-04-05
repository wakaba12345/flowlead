'use client'

import { useState } from 'react'
import { Code, Check } from 'lucide-react'

export default function EmbedCodeButton({ formId }: { formId: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const code = `<div id="flowlead-${formId}"></div>\n<script src="${window.location.origin}/embed.js" data-form-id="${formId}" async></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      title="複製嵌入碼"
      className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-gray-800"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Code size={12} />}
      {copied ? '已複製' : '嵌入碼'}
    </button>
  )
}
