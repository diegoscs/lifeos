'use client'

import Link from 'next/link'
import { format, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import { useHabits, useHabitRecords } from '@/hooks/useHabits'
import Spinner from '@/components/ui/Spinner'

export default function HabitsCard() {
  const { habits, isLoading: habitsLoading } = useHabits()
  const { records, isLoading: recordsLoading } = useHabitRecords(7)
  const isLoading = habitsLoading || recordsLoading

  const today = new Date()
  // Segunda-feira da semana atual (locale pt-BR usa segunda como primeiro dia)
  const monday = startOfWeek(today, { locale: ptBR })
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

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

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-4">
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
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div key={day.toISOString()} className="flex flex-col items-center gap-2">
              <div className={clsx('w-full aspect-square rounded', getDotColor(day))} />
              <span className="text-[10px] text-neutral-600 font-medium text-center">
                {format(day, 'EEE', { locale: ptBR })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
