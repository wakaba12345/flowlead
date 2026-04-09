import type { Response, Form } from '@/types'

const AGE_ORDER    = ['17以下','18-24','25-34','35-44','45-54','55-64','65以上']
const INCOME_ORDER = ['30萬以下','30-60萬','60-100萬','100~200萬','200~300萬','300~500萬','500萬以上']
const SKIP_KEYS    = new Set(['Email','電話','地址','email','phone','address','姓名','name'])
const BAR_KEYS     = new Set(['年齡','年收入','age','income'])
const COLORS = ['#0891b2','#f97316','#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6']

export function bucketAge(val: string): string {
  const n = parseInt(val)
  if (isNaN(n)) return val
  if (n <= 17) return '17以下'
  if (n <= 24) return '18-24'
  if (n <= 34) return '25-34'
  if (n <= 44) return '35-44'
  if (n <= 54) return '45-54'
  if (n <= 64) return '55-64'
  return '65以上'
}

function polarXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function arcPath(cx: number, cy: number, r: number, s: number, e: number) {
  if (e - s >= 360) e = s + 359.99
  const p1 = polarXY(cx, cy, r, s), p2 = polarXY(cx, cy, r, e)
  return `M ${cx} ${cy} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`
}

function pieChartHtml(title: string, entries: [string, number][], total: number): string {
  const cx = 64, cy = 64, r = 56
  let paths = '', deg = 0
  entries.forEach(([, n], i) => {
    const slice = (n / total) * 360
    paths += `<path d="${arcPath(cx, cy, r, deg, deg + slice)}" fill="${COLORS[i % COLORS.length]}"/>`
    deg += slice
  })
  paths += `<circle cx="${cx}" cy="${cy}" r="22" fill="#edf1f6"/>`
  paths += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#1e293b" font-size="13" font-weight="700" font-family="system-ui,sans-serif">${total}</text>`
  const legend = entries.map(([label, n], i) => {
    const pct = Math.round(n / total * 100)
    const c = COLORS[i % COLORS.length]
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
      <div style="width:10px;height:10px;border-radius:2px;flex-shrink:0;background:${c}"></div>
      <span style="flex:1;font-size:12px;color:#374151;line-height:1.3">${label}</span>
      <span style="font-size:11px;color:#6b7280;white-space:nowrap">${n} · ${pct}%</span>
    </div>`
  }).join('')
  return `<div style="background:#edf1f6;border:1px solid #d1d9e3;border-radius:12px;padding:18px 20px;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact">
    <p style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin:0 0 14px">${title}</p>
    <svg width="128" height="128" viewBox="0 0 128 128" style="display:block;margin:0 auto 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact">${paths}</svg>
    <div>${legend}</div>
  </div>`
}

function barChartHtml(title: string, entries: [string, number][], isQuestion = false): string {
  const total = entries.reduce((s, [, n]) => s + n, 0)
  const maxVal = Math.max(...entries.map(([, n]) => n), 1)
  const rows = entries.map(([label, n], i) => {
    const w = Math.round(n / maxVal * 100)
    const pct = ((n / total) * 100).toFixed(1)
    const c = COLORS[i % COLORS.length]
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="flex:0 0 auto;min-width:${isQuestion ? 'min(200px,40%)' : 'min(80px,30%)'};max-width:${isQuestion ? '260px' : '120px'};font-size:13px;color:#374151;line-height:1.3;word-break:break-word">${label}</span>
      <span class="rpt-badge" style="flex:0 0 auto;background:${c};color:white;border-radius:6px;padding:2px 10px;font-size:13px;font-weight:600;min-width:44px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">${n}</span>
      <div style="flex:1;height:10px;background:#f3f4f6;border-radius:5px;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact">
        <div style="height:100%;width:${w}%;background:${c};border-radius:5px;opacity:.9;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div>
      </div>
      <span style="flex:0 0 auto;font-size:12px;color:#9ca3af;min-width:38px;text-align:right">${pct}%</span>
    </div>`
  }).join('')
  const titleHtml = isQuestion
    ? `<p style="font-size:13px;color:#6b7280;margin:0 0 14px">${title}</p>`
    : `<p style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin:0 0 14px">${title}</p>`
  return `<div style="background:#edf1f6;border:1px solid #d1d9e3;border-radius:12px;padding:18px 22px;break-inside:avoid">
    ${titleHtml}
    <div>${rows}</div>
  </div>`
}

