'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { useTasks } from '@/hooks/useTasks'
import TaskItem from '@/components/tasks/TaskItem'
import TaskInput from '@/components/tasks/TaskInput'
import Spinner from '@/components/ui/Spinner'
import type { Task, TaskStatus } from '@/types'

type Tab = 'hoje' | 'todas' | 'backlog' | 'someday'

const tabs: { key: Tab; label: string }[] = [
  { key: 'hoje',    label: 'Hoje' },
  { key: 'todas',   label: 'Todas' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'someday', label: 'Algum dia' },
]

// Ordenação: Data (asc, null por último) → Prioridade → Status
const PRIORITY_ORDER: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 }
const STATUS_ORDER: Record<TaskStatus, number> = {
  'Em andamento': 0,
  'A fazer': 1,
  'Pausada': 2,
  'Completada': 3,
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Data: sem data vai para o final
    const aDate = a.dueDate ?? 'zzzz'
    const bDate = b.dueDate ?? 'zzzz'
    if (aDate !== bDate) return aDate.localeCompare(bDate)

    // Prioridade
    const aPrio = PRIORITY_ORDER[a.priority ?? 'Baixa'] ?? 2
    const bPrio = PRIORITY_ORDER[b.priority ?? 'Baixa'] ?? 2
    if (aPrio !== bPrio) return aPrio - bPrio

    // Status
    const aStatus = STATUS_ORDER[a.status] ?? 1
    const bStatus = STATUS_ORDER[b.status] ?? 1
    return aStatus - bStatus
  })
}

function filterByTab(tasks: Task[], tab: Tab): Task[] {
  if (tab === 'hoje') {
    const pending = tasks.filter((t) => !t.complete)
    const done = tasks.filter((t) => t.complete).slice(0, 2)
    return [...pending, ...done]
  }
  if (tab === 'todas') {
    return sortTasks(tasks.filter((t) => !t.complete))
  }
  if (tab === 'backlog') {
    return tasks.filter((t) => t.status === 'A fazer' && !t.dueDate)
  }
  // someday
  return tasks.filter((t) => !t.dueDate && t.priority === 'Baixa')
}

export default function TarefasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hoje')
  const today = format(new Date(), 'yyyy-MM-dd')

  const { tasks, isLoading, isError, createTask, toggleComplete } = useTasks(
    activeTab === 'hoje' ? { dueDate: today } : {}
  )

  const visible = filterByTab(tasks, activeTab)
  const pendingCount = tasks.filter((t) => !t.complete).length

  return (
    <div className="max-w-2xl space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-neutral-900 rounded-lg p-1 w-fit">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeTab === key
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {!isLoading && activeTab === 'todas' && (
          <span className="text-xs text-neutral-600">{pendingCount} pendentes</span>
        )}
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-neutral-900 bg-neutral-950 divide-y divide-neutral-900">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {isError && (
          <div className="px-4 py-8 text-center text-sm text-red-400">
            Erro ao carregar tarefas.
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-neutral-600">
            Nenhuma tarefa aqui.
          </div>
        )}

        {!isLoading && visible.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={toggleComplete}
            showStatus={activeTab === 'todas'}
          />
        ))}

        <TaskInput onAdd={createTask} />
      </div>
    </div>
  )
}
