import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const TENANT_ID_PHASE1 = 'storm_media'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('tenant_id', (await getTenantId()))
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const tenantId = await getTenantId()

  const { data, error } = await supabaseAdmin
    .from('forms')
    .insert({
      tenant_id: tenantId,
      title: body.title,
      schema: body.schema,
      lead_capture: body.schema?.lead_capture || {},
      theme: body.theme || {},
      webhook_url: body.webhook_url || null,
      status: body.status || 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

async function getTenantId() {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_ID_PHASE1)
    .single()
  return data?.id
}