function buildLeadChartsHtml(leadFieldStats: Record<string, Record<string, number>>): string {
  const cards = Object.entries(leadFieldStats).map(([key, counts]) => {
    const entries = Object.entries(counts) as [string, number][]
    const total = entries.reduce((s, [, n]) => s + n, 0)
    if (total < 2) return ''
    return BAR_KEYS.has(key) ? barChartHtml(key, entries, false) : pieChartHtml(key, entries, total)
  }).filter(Boolean).join('')
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">${cards}</div>`
}

function buildQuestionChartsHtml(
  questionStats: { id: string; text: string; counts: Record<string, number>; otherAnswers: string[] }[],
  questions: { id: string; question_text: string; options: string[] }[]
): string {
  const chartItems: string[] = []
  const otherBlocks: string[] = []
  questionStats.forEach((q, i) => {
    const total = Object.values(q.counts).reduce((s, n) => s + n, 0)
    if (total === 0) return
    const qDef = questions[i]
    // Exclude both '__other__' and '其他' from regular options to avoid duplicate '其他' entry
    const regularOptions = qDef
      ? qDef.options.filter(o => o !== '__other__' && o !== '其他')
      : Object.keys(q.counts).filter(k => k !== '其他')
    const otherCount = q.counts['其他'] || 0
    const entries: [string, number][] = [
      ...regularOptions.map(o => [o, q.counts[o] || 0] as [string, number]),
      ...(otherCount ? [['其他', otherCount] as [string, number]] : []),
    ]
    chartItems.push(barChartHtml(`Q${i + 1} · ${q.text}`, entries, true))
    if (q.otherAnswers.length > 0) {
      const answerCards = q.otherAnswers.map(a =>
        `<div style="background:#edf1f6;border:1px solid #d1d9e3;border-radius:8px;padding:9px 13px;font-size:13px;color:#374151;line-height:1.5">「${a}」</div>`
      ).join('')
      otherBlocks.push(`
        <div style="background:#e6ebf2;border:1px solid #c8d3de;border-radius:12px;padding:18px 22px;break-inside:avoid">
          <p style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px">✏ 其他自填回答</p>
          <p style="font-size:13px;font-weight:500;color:#111827;margin:0 0 10px">${q.text}</p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${answerCards}</div>
        </div>`)
    }
  })
  const grid = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px${otherBlocks.length ? ';margin-bottom:16px' : ''}">${chartItems.join('')}</div>`
  const others = otherBlocks.length ? `<div style="display:flex;flex-direction:column;gap:12px">${otherBlocks.join('')}</div>` : ''
  return grid + others
}

