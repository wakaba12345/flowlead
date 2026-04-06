import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/reports/share?form_id=xxx  → list reports for a form
export async function GET(req: NextRequest) {
  const form_id = req.nextUrl.searchParams.get('form_id')
  if (!form_id) return NextResponse.json({ error: 'Missing form_id' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('shared_reports')
    .select('id, form_title, created_at')
    .eq('form_id', form_id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data })
}

// POST /api/reports/share  → save report, return id
export async function POST(req: NextRequest) {
  const { html, form_title, form_id } = await req.json()
  if (!html || !form_title) {
    return NextResponse.json({ error: 'Missing html or form_title' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('shared_reports')
    .insert({ form_title, html_content: html, form_id: form_id ?? null })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

// DELETE /api/reports/share?id=xxx  → delete a report
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('shared_reports')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
