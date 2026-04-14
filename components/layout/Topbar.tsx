'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase'

type Filter = 'Tudo' | 'Trabalho' | 'Pessoal'

const filters: Filter[] = ['Tudo', 'Trabalho', 'Pessoal']

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/tarefas')) return 'Tarefas'
  if (pathname.startsWith('/habitos')) return 'Hábitos'
  if (pathname.startsWith('/emails')) return 'E-mails'
  if (pathname.startsWith('/financas')) return 'Finanças'
  if (pathname.startsWith('/projetos')) return 'Projetos'
  if (pathname.startsWith('/clientes')) return 'Clientes'
  if (pathname.startsWith('/semana')) return 'Revisão Semanal'
  return 'LifeOS'
}

export default function Topbar() {
  const [active, setActive] = useState<Filter>('Tudo')
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-neutral-900 bg-neutral-950">
      <h1 className="text-sm font-medium text-white">{getPageTitle(pathname)}</h1>

      <div className="flex items-center gap-4">
        {/* Toggle Tudo / Trabalho / Pessoal */}
        <div className="flex items-center gap-0.5 bg-neutral-900 rounded-md p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={clsx(
                'px-3 py-1 rounded text-xs font-medium transition-colors',
                active === f
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Avatar / logout */}
        <button
          onClick={handleSignOut}
          title="Sair"
          className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center justify-center"
        >
          <span className="text-xs text-neutral-400 font-medium select-none">D</span>
        </button>
      </div>
    </header>
  )
}
