import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { client_name, industry, product_features, conversion_goal, free_text } = await req.json()

  if (!client_name || !conversion_goal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const prompt = `你是頂尖行銷文案師。請為以下活動生成一句極具吸引力的「問卷填寫誘因文案」，用於嵌入式問卷的第一個畫面，讓網友忍不住想立刻參與。

客戶：${client_name}
產業：${industry || '不限'}
產品特色：${product_features || '不限'}
轉換目標：${conversion_goal}
${free_text ? `補充：${free_text}` : ''}

要求：
- 一句話，15~35字
- 突出具體誘因（例如：抽獎、折價券、試用包、免費報告、免費諮詢）
- 帶有緊迫感或稀缺感（例如：限量、限時、前N名）
- 語氣親切積極，適合台灣用戶
- 直接輸出文案本身，不要任何解釋、引號或標點以外的文字`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const hook_text = message.content[0].type === 'text'
    ? message.content[0].text.trim()
    : ''

  return NextResponse.json({ hook_text })
}
