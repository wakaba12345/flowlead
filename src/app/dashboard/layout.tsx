'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, FileText, Users, Settings, Menu, X, Gift, BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import LogoutButton from '@/components/dashboard/LogoutButton'
import { ReportGenerationProvider, useReportGeneration } from '@/contexts/ReportGenerationContext'

function GenerationStatusBar() {
  const { status, formTitle, errorMsg, dismiss } = useReportGeneration()
  if (status === 'idle') return null
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl text-sm font-medium max-w-sm
      ${status === 'generating' ? 'border-violet-500/40 bg-violet-950/90 text-violet-200' : ''}
      ${status === 'done'       ? 'border-green-500/40 bg-green-950/90 text-green-200' : ''}
      ${status === 'error'      ? 'border-red-500/40 bg-red-950/90 text-red-200' : ''}
    `}>
      {status === 'generating' && <Loader2 size={16} className="shrink-0 animate-spin text-violet-400" />}
      {status === 'done'       && <CheckCircle2 size={16} className="shrink-0 text-green-400" />}
      {status === 'error'      && <AlertCircle size={16} className="shrink-0 text-red-400" />}
      <span className="flex-1 truncate">
        {status === 'generating' && `AI 分析中：《${formTitle}》`}
        {status === 'done'       && `報告已生成：《${formTitle}》`}
        {status === 'error'      && (errorMsg || '生成失敗')}
      </span>
      {status !== 'generating' && (
        <button onClick={dismiss} className="shrink-0 opacity-60 hover:opacity-100 transition"><X size={14} /></button>
      )}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ReportGenerationProvider>
    <GenerationStatusBar />
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
          <NavLink href="/dashboard/guide" icon={<BookOpen size={16} />} onClick={() => setSidebarOpen(false)}>使用手冊</NavLink>
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
    </ReportGenerationProvider>
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
