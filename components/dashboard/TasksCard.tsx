'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { priorityColors } from '@/lib/colors'
import { useTasks } from '@/hooks/useTasks'
import Spinner from '@/components/ui/Spinner'

export default function TasksCard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { tasks, isLoading } = useTasks({ dueDate: today })

  const pending = tasks.filter((t) => !t.complete)
  const done = tasks.filter((t) => t.complete).slice(0, 2)
  const visible = [...pending, ...done]

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wide">Tarefas de hoje</h2>
        <Link href="/tarefas" className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors">
          ver todas →
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4"><Spinner /></div>
      )}

      {!isLoading && visible.length === 0 && (
        <p className="text-sm text-neutral-600 py-2">Nenhuma tarefa para hoje.</p>
      )}

      {!isLoading && visible.map((task) => (
        <div key={task.id} className="flex items-center gap-2.5">
          <div className={clsx(
            'w-0.5 h-6 rounded-full shrink-0',
            task.priority ? priorityColors[task.priority] : 'bg-neutral-800'
          )} />
          <div className={clsx(
            'w-3.5 h-3.5 rounded border shrink-0',
            task.complete ? 'bg-neutral-600 border-neutral-600' : 'border-neutral-700'
          )} />
          <span className={clsx(
            'text-sm flex-1 truncate',
            task.complete ? 'line-through text-neutral-600' : 'text-neutral-300'
          )}>
            {task.title}
          </span>
        </div>
      ))}
    </div>
  )
}
