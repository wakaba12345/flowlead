export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import type { Form } from '@/types'
import { ChevronRight, Users, CalendarDays, Clock } from 'lucide-react'

export default async function LeadsPage() {
  const formsRes = await supabaseAdmin
    .from('forms')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  const forms = (formsRes.data || []) as Form[]

  // Fetch exact counts per form in parallel (avoids the 1000-row default cap)
  const countResults = await Promise.all(
    forms.map(f =>
      supabaseAdmin
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', f.id)
        .eq('completed', true)
        .eq('is_test', false)
    )
  )

  const countMap: Record<string, number> = {}
  for (let i = 0; i < forms.length; i++) {
    countMap[forms[i].id] = countResults[i].count || 0
  }

  const totalLeads = Object.values(countMap).reduce((s, n) => s + n, 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">名單管理</h1>
          <p className="mt-1 text-sm text-gray-400">
            {forms.length} 個表單 · 共 {totalLeads} 筆名單
          </p>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 py-20 text-center text-gray-500">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          <p>還沒有任何表單</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {forms.map(form => {
            const count = countMap[form.id] || 0
            const now = new Date()
            const isExpired = form.ends_at ? new Date(form.ends_at) < now : false
            const statusLabel =
              form.status === 'active' && !isExpired ? { text: '上線中', cls: 'text-green-400 bg-green-400/10' }
              : isExpired ? { text: '已到期', cls: 'text-orange-400 bg-orange-400/10' }
              : { text: '已停用', cls: 'text-gray-400 bg-gray-700' }

            return (
              <Link
                key={form.id}
                href={`/dashboard/leads/${form.id}`}
                className="group flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 transition hover:border-violet-500/50 hover:bg-gray-800/60 active:scale-[0.99] active:bg-gray-800"
              >
                {/* Status dot */}
                <div className="shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusLabel.cls}`}>
                    {statusLabel.text}
                  </span>
                </div>

                {/* Title + dates */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-100 group-hover:text-violet-300 transition">
                    {form.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      建立 {new Date(form.created_at).toLocaleDateString('zh-TW')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {form.ends_at
                        ? `結束 ${new Date(form.ends_at).toLocaleDateString('zh-TW')}`
                        : '永久開放'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {form.schema?.questions?.length || 0} 題
                    </span>
                  </div>
                </div>

                {/* Response count */}
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-gray-100">{count.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">回答人數</p>
                </div>

                <ChevronRight size={18} className="shrink-0 text-gray-600 transition group-hover:translate-x-0.5 group-hover:text-violet-400" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
