'use client'

import useSWR from 'swr'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types'

/**
 * Erros diferenciados da API
 */
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Fetcher com error handling diferenciado
 */
const fetcher = async (url: string): Promise<Task[]> => {
  const res = await fetch(url)

  if (!res.ok) {
    let details: unknown
    try {
      details = await res.json()
    } catch {
      details = await res.text()
    }

    throw new ApiError(
      `Failed to fetch tasks: ${res.statusText}`,
      res.status,
      details
    )
  }

  try {
    return await res.json()
  } catch (e) {
    throw new ApiError(
      'Failed to parse tasks response',
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

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
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    dedupingInterval: 60000,
  })

  /**
   * Realiza requisição com erro handling
   */
  const apiRequest = async (
    method: 'POST' | 'PATCH',
    body: unknown
  ): Promise<Task> => {
    const res = await fetch('/api/notion/tasks', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let details: unknown
      try {
        details = await res.json()
      } catch {
        details = await res.text()
      }

      throw new ApiError(
        `Failed to ${method === 'POST' ? 'create' : 'update'} task`,
        res.status,
        details
      )
    }

    try {
      return await res.json()
    } catch (e) {
      throw new ApiError(
        'Failed to parse task response',
        500,
        e instanceof Error ? e.message : String(e)
      )
    }
  }

  async function createTask(input: CreateTaskInput) {
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

    try {
      await mutate(
        async (current = []) => {
          const created = await apiRequest('POST', input)
          return [...current, created]
        },
        {
          optimisticData: (current = []) => [...current, optimistic],
          rollbackOnError: true,
        }
      )
    } catch (err) {
      if (err instanceof ApiError) {
        console.error(`[createTask] ${err.status}: ${err.message}`, err.details)
      } else {
        console.error('[createTask]', err)
      }
      throw err
    }
  }

  async function updateTask(input: UpdateTaskInput) {
    try {
      await mutate(
        async (current = []) => {
          const updated = await apiRequest('PATCH', input)
          return current.map((t) => (t.id === updated.id ? updated : t))
        },
        {
          optimisticData: (current = []) =>
            current.map((t) => (t.id === input.id ? { ...t, ...input } : t)),
          rollbackOnError: true,
        }
      )
    } catch (err) {
      if (err instanceof ApiError) {
        console.error(`[updateTask] ${err.status}: ${err.message}`, err.details)
      } else {
        console.error('[updateTask]', err)
      }
      throw err
    }
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
    error: error instanceof ApiError ? error : undefined,
    createTask,
    updateTask,
    toggleComplete,
    mutate,
  }
}
