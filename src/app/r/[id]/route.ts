import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import DOMPurify from 'isomorphic-dompurify'

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

  // Sanitize the stored HTML before serving to prevent stored XSS.
  // WHOLE_DOCUMENT mode preserves the full HTML structure (doctype, head, body).
  const safeHtml = DOMPurify.sanitize(data.html_content, {
    WHOLE_DOCUMENT: true,
    FORCE_BODY: false,
    // Allow inline styles and common attributes used in the report template.
    ADD_ATTR: ['target', 'style'],
    // Prevent javascript: URLs in any attribute.
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })

  return new Response(safeHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      // Defense-in-depth: tell the browser not to sniff MIME and block framing.
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
