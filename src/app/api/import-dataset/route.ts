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
    const multiSet = new Set<string>()
    const openSet = new Set<string>()
    questionColumns.forEach((q: { csvHeader: string; questionId: string; isMulti?: boolean; isOpen?: boolean }) => {
      qIdMap[q.csvHeader] = q.questionId
      if (q.isMulti) multiSet.add(q.csvHeader)
      if (q.isOpen) openSet.add(q.csvHeader)
    })

    const records = rows.map((row: Record<string, string>) => {
      const lead_data: Record<string, string> = {}
      const answers: Record<string, string> = {}
      for (const [header, value] of Object.entries(row)) {
        if (!value) continue
        const lc = leadColumns.find((l: { csvHeader: string }) => l.csvHeader === header)
        if (lc) {
          lead_data[lc.fieldId] = value
        } else if (qIdMap[header]) {
          // Multi-select: Google Forms exports as "A, B, C" or "A,B,C" → store as "A|||B|||C"
          // Split by comma (with or without spaces) and normalize
          if (multiSet.has(header)) {
            answers[qIdMap[header]] = value.split(/,\s*/).map((s: string) => s.trim()).filter(Boolean).join('|||')
          } else {
            answers[qIdMap[header]] = value
          }
        }
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
  const questions = questionColumns.map((q: { csvHeader: string; questionText: string; questionId: string; isMulti?: boolean; isOpen?: boolean }) => {
    // For open-ended questions, store raw values without extracting options
    if (q.isOpen) {
      return {
        id: q.questionId,
        type: 'open_ended' as const,
        question_text: q.questionText,
        options: [],
      }
    }

    const rawValues: string[] = (sampleRows || []).map((r: Record<string, string>) => r[q.csvHeader]).filter(Boolean)
    // For multi-select columns, expand comma-separated values to get all unique sub-options
    // Split by comma and trim whitespace (handles ", ", "," with or without spaces)
    const allOptions = q.isMulti
      ? Array.from(new Set(rawValues.flatMap((v: string) => v.split(/,\s*/).map((s: string) => s.trim()).filter(Boolean))))
      : Array.from(new Set(rawValues))
    return {
      id: q.questionId,
      type: q.isMulti ? 'multi_choice' as const : 'single_choice' as const,
      question_text: q.questionText,
      options: allOptions.slice(0, 50) as string[],
    }
  })

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
