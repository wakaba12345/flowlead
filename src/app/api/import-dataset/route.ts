import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

const TENANT_SLUG = 'storm_media'

async function getTenantId() {
  const { data } = await supabaseAdmin.from('tenants').select('id').eq('slug', TENANT_SLUG).single()
  return data?.id as string | undefined
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, leadColumns, questionColumns, rows } = await req.json()
  // leadColumns: { csvHeader: string; fieldId: string; fieldLabel: string }[]
  // questionColumns: { csvHeader: string; questionText: string }[]
  // rows: Record<string, string>[]

  if (!title || !rows?.length) {
    return NextResponse.json({ error: 'Missing title or rows' }, { status: 400 })
  }

  const tenantId = await getTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 500 })

  // Build form schema from column mapping
  const questions = questionColumns.map((q: { csvHeader: string; questionText: string }, i: number) => ({
    id: `q${i + 1}`,
    type: 'single_choice' as const,
    question_text: q.questionText,
    options: Array.from(new Set(
      rows.map((r: Record<string, string>) => r[q.csvHeader]).filter(Boolean)
    )).slice(0, 20) as string[],
  }))

  const leadFields = leadColumns.map((l: { csvHeader: string; fieldId: string; fieldLabel: string }) => ({
    id: l.fieldId,
    label: l.fieldLabel,
    type: 'text' as const,
    required: false,
  }))

  const schema = {
    form_title: title,
    questions,
    lead_capture: { title: '', description: '', fields: leadFields, button_text: '送出' },
  }

  // Create form
  const { data: form, error: formErr } = await supabaseAdmin
    .from('forms')
    .insert({ tenant_id: tenantId, title, schema, lead_capture: schema.lead_capture, theme: {}, status: 'inactive' })
    .select()
    .single()

  if (formErr || !form) return NextResponse.json({ error: formErr?.message || 'Failed to create form' }, { status: 500 })

  // Build question id map: csvHeader → questionId
  const qIdMap: Record<string, string> = {}
  questionColumns.forEach((q: { csvHeader: string }, i: number) => { qIdMap[q.csvHeader] = `q${i + 1}` })

  // Bulk insert responses (batches of 100)
  const records = rows.map((row: Record<string, string>) => {
    const lead_data: Record<string, string> = {}
    const answers: Record<string, string> = {}
    for (const [header, value] of Object.entries(row)) {
      if (!value) continue
      const lc = leadColumns.find((l: { csvHeader: string }) => l.csvHeader === header)
      if (lc) lead_data[lc.fieldId] = value
      else if (qIdMap[header]) answers[qIdMap[header]] = value
    }
    return {
      form_id: form.id,
      tenant_id: tenantId,
      answers,
      lead_data,
      contact_email: lead_data['email'] || lead_data['Email'] || null,
      contact_phone: lead_data['phone'] || lead_data['電話'] || null,
      completed: true,
      is_test: false,
    }
  })

  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const { error } = await supabaseAdmin.from('responses').insert(records.slice(i, i + BATCH))
    if (!error) inserted += Math.min(BATCH, records.length - i)
  }

  return NextResponse.json({ form_id: form.id, inserted })
}
