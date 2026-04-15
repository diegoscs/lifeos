'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useTasks } from '@/hooks/useTasks'

export default function CompletedTasksCard() {
  const [view, setView] = useState<'today' | 'total'>('today')
  const today = format(new Date(), 'yyyy-MM-dd')

  const { tasks: tasksToday, isLoading: todayLoading } = useTasks({
    dueDate: today,
  })
  const { tasks: allTasks, isLoading: allLoading } = useTasks({})

  const completedToday = tasksToday.filter((t) => t.complete).length
  const completedTotal = allTasks.filter((t) => t.complete).length

  const isLoading = view === 'today' ? todayLoading : allLoading
  const value = view === 'today' ? completedToday : completedTotal
  const sub = view === 'today' ? 'hoje' : 'total'

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl px-5 py-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-neutral-600 uppercase tracking-wide">Tarefas concluídas</p>
          <p className="text-2xl font-semibold text-white">{isLoading ? '—' : value}</p>
          <p className="text-xs text-neutral-600">{sub}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setView('today')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            view === 'today'
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
          }`}
        >
          Hoje
        </button>
        <button
          onClick={() => setView('total')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            view === 'total'
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
          }`}
        >
          Total
        </button>
      </div>
    </div>
  )
}
