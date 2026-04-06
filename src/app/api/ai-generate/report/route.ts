import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { form_title, conversion_goal, total, leadFieldStats, questionStats, crossTabs, leadChartsHtml, questionChartsHtml } = body

  if (!form_title || total == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch system prompt from DB
  const { data: promptRow } = await supabaseAdmin
    .from('system_prompts')
    .select('prompt_text')
    .eq('key', 'report_generation')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!promptRow?.prompt_text) {
    return NextResponse.json({ error: 'Report prompt not configured in settings' }, { status: 500 })
  }

  const statsJson = JSON.stringify({ form_title, conversion_goal, total, leadFieldStats, questionStats, crossTabs }, null, 2)

  const userMessage = promptRow.prompt_text
    .replace('{{form_title}}', form_title)
    .replace('{{conversion_goal}}', conversion_goal || '未指定')
    .replace('{{total}}', String(total))
    .replace('{{stats_json}}', statsJson)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  console.log('[report] raw text length:', text.length, '| first 200 chars:', text.slice(0, 200))

  // Robustly strip markdown code fences — handle ```html, ```, or bare HTML
  let html = text.trim()
  html = html.replace(/^```[\w]*\r?\n?/, '')
  html = html.replace(/\r?\n?```\s*$/, '')
  html = html.trim()

  // Inject viewport meta if not present
  if (!html.includes('name="viewport"')) {
    html = html.replace(/<head([^>]*)>/i, '<head$1><meta name="viewport" content="width=device-width,initial-scale=1">')
  }

  // Overwrite <title> with sanitized form title (replace em/en dash → underscore for PDF filename)
  const safeTitle = form_title.replace(/[—–]/g, '_')
  if (/<title>/i.test(html)) {
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`)
  } else {
    html = html.replace(/<\/head>/i, `<title>${safeTitle}</title></head>`)
  }

  // Global styles: preserve backgrounds on screen, fix contrast for print
  const printStyle = `<style>
    /* Keep all backgrounds on screen */
    * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; color-adjust:exact!important }

    @media print {
      /* Remove the charts-section outer background — show white/transparent instead */
      #rpt-charts { background: transparent !important; padding-top: 16px !important; padding-bottom: 16px !important; }
      /* Section headings adapt to white background */
      #rpt-charts .rpt-section-title { color: #374151 !important; }
      #rpt-charts .rpt-section-line  { background: #d1d5db !important; }

      /* Force all text in the AI analysis to dark so it's readable on white paper */
      body { background: white !important; }
      body * { color: #1e293b !important; }

      /* Restore white text on colored badge pills so they stay readable */
      .rpt-badge { color: white !important; }
    }
  </style>`
  html = html.replace(/<\/head>/i, printStyle + '</head>')

  // Inject charts right after <body> tag — styled to match PDF report aesthetic
  if (leadChartsHtml || questionChartsHtml) {
    const bodyMatch = html.match(/<body[^>]*>/)
    if (bodyMatch) {
      const insertAt = html.indexOf(bodyMatch[0]) + bodyMatch[0].length
      const sectionHeading = (label: string) =>
        `<div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
          <span class="rpt-section-title" style="font-size:14px;font-weight:700;color:#cbd5e1;letter-spacing:.5px">${label}</span>
          <div class="rpt-section-line" style="flex:1;height:1px;background:#3d5068"></div>
        </div>`

      const chartsBlock = `
<div id="rpt-charts" style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#2a3a4d;padding:32px 28px 28px;-webkit-print-color-adjust:exact;print-color-adjust:exact">
  <div style="max-width:1080px;margin:0 auto">
    ${leadChartsHtml ? `
    <div style="margin-bottom:32px">
      ${sectionHeading('📊 受訪者輪廓')}
      ${leadChartsHtml}
    </div>` : ''}
    ${questionChartsHtml ? `
    <div style="margin-bottom:8px">
      ${sectionHeading('📋 各題作答分布')}
      ${questionChartsHtml}
    </div>` : ''}
  </div>
</div>`

      html = html.slice(0, insertAt) + chartsBlock + html.slice(insertAt)
    }
  }

  console.log('[report] final html length:', html.length)

  return NextResponse.json({ html })
}
