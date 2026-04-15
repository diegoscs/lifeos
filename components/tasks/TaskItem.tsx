'use client'

import { clsx } from 'clsx'
import { format, parseISO, isToday, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { priorityColors } from '@/lib/colors'
import type { Task, TaskStatus } from '@/types'

const statusBadge: Record<TaskStatus, { label: string; className: string }> = {
  'Em andamento': { label: 'Em andamento', className: 'bg-blue-900/50 text-blue-400 border-blue-900' },
  'A fazer':      { label: 'A fazer',      className: 'bg-neutral-800 text-neutral-500 border-neutral-700' },
  'Pausada':      { label: 'Pausada',      className: 'bg-yellow-900/30 text-yellow-700 border-yellow-900/50' },
  'Completada':   { label: 'Concluída',    className: 'bg-neutral-800 text-neutral-600 border-neutral-800' },
}

interface TaskItemProps {
  task: Task
  onToggle: (task: Task) => void
  showStatus?: boolean
}

export default function TaskItem({ task, onToggle, showStatus = false }: TaskItemProps) {
  const barColor = task.priority ? priorityColors[task.priority] : 'bg-neutral-800'
  const isComplete = task.complete

  const dueDateLabel = task.dueDate
    ? (() => {
        const d = parseISO(task.dueDate)
        if (isToday(d)) return { label: 'Hoje', color: 'text-blue-400' }
        if (isPast(d) && !isComplete) return { label: format(d, 'd MMM', { locale: ptBR }), color: 'text-red-400' }
        return { label: format(d, 'd MMM', { locale: ptBR }), color: 'text-neutral-600' }
      })()
    : null

  const badge = showStatus && !isComplete ? statusBadge[task.status] : null

  return (
    <div className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg hover:bg-neutral-900 group transition-colors">
      {/* barra de prioridade */}
      <div className={clsx('w-0.5 h-8 rounded-full shrink-0', barColor)} />

      {/* checkbox — min 44px touch target on mobile */}
      <button
        onClick={() => onToggle(task)}
        aria-label={isComplete ? `Desmarcar: ${task.title}` : `Concluir: ${task.title}`}
        className={clsx(
          'w-5 h-5 md:w-4 md:h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
          isComplete
            ? 'bg-neutral-600 border-neutral-600'
            : 'border-neutral-700 hover:border-neutral-400'
        )}
      >
        {isComplete && (
          <svg className="w-3 h-3 md:w-2.5 md:h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* título */}
      <span className={clsx(
        'flex-1 text-sm min-w-0 truncate',
        isComplete ? 'line-through text-neutral-600' : 'text-neutral-200'
      )}>
        {task.title}
      </span>

      {/* meta info */}
      <div className="flex items-center gap-2 shrink-0">
        {/* badge de status — oculto em telas muito pequenas */}
        {badge && (
          <span className={clsx(
            'hidden sm:inline px-1.5 py-0.5 rounded text-[10px] border',
            badge.className
          )}>
            {badge.label}
          </span>
        )}

        {/* badge projeto — oculto em telas muito pequenas */}
        {task.projectName && (
          <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-500 border border-neutral-800 group-hover:border-neutral-700 transition-colors truncate max-w-[80px]">
            {task.projectName}
          </span>
        )}

        {/* data */}
        {dueDateLabel && (
          <span className={clsx('text-xs', dueDateLabel.color)}>
            {dueDateLabel.label}
          </span>
        )}
      </div>
    </div>
  )
}
