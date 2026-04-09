import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { headers, sampleRows } = await req.json()
  if (!headers?.length) return NextResponse.json({ error: 'Missing headers' }, { status: 400 })

  const sampleStr = (sampleRows || []).slice(0, 3).map((row: Record<string, string>, i: number) =>
    `Row ${i + 1}: ${headers.map((h: string) => `${JSON.stringify(h.trim().slice(0, 40))}: ${JSON.stringify((row[h] || '').slice(0, 60))}`).join(', ')}`
  ).join('\n')

  const prompt = `你是一個問卷資料欄位分析專家。根據以下 CSV 的欄位名稱和樣本資料，幫我分類每個欄位。

欄位清單（共 ${headers.length} 個）：
${headers.map((h: string, i: number) => `[${i}] ${JSON.stringify(h.trim())}`).join('\n')}

樣本資料（前3筆）：
${sampleStr}

請將每個欄位分類為以下類型之一：
- "lead"：受訪者個人資料（姓名、電話、Email、性別、年齡、地址等）
- "question"：單選或評分題（選項互斥，每人只填一個答案，通常只有 3-10 種不同答案）
- "multi_question"：多選題（答案是逗號或分隔符號分開的多個選項在同一格）
- "checkbox_option"：寬格式核取方塊選項（欄位名稱本身是選項名稱，值是 v/V/1/是 或空白）
- "open_question"：開放式文字回答（自由填寫，請特別注意以下訊號）
- "skip"：不需要的欄位（時間戳記、流水號等）

【開放式問題辨識規則 — 非常重要】
以下情況應判斷為 "open_question"：
1. 樣本資料中不重複的答案超過 5 種，且平均每個答案出現次數低於 2 次
2. 答案內容是完整句子、描述性文字或超過 10 個字的回答
3. 欄位名稱包含「建議」「意見」「其他說明」「希望」「感想」「心得」「備註」等詞彙
4. 答案明顯不是固定選項（如滿意度數字 1-5 或固定選項文字）

切勿把自由填寫的文字欄位誤判為 "question"。

對於 "checkbox_option"，請同時提供：
- group_name：這個選項屬於哪個問題（通常是欄位名稱在 \\n 或 - 之前的部分）
- option_label：選項的顯示文字（欄位名稱在 \\n- 之後的部分，或整個欄位名稱）

對於 "lead"，請提供：
- field_id：標準欄位 ID（name/phone/email/gender/age/address/income/marital/has_children 其中之一，或自訂）
- field_label：顯示名稱

回傳純 JSON 陣列，不要加任何說明文字：
[
  { "header": "原始欄位名稱", "type": "類型", "field_id": "...", "field_label": "...", "group_name": "...", "option_label": "..." },
  ...
]`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  let text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  text = text.trim().replace(/^```[\w]*\r?\n?/, '').replace(/\r?\n?```\s*$/, '').trim()

  try {
    const result = JSON.parse(text)
    return NextResponse.json({ columns: result })
  } catch {
    return NextResponse.json({ error: 'AI classification failed', raw: text }, { status: 500 })
  }
}
