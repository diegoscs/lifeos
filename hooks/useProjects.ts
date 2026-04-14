'use client'

import useSWR from 'swr'
import type { Project } from '@/types'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
  })

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    '/api/notion/projects',
    fetcher,
    { revalidateOnFocus: false }
  )

  async function updateProject(id: string, patch: { nextAction?: string; progress?: number }) {
    await mutate(
      async (current = []) => {
        const res = await fetch('/api/notion/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...patch }),
        })
        if (!res.ok) throw new Error('Failed to update project')
        const updated: Project = await res.json()
        return current.map((p) => (p.id === id ? updated : p))
      },
      {
        optimisticData: (current = []) =>
          current.map((p) =>
            p.id === id
              ? {
                  ...p,
                  nextAction: patch.nextAction ?? p.nextAction,
                  progress: patch.progress ?? p.progress,
                }
              : p
          ),
        rollbackOnError: true,
      }
    )
  }

  return {
    projects: data ?? [],
    isLoading,
    isError: !!error,
    updateProject,
  }
}
