'use client'

import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import { useHabits, useHabitRecords } from '@/hooks/useHabits'
import Spinner from '@/components/ui/Spinner'

export default function HabitsCard() {
  const { habits, isLoading: habitsLoading } = useHabits()
  const { records, isLoading: recordsLoading } = useHabitRecords(7)
  const isLoading = habitsLoading || recordsLoading

  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))

  // Streak: dias consecutivos com todos os hábitos concluídos
  function calcStreak(): number {
    let streak = 0
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(today, i), 'yyyy-MM-dd')
      const dayRecords = records.filter((r) => r.date === date)
      const allDone = habits.length > 0 && dayRecords.filter((r) => r.completed).length === habits.length
      if (allDone) streak++
      else break
    }
    return streak
  }

  function getDotColor(date: Date): string {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayRecords = records.filter((r) => r.date === dateStr)
    if (dayRecords.length === 0) return 'bg-neutral-800'
    const done = dayRecords.filter((r) => r.completed).length
    const ratio = done / habits.length
    if (ratio === 0) return 'bg-red-900'
    if (ratio < 1) return 'bg-yellow-700'
    return 'bg-green-600'
  }

  const streak = calcStreak()

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wide">Hábitos</h2>
        <Link href="/habitos" className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors">
          ver todos →
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4"><Spinner /></div>
      )}

      {!isLoading && (
        <>
          {/* streak */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-white">{streak}</span>
            <span className="text-sm text-neutral-500">dia{streak !== 1 ? 's' : ''} seguidos</span>
          </div>

          {/* quadradinhos dos últimos 7 dias */}
          <div className="flex gap-1.5">
            {days.map((day) => (
              <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1">
                <div className={clsx('w-full h-6 rounded', getDotColor(day))} />
                <span className="text-[10px] text-neutral-700">
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
