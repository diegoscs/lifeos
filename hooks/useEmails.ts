'use client'

import useSWR from 'swr'

export interface EmailMessage {
  id: string
  threadId: string
  from: string
  subject: string
  snippet: string
  date: string
  isRead: boolean
  labels: string[]
  provider: 'gmail' | 'outlook'
  account: string
}

interface EmailsResponse {
  messages: EmailMessage[]
  connected: { provider: string; email: string }[]
}

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
const fetcher = async (url: string): Promise<EmailsResponse> => {
  const res = await fetch(url)

  if (!res.ok) {
    let details: unknown
    try {
      details = await res.json()
    } catch {
      details = await res.text()
    }

    throw new ApiError(
      `Failed to fetch emails: ${res.statusText}`,
      res.status,
      details
    )
  }

  try {
    return await res.json()
  } catch (e) {
    throw new ApiError(
      'Failed to parse emails response',
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export function useEmails() {
  const { data, error, isLoading, mutate } = useSWR<EmailsResponse>(
    '/api/emails',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 5 * 60 * 1000, // revalida a cada 5 min
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 10000, // 10s (emails são menos críticos)
    }
  )

  return {
    messages: data?.messages ?? [],
    connected: data?.connected ?? [],
    isLoading,
    isError: !!error,
    error: error instanceof ApiError ? error : undefined,
    mutate,
  }
}
