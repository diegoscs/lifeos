'use client'

import useSWR from 'swr'
import { format, subDays } from 'date-fns'
import type { Habit, HabitRecord, CreateRecordInput } from '@/types'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
  })

// Hábitos ativos
export function useHabits() {
  const { data, error, isLoading } = useSWR<Habit[]>(
    '/api/notion/habits',
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    habits: data ?? [],
    isLoading,
    isError: !!error,
  }
}

// Registros dos últimos N dias (padrão: 7)
export function useHabitRecords(days = 7) {
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
  const key = `/api/notion/records?startDate=${startDate}&endDate=${endDate}`

  const { data, error, isLoading, mutate } = useSWR<HabitRecord[]>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  )

  async function checkIn(input: CreateRecordInput) {
    await mutate(
      async (current = []) => {
        const res = await fetch('/api/notion/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (!res.ok) throw new Error('Failed to check in')
        const created: HabitRecord = await res.json()
        return [created, ...current]
      },
      { rollbackOnError: true }
    )
  }

  // Retorna se um hábito foi registrado em uma data específica
  function getRecord(habitName: string, date: string) {
    return (data ?? []).find(
      (r) => r.habit === habitName && r.date === date
    ) ?? null
  }

  // Retorna registros de um hábito ordenados por data desc
  function getRecordsForHabit(habitName: string) {
    return (data ?? [])
      .filter((r) => r.habit === habitName)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }

  return {
    records: data ?? [],
    isLoading,
    isError: !!error,
    checkIn,
    getRecord,
    getRecordsForHabit,
    mutate,
  }
}
