export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Form, Response } from '@/types'
import LeadsTable from '@/components/dashboard/LeadsTable'
import PieChart from '@/components/dashboard/PieChart'
import { ArrowLeft } from 'lucide-react'

async function getData(formId: string, includeTest: boolean) {
  const [formRes, responsesRes] = await Promise.all([
    supabaseAdmin.from('forms').select('*').eq('id', formId).single(),
    supabaseAdmin
      .from('responses')
      .select('*')
      .eq('form_id', formId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  if (formRes.error || !formRes.data) return null

  const form = formRes.data as Form
  let responses = (responsesRes.data || []) as Response[]
  if (!includeTest) responses = responses.filter(r => !r.is_test)

  return { form, responses }
}

export default async function FormLeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>
  searchParams: Promise<{ include_test?: string }>
}) {
  const { formId } = await params
  const { include_test } = await searchParams
  const includeTest = include_test === '1'

  const result = await getData(formId, includeTest)
  if (!result) notFound()

  const { form, responses } = result
  const questions = form.schema?.questions || []

  // Build answer stats per question
  const stats = questions.map(q => {
    const counts: Record<string, number> = {}
    for (const r of responses) {
      const ans = r.answers?.[q.id]
      if (ans) counts[ans] = (counts[ans] || 0) + 1
    }
    const total = Object.values(counts).reduce((s, n) => s + n, 0)
    return {
      questionText: q.question_text,
      total,
      data: q.options.map(o => ({ label: o, count: counts[o] || 0 })),
    }
  })

  const now = new Date()
  const isExpired = form.ends_at ? new Date(form.ends_at) < now : false
  const realCount = responses.filter(r => !r.is_test).length
  const testCount = responses.filter(r => r.is_test).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/leads" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition mb-3">
          <ArrowLeft size={13} /> 所有表單
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{form.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-gray-400">
              <span>建立：{new Date(form.created_at).toLocaleDateString('zh-TW')}</span>
              {form.ends_at && (
                <span className={isExpired ? 'text-orange-400' : ''}>
                  結束：{new Date(form.ends_at).toLocaleDateString('zh-TW')}
                  {isExpired && ' (已到期)'}
                </span>
              )}
              {!form.ends_at && <span>永久開放</span>}
            </div>
          </div>
          <div className="flex shrink-0 gap-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-gray-100">{realCount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">有效名單</p>
            </div>
            {testCount > 0 && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-2 text-center">
                <p className="text-2xl font-bold text-orange-400">{testCount}</p>
                <p className="text-xs text-gray-500">測試筆數</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pie charts */}
      {stats.length > 0 && realCount > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">作答統計</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s, i) => (
              <PieChart key={i} title={`Q${i + 1}｜${s.questionText}`} data={s.data} total={s.total} />
            ))}
          </div>
        </div>
      )}

      {/* Response table */}
      <LeadsTable
        leads={responses}
        forms={[form]}
        schema={form.schema}
        includeTest={includeTest}
        singleForm
      />
    </div>
  )
}
