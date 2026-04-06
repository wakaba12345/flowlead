import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data: form, error: formError } = await supabaseAdmin
    .from('forms')
    .select('tenant_id, webhook_url')
    .eq('id', body.form_id)
    .single()

  if (formError) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const ip_hash = createHash('sha256').update(ip).digest('hex').slice(0, 16)

  const { data, error } = await supabaseAdmin
    .from('responses')
    .insert({
      form_id: body.form_id,
      tenant_id: form.tenant_id,
      answers: body.answers || {},
      lead_data: body.lead_data || {},
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      page_url: body.page_url || null,
      ip_hash,
      completed: body.completed ?? true,
      is_test: body.is_test ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire webhook (skip for test data)
  if (form.webhook_url && !body.is_test) {
    fetch(form.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'lead.created', form_id: body.form_id, response: data }),
    }).catch(() => {})
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const formId = url.searchParams.get('form_id')
  const includeTest = url.searchParams.get('include_test') === '1'

  if (!formId) return NextResponse.json({ error: 'form_id required' }, { status: 400 })

  const noLimit = url.searchParams.get('no_limit') === '1'
  let query = supabaseAdmin
    .from('responses')
    .select('*')
    .eq('form_id', formId)
    .eq('completed', true)
    .order('created_at', { ascending: false })

  if (!noLimit) query = query.limit(500)

  if (!includeTest) {
    query = query.eq('is_test', false)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
