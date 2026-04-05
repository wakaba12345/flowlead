import Link from 'next/link'
import { LayoutDashboard, FileText, Users, Settings, LogOut } from 'lucide-react'
import LogoutButton from '@/components/dashboard/LogoutButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-800 bg-gray-900 px-4 py-6">
        <div className="mb-8">
          <span className="text-lg font-bold tracking-tight">
            Flow<span className="text-violet-400">Lead</span>
          </span>
          <p className="mt-0.5 text-xs text-gray-500">Dashboard</p>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink href="/dashboard" icon={<LayoutDashboard size={16} />}>總覽</NavLink>
          <NavLink href="/dashboard/forms" icon={<FileText size={16} />}>表單管理</NavLink>
          <NavLink href="/dashboard/leads" icon={<Users size={16} />}>名單</NavLink>
          <NavLink href="/dashboard/settings" icon={<Settings size={16} />}>設定</NavLink>
        </nav>

        {/* Logout at bottom */}
        <div className="mt-auto pt-4 border-t border-gray-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
    >
      {icon}
      {children}
    </Link>
  )
}
