'use client'

import { clsx } from 'clsx'
import type { EmailMessage } from '@/hooks/useEmails'

interface EmailPanelProps {
  email: EmailMessage
  onArchive: (id: string) => void
  onClose: () => void
}

function parseFrom(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/)
  if (match) return { name: match[1].trim(), address: match[2].trim() }
  return { name: from, address: from }
}

export default function EmailPanel({ email, onArchive, onClose }: EmailPanelProps) {
  const { name, address } = parseFrom(email.from)

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-l border-neutral-900">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-900">
        <div className="space-y-0.5 flex-1 min-w-0">
          <h2 className="text-sm font-medium text-white truncate">
            {email.subject || '(sem assunto)'}
          </h2>
          <p className="text-xs text-neutral-500">
            {name} <span className="text-neutral-700">&lt;{address}&gt;</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-600 hover:text-neutral-300 ml-3 shrink-0 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Snippet / corpo */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
          {email.snippet}
        </p>
        <p className="text-xs text-neutral-700 mt-4">
          Corpo completo disponível no cliente de e-mail original.
        </p>
      </div>

      {/* Ações */}
      <div className="px-5 py-3 border-t border-neutral-900 flex items-center gap-2">
        <button
          onClick={() => onArchive(email.id)}
          className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 transition-colors"
        >
          Arquivar
        </button>
        <a
          href={
            email.provider === 'gmail'
              ? `https://mail.google.com/mail/u/0/#inbox/${email.threadId}`
              : `https://outlook.live.com/mail/0/inbox`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 transition-colors"
        >
          Abrir original ↗
        </a>
      </div>
    </div>
  )
}
