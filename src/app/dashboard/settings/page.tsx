export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import PromptEditor from '@/components/dashboard/PromptEditor'

async function getPrompt() {
  const { data } = await supabaseAdmin
    .from('system_prompts')
    .select('*')
    .eq('key', 'default_form_gen')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export default async function SettingsPage() {
  const prompt = await getPrompt()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="mt-1 text-sm text-gray-400">AI 出題引擎 Prompt 管理</p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">System Prompt</p>
            <p className="text-xs text-gray-500">key: default_form_gen — 修改立即生效，無需 redeploy</p>
          </div>
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
            {prompt?.is_active ? '啟用中' : '停用'}
          </span>
        </div>
        <PromptEditor promptId={prompt?.id} initialText={prompt?.prompt_text || ''} />
      </div>
    </div>
  )
}
