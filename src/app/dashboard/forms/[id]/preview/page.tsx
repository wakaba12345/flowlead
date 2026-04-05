export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import CopyTestEmbed from '@/components/dashboard/CopyTestEmbed'
import WidgetPreviewPane from '@/components/dashboard/WidgetPreviewPane'

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: form, error } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !form) notFound()

  const questionCount = form.schema?.questions?.length ?? 0
  const fieldCount = form.schema?.lead_capture?.fields?.length ?? 1
  const layoutLabel: Record<string, string> = {
    default: '現代卡片',
    'luxury-dark': '極簡豪華深色',
    'luxury-light': '極簡豪華淺色',
    marketing: '行銷強效',
    minimal: '極簡專業',
    storm: '新聞媒體',
  }
  const layout = form.theme?.layout || 'default'

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/forms"
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            ← 返回表單列表
          </Link>
          <h1 className="mt-1 text-xl font-bold leading-tight">{form.title}</h1>
          <p className="mt-0.5 text-xs text-gray-500">預覽 · 測試模式</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/forms/${id}/edit`}
            className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-400 hover:bg-gray-800 transition"
          >
            <Pencil size={12} /> 編輯表單
          </Link>
          <CopyTestEmbed formId={form.id} />
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Widget preview — takes remaining space */}
        <div className="min-w-0 flex-1">
          <WidgetPreviewPane
            formId={form.id}
            schema={form.schema}
            theme={form.theme ?? {}}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full shrink-0 space-y-4 lg:w-64">

          {/* Form info */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">表單資訊</p>
            <div className="space-y-2.5">
              <InfoRow label="狀態">
                <span className={form.status === 'active' ? 'text-green-400' : 'text-gray-400'}>
                  {form.status === 'active' ? '● 上線中' : '○ 停用'}
                </span>
              </InfoRow>
              <InfoRow label="介面風格">
                <span className="text-gray-300">{layoutLabel[layout] ?? layout}</span>
              </InfoRow>
              <InfoRow label="題目數">
                <span className="text-gray-300">{questionCount} 題</span>
              </InfoRow>
              <InfoRow label="收集欄位">
                <span className="text-gray-300">{fieldCount} 個</span>
              </InfoRow>
              {form.ends_at && (
                <InfoRow label="結束日期">
                  <span className="text-gray-300">
                    {new Date(form.ends_at).toLocaleDateString('zh-TW')}
                  </span>
                </InfoRow>
              )}
            </div>
          </div>

          {/* Embed code */}
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="mb-1 text-xs font-semibold text-orange-400">測試嵌入碼</p>
            <p className="mb-3 text-xs text-gray-500">貼到任何頁面，填寫資料會標記為測試</p>
            <CopyTestEmbed formId={form.id} variant="block" />
          </div>

          {/* Tip */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="mb-1 text-xs font-semibold text-gray-400">📐 嵌入提示</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Widget 第一頁設計為 250px 高度，可直接嵌入文章中段或側欄。桌機顯示橫向佈局，手機自動切換直向。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-gray-500">{label}</span>
      {children}
    </div>
  )
}
