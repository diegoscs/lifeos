'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { priorityColors } from '@/lib/colors'
import { useTasks } from '@/hooks/useTasks'
import Spinner from '@/components/ui/Spinner'

export default function TasksCard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { tasks: tasksToday, isLoading: todayLoading } = useTasks({ dueDate: today })
  const { tasks: allTasks, isLoading: allLoading } = useTasks({})

  const isLoading = todayLoading || allLoading
  const todayPending = tasksToday.filter((t) => !t.complete)
  const allActive = allTasks.filter((t) => t.status !== 'Completada' && t.status !== 'Pausada')

  // Se todas as tarefas de hoje estão feitas
  const todayAllDone = tasksToday.length > 0 && todayPending.length === 0

  // Se tudo está concluído ou pausado
  const everythingDone = allTasks.length > 0 && allActive.length === 0

  // Escolhe qual lista mostrar
  const visibleTasks = todayAllDone ? allTasks : tasksToday
  const pending = visibleTasks.filter((t) => !t.complete && t.status !== 'Pausada')
  const done = visibleTasks.filter((t) => t.complete || t.status === 'Pausada').slice(0, 2)
  const visible = [...pending, ...done]

  const title = todayAllDone ? 'Tarefas a fazer' : 'Tarefas de hoje'

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wide">{title}</h2>
        <Link href="/tarefas" className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors">
          ver todas →
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4"><Spinner /></div>
      )}

      {!isLoading && everythingDone && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-2xl mb-2">✨</p>
          <p className="text-sm text-green-400 font-medium">Nada a fazer, tarefas concluídas!</p>
        </div>
      )}

      {!isLoading && !everythingDone && visible.length === 0 && (
        <p className="text-sm text-neutral-600 py-2">Nenhuma tarefa.</p>
      )}

      {!isLoading && !everythingDone && visible.map((task) => (
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
