import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { form_title, conversion_goal, total, leadFieldStats, questionStats, openEndedStats, crossTabs, leadChartsHtml, questionChartsHtml, openEndedHtml } = body

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

  const statsJson = JSON.stringify({ form_title, conversion_goal, total, leadFieldStats, questionStats, openEndedStats, crossTabs }, null, 2)

  let userMessage = promptRow.prompt_text
    .replace('{{form_title}}', form_title)
    .replace('{{conversion_goal}}', conversion_goal || '未指定')
    .replace('{{total}}', String(total))
    .replace('{{stats_json}}', statsJson)

  // Append open-ended analysis instruction if there are open-ended questions
  if (openEndedStats && openEndedStats.length > 0) {
    userMessage += `

【開放式問題摘要指示】
請在報告中針對以下每一題開放式問題，各自生成一段獨立摘要（約150-200字）。
摘要需：1) 歸納主要回答主題 2) 點出共同觀點或關鍵詞 3) 提出值得注意的特殊意見。
請使用以下 HTML 結構包裝每題摘要（保持 class 名稱不變，供 CSS 套用樣式）：

<div class="open-ended-summary">
  <h4 class="open-ended-title">（填入題目文字）</h4>
  <p class="open-ended-body">（填入摘要內容）</p>
</div>

開放式題目資料已包含在 stats_json 的 openEndedStats 欄位中。`
  }

  // Append finding heading instruction
  userMessage += `

【交叉分析發現標題格式指示】
在交叉分析或關鍵發現區塊中，每一條「發現」請使用以下 HTML 格式（保持 class 名稱不變）：
<h3 class="finding-heading">發現N：（標題文字）</h3>
這樣可讓排版更醒目。`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''


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

    /* Screen: ensure footer text has good contrast on dark backgrounds */
    footer, [class*="footer"], [id*="footer"] { color: #cbd5e1 !important; }
    footer *, [class*="footer"] *, [id*="footer"] * { color: #cbd5e1 !important; }

    /* ── Finding headings (交叉分析 發現N) ── */
    h3.finding-heading {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 17px !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      background: rgba(99,102,241,0.18) !important;
      border-left: 4px solid #6366f1 !important;
      border-radius: 0 8px 8px 0 !important;
      padding: 10px 16px !important;
      margin: 28px 0 12px !important;
      letter-spacing: .3px;
    }

    /* ── Open-ended summary blocks ── */
    .open-ended-summary {
      background: rgba(15,23,42,0.4) !important;
      border: 1px solid rgba(148,163,184,0.15) !important;
      border-radius: 10px !important;
      padding: 16px 20px !important;
      margin: 16px 0 !important;
    }
    h4.open-ended-title {
      font-size: 14px !important;
      font-weight: 700 !important;
      color: #93c5fd !important;
      margin: 0 0 8px !important;
      padding-bottom: 8px !important;
      border-bottom: 1px solid rgba(148,163,184,0.2) !important;
    }
    p.open-ended-body {
      font-size: 14px !important;
      line-height: 1.75 !important;
      color: #cbd5e1 !important;
      margin: 0 !important;
    }

    @media print {
      /* Remove the charts-section outer background */
      #rpt-charts { background: transparent !important; padding-top: 16px !important; padding-bottom: 16px !important; }
      #rpt-charts .rpt-section-title { color: #374151 !important; }
      #rpt-charts .rpt-section-line  { background: #d1d5db !important; }

      body { background: white !important; }
      body * { color: #1e293b !important; }
      .rpt-badge { color: white !important; }

      /* Finding headings: readable on white paper */
      h3.finding-heading {
        color: #312e81 !important;
        background: #ede9fe !important;
        border-left-color: #6366f1 !important;
      }
      h4.open-ended-title { color: #1e40af !important; }
      p.open-ended-body   { color: #1e293b !important; }
      .open-ended-summary { background: #f8fafc !important; border-color: #e2e8f0 !important; }

      footer, [class*="footer"], [id*="footer"],
      footer *, [class*="footer"] *, [id*="footer"] * { color: #374151 !important; }
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

  return NextResponse.json({ html })
}
