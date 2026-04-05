'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  formId: string
  variant?: 'button' | 'block'
}

export default function CopyTestEmbed({ formId, variant = 'button' }: Props) {
  const [copied, setCopied] = useState(false)

  function getCode() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `<div id="flowlead-${formId}"></div>\n<script src="${origin}/embed.js" data-form-id="${formId}" data-test="1" async></script>`
  }

  function copy() {
    navigator.clipboard.writeText(getCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (variant === 'block') {
    return (
      <div>
        <pre className="mb-2 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-400 whitespace-pre-wrap break-all">
          {getCode()}
        </pre>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700 transition"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? '已複製' : '複製測試嵌入碼'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? '已複製測試碼' : '複製測試嵌入碼'}
    </button>
  )
}
