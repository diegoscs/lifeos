'use client'

import useSWR from 'swr'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
  })

interface UseTasksOptions {
  status?: string
  dueDate?: string
  projectId?: string
}

export function useTasks(options: UseTasksOptions = {}) {
  const params = new URLSearchParams()
  if (options.status) params.set('status', options.status)
  if (options.dueDate) params.set('dueDate', options.dueDate)
  if (options.projectId) params.set('projectId', options.projectId)

  const query = params.toString()
  const key = `/api/notion/tasks${query ? `?${query}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<Task[]>(key, fetcher, {
    revalidateOnFocus: false,
  })

  async function createTask(input: CreateTaskInput) {
    // Optimistic update
    const optimistic: Task = {
      id: `temp-${Date.now()}`,
      title: input.title,
      priority: input.priority ?? null,
      status: 'A fazer',
      dueDate: input.dueDate ?? null,
      projectId: input.projectId ?? null,
      projectName: null,
      complete: false,
    }

    await mutate(
      async (current = []) => {
        const res = await fetch('/api/notion/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (!res.ok) throw new Error('Failed to create task')
        const created: Task = await res.json()
        return [...current, created]
      },
      { optimisticData: (current = []) => [...current, optimistic], rollbackOnError: true }
    )
  }

  async function updateTask(input: UpdateTaskInput) {
    await mutate(
      async (current = []) => {
        const res = await fetch('/api/notion/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (!res.ok) throw new Error('Failed to update task')
        const updated: Task = await res.json()
        return current.map((t) => (t.id === updated.id ? updated : t))
      },
      {
        optimisticData: (current = []) =>
          current.map((t) =>
            t.id === input.id ? { ...t, ...input } : t
          ),
        rollbackOnError: true,
      }
    )
  }

  async function toggleComplete(task: Task) {
    await updateTask({
      id: task.id,
      complete: !task.complete,
      status: !task.complete ? 'Completada' : 'A fazer',
    })
  }

  return {
    tasks: data ?? [],
    isLoading,
    isError: !!error,
    createTask,
    updateTask,
    toggleComplete,
    mutate,
  }
}
