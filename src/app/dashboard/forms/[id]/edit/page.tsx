export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import FormEditor from '@/components/dashboard/FormEditor'
import { notFound } from 'next/navigation'
import type { Form } from '@/types'

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: form, error } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !form) notFound()

  return <FormEditor initialForm={form as Form} />
}
