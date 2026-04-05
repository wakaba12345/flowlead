'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save } from 'lucide-react'

interface Props {
  promptId?: string
  initialText: string
}

export default function PromptEditor({ promptId, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!promptId) return
    setSaving(true)
    await fetch('/api/system-prompts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promptId, prompt_text: text }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="min-h-[320px] w-full resize-y rounded-xl border border-gray-700 bg-gray-950 p-4 font-mono text-xs text-gray-300 outline-none focus:border-violet-500 transition-colors"
        spellCheck={false}
      />
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || text === initialText}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          <Save size={13} />
          {saving ? '儲存中...' : saved ? '已儲存 ✓' : '儲存 Prompt'}
        </button>
      </div>
    </div>
  )
}
