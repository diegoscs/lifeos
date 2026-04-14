'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'
import { useEmails, type EmailMessage } from '@/hooks/useEmails'
import EmailItem from '@/components/emails/EmailItem'
import EmailPanel from '@/components/emails/EmailPanel'
import Spinner from '@/components/ui/Spinner'

type View = 'todos' | 'nao-lidos'

export default function EmailsPage() {
  const [view, setView] = useState<View>('todos')
  const [selected, setSelected] = useState<EmailMessage | null>(null)
  const { messages, connected, isLoading, isError, mutate } = useEmails()
  const searchParams = useSearchParams()
  const justConnected = searchParams.get('connected')

  const filtered = view === 'nao-lidos'
    ? messages.filter((m) => !m.isRead)
    : messages

  const unreadCount = messages.filter((m) => !m.isRead).length

  async function handleArchive(messageId: string) {
    await fetch(`/api/emails/${messageId}/archive`, { method: 'POST' })
    mutate()
    if (selected?.id === messageId) setSelected(null)
  }

  const isConnected = connected.length > 0

  return (
    <div className="flex h-full -m-6 overflow-hidden">
      {/* Lista */}
      <div className={clsx(
        'flex flex-col border-r border-neutral-900',
        selected ? 'w-80 shrink-0' : 'flex-1'
      )}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900 shrink-0">
          <div className="flex gap-1 bg-neutral-900 rounded-md p-0.5">
            {(['todos', 'nao-lidos'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  'px-3 py-1 rounded text-xs font-medium transition-colors',
                  view === v ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
                )}
              >
                {v === 'todos' ? 'Todos' : `Não lidos${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
              </button>
            ))}
          </div>

          {/* Contas conectadas */}
          <div className="flex items-center gap-2">
            {connected.map((c) => (
              <span key={c.email} className="text-xs text-neutral-600 flex items-center gap-1">
                <span className={clsx(
                  'w-1.5 h-1.5 rounded-full',
                  c.provider === 'gmail' ? 'bg-red-500' : 'bg-blue-500'
                )} />
                {c.email.split('@')[0]}
              </span>
            ))}
            <a
              href="/api/auth/gmail/connect"
              className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors"
            >
              + Gmail
            </a>
          </div>
        </div>

        {/* Notificação de conta conectada */}
        {justConnected && (
          <div className="px-4 py-2 bg-green-900/20 border-b border-green-900/40 text-xs text-green-400">
            {justConnected === 'gmail' ? 'Gmail' : 'Outlook'} conectado com sucesso.
          </div>
        )}

        {/* Estados */}
        {isLoading && (
          <div className="flex justify-center py-12"><Spinner /></div>
        )}

        {isError && (
          <div className="px-4 py-8 text-center text-sm text-red-400">
            Erro ao carregar e-mails.
          </div>
        )}

        {!isLoading && !isConnected && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-12 text-center px-6">
            <p className="text-sm text-neutral-500">Nenhuma conta de e-mail conectada.</p>
            <a
              href="/api/auth/gmail/connect"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-white transition-colors"
            >
              Conectar Gmail
            </a>
          </div>
        )}

        {!isLoading && isConnected && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-neutral-600">
            Nenhum e-mail aqui.
          </div>
        )}

        {!isLoading && filtered.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            isSelected={selected?.id === email.id}
            onClick={() => setSelected(email)}
          />
        ))}
      </div>

      {/* Painel lateral */}
      {selected && (
        <div className="flex-1 min-w-0">
          <EmailPanel
            email={selected}
            onArchive={handleArchive}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  )
}
