import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { client_name, industry, product_features, conversion_goal, free_text, question_count } = body

  if (!client_name || !industry || !product_features || !conversion_goal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const count = Math.min(50, Math.max(1, Number(question_count) || 3))

  // Fetch system prompt from DB (hot-swappable)
  const { data: promptRow } = await supabaseAdmin
    .from('system_prompts')
    .select('prompt_text')
    .eq('key', 'default_form_gen')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const systemPrompt = (promptRow?.prompt_text || '')
    .replace('{{client_name}}', client_name)
    .replace('{{industry}}', industry)
    .replace('{{product_features}}', product_features)
    .replace('{{conversion_goal}}', conversion_goal)
    .replace('{{free_text}}', free_text || '')
    .replace('{{question_count}}', String(count))

  // Increase max_tokens for large question sets
  const maxTokens = count <= 5 ? 1024 : count <= 20 ? 3000 : 6000

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: systemPrompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'AI failed to return valid JSON' }, { status: 500 })

  const schema = JSON.parse(jsonMatch[0])
  return NextResponse.json({ schema })
}
