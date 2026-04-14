'use client'

import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import type { HabitRecord } from '@/types'

interface MonthCalendarProps {
  records: HabitRecord[]
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function MonthCalendar({ records }: MonthCalendarProps) {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Start grid from Monday of the week containing the 1st
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })

  // Build all days until we cover the whole month (full weeks)
  const days: Date[] = []
  let cur = gridStart
  while (cur <= monthEnd || days.length % 7 !== 0) {
    days.push(cur)
    cur = addDays(cur, 1)
    if (cur > monthEnd && days.length % 7 === 0) break
  }

  // Aggregate by date: count done / total habits with any record that day
  function getDayStats(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayRecords = records.filter((r) => r.date === dateStr)
    const done = dayRecords.filter((r) => r.completed).length
    const total = dayRecords.length
    return { done, total }
  }

  function dotColor(done: number, total: number): string {
    if (total === 0) return ''
    const rate = done / total
    if (rate === 1) return 'bg-green-500'
    if (rate >= 0.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500 capitalize">
        {format(today, 'MMMM yyyy', { locale: ptBR })}
      </p>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-neutral-700 pb-1">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const inMonth = isSameMonth(day, today)
              const { done, total } = getDayStats(day)
              const isTodayDay = isToday(day)
              const hasDot = inMonth && total > 0

              return (
                <div
                  key={day.toISOString()}
                  className={clsx(
                    'flex flex-col items-center justify-center rounded-lg py-1.5 gap-1',
                    inMonth ? 'bg-neutral-900' : 'bg-transparent',
                    isTodayDay && 'ring-1 ring-neutral-600',
                  )}
                >
                  <span className={clsx(
                    'text-xs leading-none',
                    !inMonth && 'text-neutral-800',
                    inMonth && !isTodayDay && 'text-neutral-500',
                    isTodayDay && 'text-white font-medium',
                  )}>
                    {inMonth ? format(day, 'd') : ''}
                  </span>
                  {hasDot && (
                    <div className={clsx('w-1.5 h-1.5 rounded-full', dotColor(done, total))} />
                  )}
                  {inMonth && total === 0 && (
                    <div className="w-1.5 h-1.5 rounded-full opacity-0" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2">
        {[
          { color: 'bg-green-500', label: 'Todos' },
          { color: 'bg-yellow-500', label: 'Parcial' },
          { color: 'bg-red-500', label: 'Poucos' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={clsx('w-2 h-2 rounded-full', color)} />
            <span className="text-[10px] text-neutral-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
