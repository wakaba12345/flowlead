export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import FlowLeadWidget from '@/components/widget/FlowLeadWidget'
import { notFound } from 'next/navigation'

export default async function SurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>
  searchParams: Promise<{ test?: string }>
}) {
  const { formId } = await params
  const { test } = await searchParams
  const isTest = test === '1' || test === 'true'

  const { data: form, error } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', formId)
    .in('status', isTest ? ['active', 'inactive'] : ['active'])
    .single()

  if (error || !form) notFound()

  if (!isTest && form.ends_at && new Date(form.ends_at) < new Date()) notFound()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <FlowLeadWidget
          formId={form.id}
          schema={form.schema}
          theme={form.theme}
          isTest={isTest}
        />
      </div>
    </div>
  )
}
