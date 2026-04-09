export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import type { Form } from '@/types'
import LotteryDraw from '@/components/dashboard/LotteryDraw'

export default async function LotteryPage() {
  const { data: forms } = await supabaseAdmin
    .from('forms')
    .select('id, title, schema, tenant_id, status, created_at, updated_at, lead_capture, theme, webhook_url, ends_at')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">自動抽獎</h1>
        <p className="mt-1 text-sm text-gray-400">從表單名單中隨機抽出得獎者</p>
      </div>
      <LotteryDraw forms={(forms || []) as Form[]} />
    </div>
  )
}
