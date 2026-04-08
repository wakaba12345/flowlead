import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

const TENANT_SLUG = 'storm_media'

async function getTenantId() {
  const { data } = await supabaseAdmin.from('tenants').select('id').eq('slug', TENANT_SLUG).single()
  return data?.id as string | undefined
}

// POST /api/import-dataset
// Step 1: create form from column mapping, return form_id
// Step 2 (rows=true): bulk insert responses for an existing form_id
export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // ── Step 2: bulk insert rows ──────────────────────────────────────────────
  if (body.form_id && body.rows) {
    const { form_id, tenant_id, leadColumns, questionColumns, rows } = body
    const qIdMap: Record<string, string> = {}
    questionColumns.forEach((q: { csvHeader: string; questionId: string }) => { qIdMap[q.csvHeader] = q.questionId })

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
        form_id, tenant_id,
        answers, lead_data,
        contact_email: lead_data['email'] || lead_data['Email'] || null,
        contact_phone: lead_data['phone'] || lead_data['電話'] || null,
        completed: true, is_test: false,
      }
    })

    const { error } = await supabaseAdmin.from('responses').insert(records)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ inserted: records.length })
  }

  // ── Step 1: create form ───────────────────────────────────────────────────
  const { title, leadColumns, questionColumns, sampleRows } = body
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  const tenantId = await getTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 500 })

  // Build unique options from sample rows only (avoid huge payload)
  const questions = questionColumns.map((q: { csvHeader: string; questionText: string; questionId: string }) => ({
    id: q.questionId,
    type: 'single_choice' as const,
    question_text: q.questionText,
    options: Array.from(new Set(
      (sampleRows || []).map((r: Record<string, string>) => r[q.csvHeader]).filter(Boolean)
    )).slice(0, 30) as string[],
  }))

  const leadFields = leadColumns.map((l: { csvHeader: string; fieldId: string; fieldLabel: string }) => ({
    id: l.fieldId, label: l.fieldLabel, type: 'text' as const, required: false,
  }))

  const schema = {
    form_title: title, questions,
    lead_capture: { title: '', description: '', fields: leadFields, button_text: '送出' },
  }

  const { data: form, error: formErr } = await supabaseAdmin
    .from('forms')
    .insert({ tenant_id: tenantId, title, schema, lead_capture: schema.lead_capture, theme: {}, status: 'inactive' })
    .select().single()

  if (formErr || !form) return NextResponse.json({ error: formErr?.message || 'Failed' }, { status: 500 })
  return NextResponse.json({ form_id: form.id, tenant_id: tenantId })
}
