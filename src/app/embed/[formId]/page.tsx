export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import FlowLeadWidget from '@/components/widget/FlowLeadWidget'
import { notFound } from 'next/navigation'

export default async function EmbedPage({
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

  // Check if form has expired
  if (!isTest && form.ends_at && new Date(form.ends_at) < new Date()) notFound()

  return (
    <div className="p-2" style={{ background: 'transparent' }}>
      <FlowLeadWidget
        formId={form.id}
        schema={form.schema}
        theme={form.theme}
        isTest={isTest}
      />
    </div>
  )
}
