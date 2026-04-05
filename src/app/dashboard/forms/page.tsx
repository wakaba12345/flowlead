export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import type { Form } from '@/types'
import FormActions from '@/components/dashboard/FormActions'
import EmbedCodeButton from '@/components/dashboard/EmbedCodeButton'
import StatusToggle from '@/components/dashboard/StatusToggle'

async function getForms(): Promise<Form[]> {
  const { data } = await supabaseAdmin
    .from('forms')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
  return (data || []) as Form[]
}

function EndDateBadge({ endsAt }: { endsAt: string | null }) {
  if (!endsAt) return <span className="text-xs text-gray-600">永久</span>

  const end = new Date(endsAt)
  const now = new Date()
  const expired = end < now
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000)

  if (expired) return (
    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">已結束</span>
  )
  if (daysLeft <= 3) return (
    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">剩 {daysLeft} 天</span>
  )
  return (
    <span className="text-xs text-gray-500">{end.toLocaleDateString('zh-TW')} 止</span>
  )
}

export default async function FormsPage() {
  const forms = await getForms()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">表單管理</h1>
          <p className="mt-1 text-sm text-gray-400">{forms.length} 個表單</p>
        </div>
        <Link href="/dashboard/forms/new"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500">
          + 新增表單
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 py-16 text-center text-gray-500">
          <p className="mb-4 text-4xl">📋</p>
          <p>還沒有表單，點擊右上角新增</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {forms.map(form => (
            <div key={form.id}
              className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">

              {/* Toggle */}
              <StatusToggle formId={form.id} currentStatus={form.status} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{form.title}</p>
                  <EndDateBadge endsAt={form.ends_at} />
                </div>
                <p className="mt-0.5 text-xs text-gray-600">
                  {form.schema?.questions?.length || 0} 題 · 建立 {new Date(form.created_at).toLocaleDateString('zh-TW')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <EmbedCodeButton formId={form.id} />
                <Link href={`/dashboard/forms/${form.id}/preview`}
                  className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-400 transition hover:bg-orange-500/20">
                  預覽
                </Link>
                <Link href={`/dashboard/leads?form_id=${form.id}`}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-gray-800">
                  名單
                </Link>
                <Link href={`/dashboard/forms/${form.id}/edit`}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-gray-800">
                  編輯
                </Link>
                <FormActions formId={form.id} status={form.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
