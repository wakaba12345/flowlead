'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, FileText, Users, Settings, Menu, X, Gift } from 'lucide-react'
import LogoutButton from '@/components/dashboard/LogoutButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-56 shrink-0 flex-col border-r border-gray-800 bg-gray-900 px-4 py-6
        ${sidebarOpen ? 'flex' : 'hidden'}
        md:static md:flex
      `}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold tracking-tight">
              Flow<span className="text-violet-400">Lead</span>
            </span>
            <p className="mt-0.5 text-xs text-gray-500">Dashboard</p>
          </div>
          <button
            className="text-gray-500 hover:text-gray-100 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink href="/dashboard" icon={<LayoutDashboard size={16} />} onClick={() => setSidebarOpen(false)}>總覽</NavLink>
          <NavLink href="/dashboard/forms" icon={<FileText size={16} />} onClick={() => setSidebarOpen(false)}>表單管理</NavLink>
          <NavLink href="/dashboard/leads" icon={<Users size={16} />} onClick={() => setSidebarOpen(false)}>名單</NavLink>
          <NavLink href="/dashboard/lottery" icon={<Gift size={16} />} onClick={() => setSidebarOpen(false)}>抽獎</NavLink>
          <NavLink href="/dashboard/settings" icon={<Settings size={16} />} onClick={() => setSidebarOpen(false)}>設定</NavLink>
        </nav>

        <div className="mt-auto border-t border-gray-800 pt-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3 md:hidden">
          <button
            className="text-gray-400 hover:text-gray-100 active:opacity-60"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold tracking-tight">
            Flow<span className="text-violet-400">Lead</span>
          </span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-800 hover:text-gray-100 active:bg-gray-700 active:opacity-80 ${
        isActive ? 'bg-gray-800 text-gray-100' : 'text-gray-400'
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}
