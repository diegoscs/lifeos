'use client'

import useSWR from 'swr'
import type { Project } from '@/types'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
  })

export function useProjects() {
  const { data, error, isLoading } = useSWR<Project[]>(
    '/api/notion/projects',
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    projects: data ?? [],
    isLoading,
    isError: !!error,
  }
}
