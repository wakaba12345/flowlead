export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Form, Response } from '@/types'
import LeadsAnalytics from '@/components/dashboard/LeadsAnalytics'
import TrashBin from '@/components/dashboard/TrashBin'
import { ArrowLeft } from 'lucide-react'

async function getData(formId: string, includeTest: boolean) {
  const [formRes, responsesRes] = await Promise.all([
    supabaseAdmin.from('forms').select('*').eq('id', formId).single(),
    supabaseAdmin
      .from('responses')
      .select('*')
      .eq('form_id', formId)
      .eq('completed', true)
      .order('created_at', { ascending: false }),
  ])

  if (formRes.error || !formRes.data) return null

  const form = formRes.data as Form
  const allResponses = (responsesRes.data || []) as Response[]

  // Filter in app layer: deleted_at field may not exist yet in the table
  const active = allResponses.filter(r => !r.deleted_at)
  const deleted = allResponses.filter(r => !!r.deleted_at)

  let responses = active
  if (!includeTest) responses = responses.filter(r => !r.is_test)

  const deletedResponses = deleted

  return { form, responses, deletedResponses }
}

export default async function FormLeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>
  searchParams: Promise<{ include_test?: string; tab?: string }>
}) {
  const { formId } = await params
  const { include_test, tab } = await searchParams
  const includeTest = include_test === '1'
  const activeTab = tab === 'trash' ? 'trash' : 'main'

  const result = await getData(formId, includeTest)
  if (!result) notFound()

  const { form, responses, deletedResponses } = result

  const now = new Date()
  const isExpired = form.ends_at ? new Date(form.ends_at) < now : false
  const realCount = responses.filter(r => !r.is_test).length
  const testCount = responses.filter(r => r.is_test).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition mb-3"
        >
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
            {deletedResponses.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-center">
                <p className="text-2xl font-bold text-red-400">{deletedResponses.length}</p>
                <p className="text-xs text-gray-500">已刪除</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {deletedResponses.length > 0 && (
        <div className="mb-6 flex gap-2 border-b border-gray-800">
          <Link
            href={`/dashboard/leads/${formId}`}
            className={`px-4 py-3 text-sm font-medium transition ${activeTab === 'main' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            名單 ({responses.length})
          </Link>
          <Link
            href={`/dashboard/leads/${formId}?tab=trash`}
            className={`px-4 py-3 text-sm font-medium transition ${activeTab === 'trash' ? 'border-b-2 border-red-500 text-red-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            回收區 ({deletedResponses.length})
          </Link>
        </div>
      )}

      {/* Content */}
      {activeTab === 'main' ? (
        <LeadsAnalytics responses={responses} form={form} includeTest={includeTest} />
      ) : (
        <TrashBin deletedResponses={deletedResponses} form={form} />
      )}
    </div>
  )
}
