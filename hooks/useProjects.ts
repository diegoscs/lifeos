'use client'

import useSWR from 'swr'
import type { Project } from '@/types'

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
const fetcher = async (url: string): Promise<Project[]> => {
  const res = await fetch(url)

  if (!res.ok) {
    let details: unknown
    try {
      details = await res.json()
    } catch {
      details = await res.text()
    }

    throw new ApiError(
      `Failed to fetch projects: ${res.statusText}`,
      res.status,
      details
    )
  }

  try {
    return await res.json()
  } catch (e) {
    throw new ApiError(
      'Failed to parse projects response',
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export function useProjects() {
  const { data, error, isLoading } = useSWR<Project[]>(
    '/api/notion/projects',
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  return {
    projects: data ?? [],
    isLoading,
    isError: !!error,
    error: error instanceof ApiError ? error : undefined,
  }
}
