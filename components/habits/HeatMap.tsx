'use client'

import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import type { HabitRecord } from '@/types'

interface HeatMapProps {
  records: HabitRecord[]
  days?: number
}

export default function HeatMap({ records, days = 30 }: HeatMapProps) {
  const today = new Date()
  const start = subDays(today, days - 1)
  const allDays = eachDayOfInterval({ start, end: today })

  // Conta concluídos por dia
  const countByDate = allDays.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayRecords = records.filter((r) => r.date === dateStr)
    const done = dayRecords.filter((r) => r.completed).length
    const total = dayRecords.length
    return { date: day, dateStr, done, total }
  })

  function intensity(done: number, total: number): string {
    if (total === 0) return 'bg-neutral-900'
    const ratio = done / total
    if (ratio === 0) return 'bg-red-900/50'
    if (ratio < 0.5) return 'bg-yellow-900/60'
    if (ratio < 1) return 'bg-green-800/70'
    return 'bg-green-600'
  }

  // Agrupa em semanas (colunas)
  const weeks: typeof countByDate[] = []
  let week: typeof countByDate = []
  countByDate.forEach((d, i) => {
    week.push(d)
    if (week.length === 7 || i === countByDate.length - 1) {
      weeks.push(week)
      week = []
    }
  })

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map(({ date, dateStr, done, total }) => (
              <div
                key={dateStr}
                title={`${format(date, 'd MMM', { locale: ptBR })}: ${done}/${total} hábitos`}
                className={clsx('w-4 h-4 rounded-sm cursor-default', intensity(done, total))}
              />
            ))}
          </div>
        ))}
      </div>
      {/* legenda */}
      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <span>Menos</span>
        {['bg-neutral-900', 'bg-red-900/50', 'bg-yellow-900/60', 'bg-green-800/70', 'bg-green-600'].map((c) => (
          <div key={c} className={clsx('w-3 h-3 rounded-sm', c)} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  )
}
