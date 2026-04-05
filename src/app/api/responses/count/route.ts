import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const formId = new URL(req.url).searchParams.get('form_id')
  if (!formId) return NextResponse.json({ count: 0 })

  const { count } = await supabaseAdmin
    .from('responses')
    .select('id', { count: 'exact', head: true })
    .eq('form_id', formId)
    .eq('completed', true)
    .eq('is_test', false)

  return NextResponse.json({ count: count || 0 }, {
    headers: { 'Cache-Control': 'public, s-maxage=60' },
  })
}
