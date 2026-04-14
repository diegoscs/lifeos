'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const navItems = [
  { label: 'Dashboard',       href: '/' },
  { label: 'Tarefas',         href: '/tarefas' },
  { label: 'Hábitos',         href: '/habitos' },
  { label: 'E-mails',         href: '/emails' },
  { label: 'Finanças',        href: '/financas' },
  { label: 'Projetos',        href: '/projetos' },
  { label: 'Clientes',        href: '/clientes' },
  { label: 'Revisão Semanal', href: '/semana' },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-[180px] shrink-0 h-screen bg-neutral-950 border-r border-neutral-900 flex flex-col pt-8 pb-4">
      <div className="px-5 mb-8">
        <span className="text-white font-semibold text-sm tracking-tight">LifeOS</span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-3">
        {navItems.map(({ label, href }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                active
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              {/* dot de ativo */}
              <span
                className={clsx(
                  'w-1 h-1 rounded-full shrink-0 transition-colors',
                  active ? 'bg-white' : 'bg-transparent'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
