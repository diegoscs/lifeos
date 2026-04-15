'use client'

import { format } from 'date-fns'
import { useTasks } from './useTasks'
import { useHabits, useHabitRecords } from './useHabits'

export function useMetrics() {
  const today = format(new Date(), 'yyyy-MM-dd')

  const { tasks, isLoading: tasksLoading } = useTasks({ dueDate: today })
  const { habits, isLoading: habitsLoading } = useHabits()
  const { records, isLoading: recordsLoading } = useHabitRecords(30)

  const pendingToday = tasks.filter((t) => !t.complete).length

  // Longest streak: maior sequência de dias com 100% dos hábitos
  function calcLongestStreak(): number {
    if (habits.length === 0) return 0

    let longestStreak = 0
    let currentStreak = 0

    for (let i = 90; i >= 0; i--) {
      const date = format(new Date(Date.now() - i * 86400000), 'yyyy-MM-dd')
      const dayRecords = records.filter((r) => r.date === date)
      const completedCount = dayRecords.filter((r) => r.completed).length

      if (completedCount >= habits.length) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return longestStreak
  }

  return {
    pendingToday,
    longestStreak: calcLongestStreak(),
    activeHabits: habits.length,
    isLoading: tasksLoading || habitsLoading || recordsLoading,
  }
}
