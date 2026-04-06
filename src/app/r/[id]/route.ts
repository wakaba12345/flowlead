import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('shared_reports')
    .select('html_content')
    .eq('id', id)
    .single()

  if (error || !data) {
    return new Response(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:#666">報告不存在或已過期。</body></html>',
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  return new Response(data.html_content, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
