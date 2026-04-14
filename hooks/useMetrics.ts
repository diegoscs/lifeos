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

  // Streak: dias consecutivos com 100% dos hábitos
  function calcStreak(): number {
    let streak = 0
    for (let i = 0; i < 30; i++) {
      const date = format(new Date(Date.now() - i * 86400000), 'yyyy-MM-dd')
      const dayRecords = records.filter((r) => r.date === date)
      const allDone =
        habits.length > 0 &&
        dayRecords.filter((r) => r.completed).length >= habits.length
      if (allDone) streak++
      else break
    }
    return streak
  }

  return {
    pendingToday,
    habitStreak: calcStreak(),
    activeHabits: habits.length,
    isLoading: tasksLoading || habitsLoading || recordsLoading,
  }
}
