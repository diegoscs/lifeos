'use client'

import useSWR from 'swr'
import { format, subDays } from 'date-fns'
import type { Habit, HabitRecord, CreateRecordInput } from '@/types'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
  })

export function useHabits() {
  const { data, error, isLoading } = useSWR<Habit[]>(
    '/api/notion/habits',
    fetcher,
    { revalidateOnFocus: false }
  )
  return { habits: data ?? [], isLoading, isError: !!error }
}

export function useHabitRecords(days = 7) {
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
  const key = `/api/notion/records?startDate=${startDate}&endDate=${endDate}`

  const { data, error, isLoading, mutate } = useSWR<HabitRecord[]>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Cria novo registro (quando não existe nenhum para aquele dia/hábito)
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

  // Atualiza registro existente (quando já existe um para aquele dia/hábito)
  async function updateRecord(id: string, completed: boolean, failReason?: string) {
    await mutate(
      async (current = []) => {
        const res = await fetch('/api/notion/records', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, completed, failReason }),
        })
        if (!res.ok) throw new Error('Failed to update record')
        const updated: HabitRecord = await res.json()
        return current.map((r) => (r.id === id ? updated : r))
      },
      {
        optimisticData: (current = []) =>
          current.map((r) => r.id === id ? { ...r, completed, failReason: failReason ?? null } : r),
        rollbackOnError: true,
      }
    )
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
    checkIn,
    updateRecord,
    getRecord,
    getRecordsForHabit,
    mutate,
  }
}