export function buildStats(responses: Response[], form: Form) {
  const questions = form.schema?.questions || []
  const total = responses.length

  const leadKeys = Array.from(new Set(responses.flatMap(r => Object.keys(r.lead_data || {})))).filter(k => !SKIP_KEYS.has(k))
  const leadFieldStats: Record<string, Record<string, number>> = {}
  for (const key of leadKeys) {
    const counts: Record<string, number> = {}
    for (const r of responses) {
      let v = (r.lead_data || {})[key]
      if (!v) continue
      if (key === '年齡' || key === 'age') v = bucketAge(v)
      counts[v] = (counts[v] || 0) + 1
    }
    if (key === '年齡' || key === 'age') {
      const sorted: Record<string, number> = {}
      for (const k of AGE_ORDER) if (counts[k]) sorted[k] = counts[k]
      leadFieldStats[key] = sorted
    } else if (key === '年收入') {
      const sorted: Record<string, number> = {}
      for (const k of INCOME_ORDER) if (counts[k]) sorted[k] = counts[k]
      leadFieldStats[key] = sorted
    } else {
      leadFieldStats[key] = counts
    }
  }

  const questionStats: { id: string; text: string; counts: Record<string, number>; otherAnswers: string[] }[] = []
  const openEndedStats: { id: string; text: string; answers: string[] }[] = []
  for (const q of questions) {
    if (q.type === 'open_ended') {
      const answers = responses.map(r => r.answers?.[q.id]).filter(Boolean) as string[]
      openEndedStats.push({ id: q.id, text: q.question_text, answers })
      continue
    }
    const counts: Record<string, number> = {}
    const otherAnswers: string[] = []
    for (const r of responses) {
      const ans = r.answers?.[q.id]
      if (!ans) continue
      const parts = ans.includes('|||') ? ans.split('|||') : [ans]
      for (const part of parts) {
        if (part.startsWith('其他:')) {
          counts['其他'] = (counts['其他'] || 0) + 1
          otherAnswers.push(part.slice(3))
        } else {
          counts[part] = (counts[part] || 0) + 1
        }
      }
    }
    questionStats.push({ id: q.id, text: q.question_text, counts, otherAnswers })
  }

  const dimKeys = ['性別', '年齡', '年收入'].filter(k => leadKeys.includes(k))
  const crossTabs: Record<string, Record<string, Record<string, Record<string, number>>>> = {}
  for (const dim of dimKeys) {
    crossTabs[dim] = {}
    for (const q of questions) {
      const tab: Record<string, Record<string, number>> = {}
      for (const r of responses) {
        let dimVal = (r.lead_data || {})[dim]
        if (!dimVal) continue
        if (dim === '年齡') dimVal = bucketAge(dimVal)
        const ans = r.answers?.[q.id]
        if (!ans) continue
        if (!tab[dimVal]) tab[dimVal] = {}
        tab[dimVal][ans] = (tab[dimVal][ans] || 0) + 1
      }
      crossTabs[dim][q.question_text] = tab
    }
  }

  const choiceQuestions = questions.filter(q => q.type !== 'open_ended')
  const leadChartsHtml     = buildLeadChartsHtml(leadFieldStats)
  const questionChartsHtml = buildQuestionChartsHtml(questionStats, choiceQuestions)

  return { total, leadFieldStats, questionStats, openEndedStats, crossTabs, leadChartsHtml, questionChartsHtml }
}

export function injectShareBar(html: string, shareUrl: string): string {
  const safeUrl = shareUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;')
  const jsUrl = JSON.stringify(shareUrl)

  const barStyle = `<style id="rpt-share-style">
  @media print { #rpt-share-bar { display:none !important; } }
</style>`
  html = html.replace(/<\/head>/i, barStyle + '</head>')

  const bar = `<div id="rpt-share-bar" style="position:fixed;bottom:0;left:0;right:0;z-index:9999;height:44px;background:#1e293b;border-top:1px solid #334155;padding:0 16px;display:flex;align-items:center;gap:8px;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box">
  <button id="rpt-copy-btn" style="background:#334155;border:none;color:#e2e8f0;font-size:12px;font-weight:600;padding:5px 14px;border-radius:6px;cursor:pointer;white-space:nowrap">複製連結</button>
  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="background:#4f46e5;color:white;font-size:12px;font-weight:600;padding:5px 14px;border-radius:6px;text-decoration:none;white-space:nowrap">開啟分享頁</a>
  <script>(function(){var u=${jsUrl};document.getElementById('rpt-copy-btn').addEventListener('click',function(){var b=this;navigator.clipboard.writeText(u).then(function(){b.textContent='已複製 ✓';b.style.color='#34d399';setTimeout(function(){b.textContent='複製連結';b.style.color='';},2000);});});})();<\/script>
</div>`
  html = html.replace(/<body([^>]*)>/i, `<body$1>${bar}`)

  const footer = `<footer id="rpt-footer" style="font-family:system-ui,-apple-system,sans-serif;margin-top:48px;padding:24px 32px;border-top:1px solid #334155;background:#1e293b;text-align:center">
  <p style="font-size:13px;color:#94a3b8;margin:0 0 6px">此報告由 <strong style="color:#a5b4fc">FlowLead</strong> AI 自動生成</p>
  <p style="font-size:12px;color:#64748b;margin:0">本表單可依需求編輯文字、選項與版型，如需調整請聯繫您的業務顧問</p>
</footer>`
  html = html.replace(/<\/body>/i, footer + '</body>')

  return html
}
