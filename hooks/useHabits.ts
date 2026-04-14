'use client'

import useSWR from 'swr'
import { format, subDays } from 'date-fns'
import type { Habit, HabitRecord, CreateRecordInput } from '@/types'

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
const createFetcher = <T,>(endpoint: string) => async (url: string): Promise<T> => {
  const res = await fetch(url)

  if (!res.ok) {
    let details: unknown
    try {
      details = await res.json()
    } catch {
      details = await res.text()
    }

    throw new ApiError(
      `Failed to fetch ${endpoint}: ${res.statusText}`,
      res.status,
      details
    )
  }

  try {
    return await res.json()
  } catch (e) {
    throw new ApiError(
      `Failed to parse ${endpoint} response`,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export function useHabits() {
  const { data, error, isLoading } = useSWR<Habit[]>(
    '/api/notion/habits',
    createFetcher('habits'),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )
  return { habits: data ?? [], isLoading, isError: !!error, error: error instanceof ApiError ? error : undefined }
}

export function useHabitRecords(days = 7) {
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
  const key = `/api/notion/records?startDate=${startDate}&endDate=${endDate}`

  const { data, error, isLoading, mutate } = useSWR<HabitRecord[]>(
    key,
    createFetcher('habit records'),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  /**
   * Realiza requisição com erro handling
   */
  const apiRequest = async (
    method: 'POST' | 'PATCH',
    body: unknown
  ): Promise<HabitRecord> => {
    const res = await fetch('/api/notion/records', {
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
        `Failed to ${method === 'POST' ? 'check in' : 'update'} record`,
        res.status,
        details
      )
    }

    try {
      return await res.json()
    } catch (e) {
      throw new ApiError(
        'Failed to parse record response',
        500,
        e instanceof Error ? e.message : String(e)
      )
    }
  }

  // Cria novo registro (quando não existe nenhum para aquele dia/hábito)
  async function checkIn(input: CreateRecordInput) {
    try {
      await mutate(
        async (current = []) => {
          const created = await apiRequest('POST', input)
          return [created, ...current]
        },
        { rollbackOnError: true }
      )
    } catch (err) {
      if (err instanceof ApiError) {
        console.error(`[checkIn] ${err.status}: ${err.message}`, err.details)
      } else {
        console.error('[checkIn]', err)
      }
      throw err
    }
  }

  // Atualiza registro existente (quando já existe um para aquele dia/hábito)
  async function updateRecord(id: string, completed: boolean, failReason?: string) {
    try {
      await mutate(
        async (current = []) => {
          const updated = await apiRequest('PATCH', { id, completed, failReason })
          return current.map((r) => (r.id === id ? updated : r))
        },
        {
          optimisticData: (current = []) =>
            current.map((r) => (r.id === id ? { ...r, completed, failReason: failReason ?? null } : r)),
          rollbackOnError: true,
        }
      )
    } catch (err) {
      if (err instanceof ApiError) {
        console.error(`[updateRecord] ${err.status}: ${err.message}`, err.details)
      } else {
        console.error('[updateRecord]', err)
      }
      throw err
    }
  }

  function getRecord(habitName: string, date: string) {
    return (data ?? []).find((r) => r.habit === habitName && r.date === date) ?? null
  }

  function getRecordsForHabit(habitName: string) {
    return (data ?? [])
      .filter((r) => r.habit === habitName)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }

  return {
    records: data ?? [],
    isLoading,
    isError: !!error,
    error: error instanceof ApiError ? error : undefined,
    checkIn,
    updateRecord,
    getRecord,
    getRecordsForHabit,
    mutate,
  }
}
