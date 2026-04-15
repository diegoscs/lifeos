'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/tarefas')) return 'Tarefas'
  if (pathname.startsWith('/habitos')) return 'Hábitos'
  if (pathname.startsWith('/emails')) return 'E-mails'
  if (pathname.startsWith('/financas')) return 'Finanças'
  if (pathname.startsWith('/projetos')) return 'Projetos'
  if (pathname.startsWith('/semana')) return 'Revisão Semanal'
  return 'LifeOS'
}

interface TopbarProps {
  onMenuToggle: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-12 shrink-0 flex items-center gap-3 px-4 md:px-6 border-b border-neutral-900 bg-neutral-950">
      {/* Hamburger — only on mobile */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
        aria-label="Abrir menu de navegação"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Page title */}
      <h1 className="text-sm font-medium text-white flex-1">{getPageTitle(pathname)}</h1>

      {/* Avatar / logout */}
      <button
        onClick={handleSignOut}
        title="Sair da conta"
        aria-label="Sair da conta"
        className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center justify-center"
      >
        <span className="text-xs text-neutral-400 font-medium select-none">D</span>
      </button>
    </header>
  )
}
