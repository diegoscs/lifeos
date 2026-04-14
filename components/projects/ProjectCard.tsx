'use client'

import { format, parseISO, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import type { Project } from '@/types'

const statusConfig: Record<string, { label: string; className: string }> = {
  'Não iniciada': {
    label: 'Não iniciada',
    className: 'bg-neutral-800 text-neutral-500 border-neutral-700',
  },
  'Em andamento': {
    label: 'Em andamento',
    className: 'bg-blue-900/40 text-blue-400 border-blue-900',
  },
  'Concluído': {
    label: 'Concluído',
    className: 'bg-green-900/30 text-green-500 border-green-900/50',
  },
}

const categoryColor: Record<string, string> = {
  'Cliente':         'text-purple-400',
  'Portfolio':       'text-blue-400',
  'Produto Próprio': 'text-orange-400',
  'Site':            'text-cyan-400',
}

const priorityBar: Record<string, string> = {
  Alta:  'bg-red-500',
  Média: 'bg-yellow-500',
  Baixa: 'bg-neutral-700',
}

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
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

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3 hover:border-neutral-800 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
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
