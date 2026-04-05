'use client'

import { useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import FlowLeadWidget from '@/components/widget/FlowLeadWidget'
import type { FormSchema } from '@/types'

interface Props {
  formId: string
  schema: FormSchema
  theme: Record<string, string>
}

export default function WidgetPreviewPane({ formId, schema, theme }: Props) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-400">
            ● 測試模式
          </span>
          <span className="text-xs text-gray-500">填寫後標記為測試資料</span>
        </div>
        {/* Device toggle */}
        <div className="flex items-center overflow-hidden rounded-lg border border-gray-700">
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              device === 'desktop'
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
            }`}
          >
            <Monitor size={13} /> 桌機
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              device === 'mobile'
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
            }`}
          >
            <Smartphone size={13} /> 手機
          </button>
        </div>
      </div>

      {device === 'desktop' ? (
        /* ── Desktop mock browser ── */
        <div className="rounded-xl border border-gray-700/60 bg-gray-950 p-5">
          {/* Browser chrome */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="mx-auto w-full max-w-xs rounded bg-gray-800 px-3 py-1 text-center text-[10px] text-gray-600">
              yourwebsite.com/landing
            </div>
          </div>
          {/* Mock page above */}
          <div className="mb-5 space-y-2 px-2 opacity-25">
            <div className="h-3 w-1/2 rounded bg-gray-700" />
            <div className="h-2 w-1/3 rounded bg-gray-700" />
          </div>
          {/* Widget */}
          <FlowLeadWidget formId={formId} schema={schema} theme={theme} isTest />
          {/* Mock page below */}
          <div className="mt-5 space-y-2 px-2 opacity-25">
            <div className="h-2 w-full rounded bg-gray-700" />
            <div className="h-2 w-4/5 rounded bg-gray-700" />
          </div>
        </div>
      ) : (
        /* ── Mobile phone frame ── */
        <div className="flex justify-center">
          <div className="w-[375px]">
            <div className="rounded-[36px] border-[6px] border-gray-600 bg-gray-950 shadow-2xl">
              {/* Status bar */}
              <div className="flex items-center justify-between px-6 py-2 text-[9px] text-gray-600">
                <span>9:41</span>
                <div className="h-4 w-20 rounded-full bg-gray-800" />
                <span>●●●</span>
              </div>
              {/* Browser bar */}
              <div className="mx-3 mb-2 rounded-lg bg-gray-800 px-3 py-1.5 text-center text-[10px] text-gray-500">
                yourwebsite.com
              </div>
              {/* Mock content */}
              <div className="mb-3 space-y-1.5 px-4 opacity-25">
                <div className="h-2.5 w-2/3 rounded bg-gray-700" />
                <div className="h-2 w-1/2 rounded bg-gray-700" />
              </div>
              {/* Widget iframe — real 375px window triggers mobile layout */}
              <div className="px-2">
                <iframe
                  src={`/embed/${formId}?test=1`}
                  width="100%"
                  height="420"
                  style={{ border: 'none', display: 'block', borderRadius: 8 }}
                  title="widget mobile preview"
                />
              </div>
              {/* Mock content */}
              <div className="mb-2 mt-3 space-y-1.5 px-4 opacity-25">
                <div className="h-2 w-full rounded bg-gray-700" />
                <div className="h-2 w-3/4 rounded bg-gray-700" />
              </div>
              {/* Home indicator */}
              <div className="flex justify-center py-3">
                <div className="h-1 w-24 rounded-full bg-gray-700" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
