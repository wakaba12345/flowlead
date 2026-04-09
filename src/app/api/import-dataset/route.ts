import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

const TENANT_SLUG = 'storm_media'

async function getTenantId() {
  const { data } = await supabaseAdmin.from('tenants').select('id').eq('slug', TENANT_SLUG).single()
  return data?.id as string | undefined
}

type QCol = { csvHeader: string; questionText: string; questionId: string; isMulti?: boolean; isOpen?: boolean }
type LCol = { csvHeader: string; fieldId: string; fieldLabel: string }
type CbGroup = { groupName: string; questionId: string; headers: string[]; optionLabels: string[] }

// A checkbox value is considered "checked" if it's v/V/1/true/yes/是/有
function isChecked(val: string) {
  return /^(v|V|1|true|yes|是|有|✓|✔)$/i.test(val.trim())
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // ── Step 2: bulk insert rows ──────────────────────────────────────────────
  if (body.form_id && body.rows) {
    const { form_id, tenant_id, leadColumns, questionColumns, checkboxGroups = [], rows } = body

    const qIdMap: Record<string, string> = {}
    const multiSet = new Set<string>()
    ;(questionColumns as QCol[]).forEach(q => {
      qIdMap[q.csvHeader] = q.questionId
      if (q.isMulti) multiSet.add(q.csvHeader)
    })

    // Build checkbox group lookup: csvHeader → { questionId, optionLabel }
    const cbHeaderMap: Record<string, { questionId: string; optionLabel: string }> = {}
    ;(checkboxGroups as CbGroup[]).forEach(g => {
      g.headers.forEach((h, i) => {
        cbHeaderMap[h] = { questionId: g.questionId, optionLabel: g.optionLabels[i] || h }
      })
    })

    const records = (rows as Record<string, string>[]).map(row => {
      const lead_data: Record<string, string> = {}
      const answers: Record<string, string> = {}
      // Accumulate checkbox group selections
      const cbAnswers: Record<string, string[]> = {}

      for (const [header, value] of Object.entries(row)) {
        if (!value) continue
        const lc = (leadColumns as LCol[]).find(l => l.csvHeader === header)
        if (lc) {
          lead_data[lc.fieldId] = value
        } else if (cbHeaderMap[header]) {
          // Wide-format checkbox: accumulate checked options
          if (isChecked(value)) {
            const { questionId, optionLabel } = cbHeaderMap[header]
            if (!cbAnswers[questionId]) cbAnswers[questionId] = []
            cbAnswers[questionId].push(optionLabel)
          }
        } else if (qIdMap[header]) {
          if (multiSet.has(header)) {
            const sep = value.includes('\n') ? /\n/ : /,\s*/
            answers[qIdMap[header]] = value.split(sep).map(s => s.trim()).filter(Boolean).join('|||')
          } else {
            answers[qIdMap[header]] = value
          }
        }
      }

      // Merge checkbox group answers
      for (const [qId, opts] of Object.entries(cbAnswers)) {
        answers[qId] = opts.join('|||')
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
  const { title, leadColumns, questionColumns, checkboxGroups = [], sampleRows } = body
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  const tenantId = await getTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 500 })

  // Regular questions
  const questions = (questionColumns as QCol[]).map(q => {
    if (q.isOpen) return { id: q.questionId, type: 'open_ended' as const, question_text: q.questionText, options: [] }
    const rawValues: string[] = (sampleRows || []).map((r: Record<string, string>) => r[q.csvHeader]).filter(Boolean)
    const allOptions = q.isMulti
      ? Array.from(new Set(rawValues.flatMap(v => {
          const sep = v.includes('\n') ? /\n/ : /,\s*/
          return v.split(sep).map(s => s.trim()).filter(Boolean)
        })))
      : Array.from(new Set(rawValues))
    return { id: q.questionId, type: q.isMulti ? 'multi_choice' as const : 'single_choice' as const, question_text: q.questionText, options: allOptions.slice(0, 50) as string[] }
  })

  // Checkbox group questions — options are the optionLabels
  const cbQuestions = (checkboxGroups as CbGroup[]).map(g => ({
    id: g.questionId,
    type: 'multi_choice' as const,
    question_text: g.groupName,
    options: g.optionLabels,
  }))

  const leadFields = (leadColumns as LCol[]).map(l => ({
    id: l.fieldId, label: l.fieldLabel, type: 'text' as const, required: false,
  }))

  const schema = {
    form_title: title,
    questions: [...questions, ...cbQuestions],
    lead_capture: { title: '', description: '', fields: leadFields, button_text: '送出' },
  }

  const { data: form, error: formErr } = await supabaseAdmin
    .from('forms')
    .insert({ tenant_id: tenantId, title, schema, lead_capture: schema.lead_capture, theme: {}, status: 'imported' })
    .select().single()

  if (formErr || !form) return NextResponse.json({ error: formErr?.message || 'Failed' }, { status: 500 })
  return NextResponse.json({ form_id: form.id, tenant_id: tenantId })
}
