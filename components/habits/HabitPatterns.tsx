'use client'

import type { Habit, HabitRecord } from '@/types'

interface HabitPatternsProps {
  habits: Habit[]
  records: HabitRecord[]
}

export default function HabitPatterns({ habits, records }: HabitPatternsProps) {
  const stats = habits.map((habit) => {
    const habitRecords = records.filter((r) => r.habit === habit.name)
    const done = habitRecords.filter((r) => r.completed).length
    const total = habitRecords.length
    const rate = total > 0 ? Math.round((done / total) * 100) : 0
    return { habit, done, total, rate }
  }).sort((a, b) => b.rate - a.rate)

  function barColor(rate: number) {
    if (rate >= 80) return 'bg-green-600'
    if (rate >= 50) return 'bg-yellow-600'
    return 'bg-red-700'
  }

  return (
    <div className="space-y-3">
      {stats.map(({ habit, done, total, rate }) => (
        <div key={habit.id} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300">{habit.name}</span>
            <span className="text-neutral-500">{done}/{total} dias · {rate}%</span>
          </div>
          <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor(rate)}`}
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
      ))}
      {stats.length === 0 && (
        <p className="text-sm text-neutral-600">Nenhum registro nos últimos 30 dias.</p>
      )}
    </div>
  )
}
