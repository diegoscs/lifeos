'use client'

import { useState, useRef } from 'react'
import { format, parseISO, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import type { Project } from '@/types'

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  'Não iniciada': {
    label: 'Não iniciada',
    className: 'bg-neutral-800 text-neutral-500 border-neutral-700',
    dot: 'bg-neutral-600',
  },
  'Em andamento': {
    label: 'Em andamento',
    className: 'bg-blue-900/40 text-blue-400 border-blue-900',
    dot: 'bg-blue-500',
  },
  'Concluído': {
    label: 'Concluído',
    className: 'bg-green-900/30 text-green-500 border-green-900/50',
    dot: 'bg-green-500',
  },
}

const categoryColor: Record<string, string> = {
  'Cliente':        'text-purple-400',
  'Portfolio':      'text-blue-400',
  'Produto Próprio':'text-orange-400',
  'Site':           'text-cyan-400',
}

const priorityBar: Record<string, string> = {
  Alta:  'bg-red-500',
  Média: 'bg-yellow-500',
  Baixa: 'bg-neutral-700',
}

interface ProjectCardProps {
  project: Project
  onUpdate: (id: string, patch: { nextAction?: string }) => Promise<void>
}

export default function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const [editingAction, setEditingAction] = useState(false)
  const [actionValue, setActionValue] = useState(project.nextAction ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  const status = project.status ? statusConfig[project.status] : null
  const progress = project.progress ?? 0
  const barColor = progress >= 80 ? 'bg-green-500' : progress >= 40 ? 'bg-blue-500' : 'bg-neutral-600'

  const deadlineLabel = project.deadline
    ? (() => {
        const d = parseISO(project.deadline)
        const overdue = isPast(d) && project.status !== 'Concluído'
        return {
          label: format(d, "d 'de' MMM", { locale: ptBR }),
          color: overdue ? 'text-red-400' : 'text-neutral-600',
        }
      })()
    : null

  function startEditAction() {
    setActionValue(project.nextAction ?? '')
    setEditingAction(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function saveAction() {
    setEditingAction(false)
    if (actionValue !== project.nextAction) {
      await onUpdate(project.id, { nextAction: actionValue })
    }
  }

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3 hover:border-neutral-800 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* priority dot */}
          <div className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            project.priority ? priorityBar[project.priority] : 'bg-neutral-700'
          )} />
          <h3 className="text-sm font-medium text-neutral-100 truncate">{project.name}</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {project.category && (
            <span className={clsx('text-[10px]', categoryColor[project.category] ?? 'text-neutral-500')}>
              {project.category}
            </span>
          )}
          {status && (
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-[10px] border whitespace-nowrap',
              status.className
            )}>
              {status.label}
            </span>
          )}
        </div>
      </div>

      {/* Barra de progresso (calculada pelas tasks) */}
      {project.progress !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-neutral-600">
            <span>Tasks concluídas</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', barColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Próxima ação */}
      <div>
        {editingAction ? (
          <input
            ref={inputRef}
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            onBlur={saveAction}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveAction()
              if (e.key === 'Escape') setEditingAction(false)
            }}
            placeholder="Próxima ação..."
            className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-200 placeholder-neutral-700 outline-none focus:border-neutral-500"
          />
        ) : (
          <button
            onClick={startEditAction}
            className="text-left w-full"
          >
            {project.nextAction ? (
              <p className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors line-clamp-2">
                → {project.nextAction}
              </p>
            ) : (
              <p className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors">
                + Adicionar próxima ação
              </p>
            )}
          </button>
        )}
      </div>

      {/* Footer */}
      {(deadlineLabel || project.deployUrl) && (
        <div className="flex items-center justify-between pt-0.5">
          {deadlineLabel ? (
            <span className={clsx('text-[10px]', deadlineLabel.color)}>
              Prazo: {deadlineLabel.label}
            </span>
          ) : <span />}

          {project.deployUrl && (
            <a
              href={project.deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-neutral-700 hover:text-neutral-400 transition-colors"
            >
              ↗ Deploy
            </a>
          )}
        </div>
      )}
    </div>
  )
}
