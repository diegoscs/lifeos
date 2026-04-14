'use client'

import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Task } from '@/types'

const priorityBar: Record<string, string> = {
  Alta:  'bg-red-500',
  Média: 'bg-yellow-500',
  Baixa: 'bg-neutral-600',
}

interface TaskItemProps {
  task: Task
  onToggle: (task: Task) => void
}

export default function TaskItem({ task, onToggle }: TaskItemProps) {
  const barColor = task.priority ? priorityBar[task.priority] : 'bg-neutral-800'
  const isComplete = task.complete

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-900 group transition-colors">
      {/* barra de prioridade */}
      <div className={clsx('w-0.5 h-8 rounded-full shrink-0', barColor)} />

      {/* checkbox */}
      <button
        onClick={() => onToggle(task)}
        className={clsx(
          'w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
          isComplete
            ? 'bg-neutral-600 border-neutral-600'
            : 'border-neutral-700 hover:border-neutral-500'
        )}
      >
        {isComplete && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* título */}
      <span
        className={clsx(
          'flex-1 text-sm min-w-0 truncate',
          isComplete ? 'line-through text-neutral-600' : 'text-neutral-200'
        )}
      >
        {task.title}
      </span>

      {/* meta info */}
      <div className="flex items-center gap-2 shrink-0">
        {task.projectName && (
          <span className="text-xs text-neutral-600 hidden group-hover:inline">
            {task.projectName}
          </span>
        )}
        {task.dueDate && (
          <span className="text-xs text-neutral-600">
            {format(parseISO(task.dueDate), 'd MMM', { locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  )
}
