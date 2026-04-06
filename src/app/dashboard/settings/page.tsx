export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import PromptEditor from '@/components/dashboard/PromptEditor'

async function getPrompts() {
  const { data } = await supabaseAdmin
    .from('system_prompts')
    .select('*')
    .in('key', ['default_form_gen', 'report_generation'])
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  const formGen = data?.find(r => r.key === 'default_form_gen') || null
  const report  = data?.find(r => r.key === 'report_generation') || null
  return { formGen, report }
}

export default async function SettingsPage() {
  const { formGen, report } = await getPrompts()

  return (
    <div className="max-w-2xl space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="mt-1 text-sm text-gray-400">AI Prompt 管理</p>
      </div>

      {/* Form generation prompt */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">出題引擎 System Prompt</p>
            <p className="text-xs text-gray-500">key: default_form_gen — 修改立即生效，無需 redeploy</p>
          </div>
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
            {formGen?.is_active ? '啟用中' : '停用'}
          </span>
        </div>
        <PromptEditor promptId={formGen?.id} initialText={formGen?.prompt_text || ''} promptKey="default_form_gen" />
      </div>

      {/* Report generation prompt */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">AI 報告 System Prompt</p>
            <p className="text-xs text-gray-500">key: report_generation — 控制名單分析報告的風格與深度</p>
          </div>
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
            {report?.is_active ? '啟用中' : '未設定'}
          </span>
        </div>
        <PromptEditor promptId={report?.id} initialText={report?.prompt_text || ''} promptKey="report_generation" />
      </div>
    </div>
  )
}
