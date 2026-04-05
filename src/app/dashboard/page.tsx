export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { FileText, Users, TrendingUp, Zap } from 'lucide-react'

async function getStats() {
  const [formsRes, responsesRes] = await Promise.all([
    supabaseAdmin.from('forms').select('id, status', { count: 'exact' }),
    supabaseAdmin.from('responses').select('id, completed', { count: 'exact' }),
  ])

  const activeForms = formsRes.data?.filter(f => f.status === 'active').length || 0
  const totalLeads = responsesRes.data?.filter(r => r.completed).length || 0
  const totalResponses = responsesRes.count || 0
  const completionRate = totalResponses > 0 ? Math.round((totalLeads / totalResponses) * 100) : 0

  return { activeForms, totalLeads, totalForms: formsRes.count || 0, completionRate }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">總覽</h1>
        <p className="mt-1 text-sm text-gray-400">FlowLead — Storm Media</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<FileText size={20} className="text-violet-400" />} label="使用中表單" value={stats.activeForms} />
        <StatCard icon={<Users size={20} className="text-green-400" />} label="總名單數" value={stats.totalLeads} />
        <StatCard icon={<TrendingUp size={20} className="text-blue-400" />} label="完成率" value={`${stats.completionRate}%`} />
        <StatCard icon={<Zap size={20} className="text-orange-400" />} label="總表單數" value={stats.totalForms} />
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard/forms/new"
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          + 建立新表單
        </Link>
        <Link
          href="/dashboard/leads"
          className="rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-gray-800"
        >
          查看名單
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-3">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  )
}
