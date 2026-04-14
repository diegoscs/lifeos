'use client'

import { clsx } from 'clsx'
import { formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { EmailMessage } from '@/hooks/useEmails'

interface EmailItemProps {
  email: EmailMessage
  isSelected: boolean
  onClick: () => void
}

function parseFrom(from: string): { name: string; address: string } {
  const match = from.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/)
  if (match) return { name: match[1].trim(), address: match[2].trim() }
  return { name: from, address: from }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (!isValid(date)) return dateStr
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
  } catch {
    return dateStr
  }
}

export default function EmailItem({ email, isSelected, onClick }: EmailItemProps) {
  const { name } = parseFrom(email.from)
  const providerColor = email.provider === 'gmail' ? 'bg-red-500' : 'bg-blue-500'

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left px-4 py-3 border-b border-neutral-900 transition-colors',
        isSelected ? 'bg-neutral-800' : 'hover:bg-neutral-900',
        !email.isRead && 'border-l-2 border-l-white'
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* indicador de provider */}
        <div className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', providerColor)} />

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className={clsx(
              'text-sm truncate',
              email.isRead ? 'text-neutral-400' : 'text-white font-medium'
            )}>
              {name}
            </span>
            <span className="text-xs text-neutral-600 shrink-0">{formatDate(email.date)}</span>
          </div>
          <p className={clsx(
            'text-xs truncate',
            email.isRead ? 'text-neutral-600' : 'text-neutral-400'
          )}>
            {email.subject || '(sem assunto)'}
          </p>
          <p className="text-xs text-neutral-700 truncate">{email.snippet}</p>
        </div>
      </div>
    </button>
  )
}
