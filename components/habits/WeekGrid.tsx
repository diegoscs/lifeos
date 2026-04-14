'use client'

import { format, startOfWeek, addDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import type { Habit, HabitRecord } from '@/types'

interface WeekGridProps {
  habits: Habit[]
  records: HabitRecord[]
}

export default function WeekGrid({ habits, records }: WeekGridProps) {
  const today = new Date()
  const monday = startOfWeek(today, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  function getRecord(habitName: string, date: Date): HabitRecord | null {
    const dateStr = format(date, 'yyyy-MM-dd')
    return records.find((r) => r.habit === habitName && r.date === dateStr) ?? null
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-neutral-600 font-normal pb-2 pr-4 w-36">Hábito</th>
            {days.map((day) => (
              <th key={day.toISOString()} className="text-center text-neutral-600 font-normal pb-2 px-1 min-w-[40px]">
                <div>{format(day, 'EEE', { locale: ptBR })}</div>
                <div className="text-neutral-700">{format(day, 'd')}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-900">
          {habits.map((habit) => (
            <tr key={habit.id}>
              <td className="py-2 pr-4 text-neutral-400 truncate max-w-[144px]">{habit.name}</td>
              {days.map((day) => {
                const record = getRecord(habit.name, day)
                const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                const isFuture = day > today

                return (
                  <td key={day.toISOString()} className="py-2 px-1 text-center">
                    <div className={clsx(
                      'w-7 h-7 rounded-md mx-auto flex items-center justify-center',
                      isFuture && 'bg-neutral-900 opacity-30',
                      !isFuture && !record && 'bg-neutral-900',
                      record?.completed && 'bg-green-600',
                      record && !record.completed && 'bg-red-900/60',
                      isToday && !record && 'ring-1 ring-neutral-700',
                    )}>
                      {record?.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {record && !record.completed && (
                        <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 10 10">
                          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
