import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { html, form_title } = await req.json()
  if (!html || !form_title) {
    return NextResponse.json({ error: 'Missing html or form_title' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('shared_reports')
    .insert({ form_title, html_content: html })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
