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

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
  })

export function useEmails() {
  const { data, error, isLoading, mutate } = useSWR<EmailsResponse>(
    '/api/emails',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 5 * 60 * 1000 } // revalida a cada 5 min
  )

  return {
    messages: data?.messages ?? [],
    connected: data?.connected ?? [],
    isLoading,
    isError: !!error,
    mutate,
  }
}
