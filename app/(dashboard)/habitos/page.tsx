'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { useHabits, useHabitRecords } from '@/hooks/useHabits'
import HabitCheckIn from '@/components/habits/HabitCheckIn'
import WeekGrid from '@/components/habits/WeekGrid'
import HeatMap from '@/components/habits/HeatMap'
import HabitPatterns from '@/components/habits/HabitPatterns'
import Spinner from '@/components/ui/Spinner'

type Tab = 'hoje' | 'semana' | 'mes' | 'padroes'

const tabs: { key: Tab; label: string }[] = [
  { key: 'hoje',    label: 'Hoje' },
  { key: 'semana',  label: 'Semana' },
  { key: 'mes',     label: 'Mês' },
  { key: 'padroes', label: 'Padrões' },
]

export default function HabitosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hoje')

  const { habits, isLoading: habitsLoading } = useHabits()
  const { records: weekRecords, isLoading: weekLoading, checkIn } = useHabitRecords(7)
  const { records: monthRecords, isLoading: monthLoading } = useHabitRecords(30)

  const today = format(new Date(), 'yyyy-MM-dd')
  const isLoading = habitsLoading || weekLoading

  async function handleCheckIn(habitName: string, date: string, completed: boolean, failReason?: string) {
    await checkIn({ habit: habitName, date, completed, failReason })
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 rounded-lg p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeTab === key
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {!isLoading && habits.length === 0 && (
          <p className="text-sm text-neutral-600 text-center py-8">
            Nenhum hábito ativo. Adicione hábitos no Notion com &quot;Ativo&quot; marcado.
          </p>
        )}

        {/* View: Hoje */}
        {!isLoading && activeTab === 'hoje' && habits.length > 0 && (
          <div className="divide-y divide-neutral-900">
            {habits.map((habit) => {
              const record = weekRecords.find(
                (r) => r.habit === habit.name && r.date === today
              ) ?? null
              return (
                <HabitCheckIn
                  key={habit.id}
                  habit={habit}
                  record={record}
                  onCheckIn={handleCheckIn}
                  date={today}
                />
              )
            })}
          </div>
        )}

        {/* View: Semana */}
        {!isLoading && activeTab === 'semana' && habits.length > 0 && (
          <WeekGrid habits={habits} records={weekRecords} />
        )}

        {/* View: Mês */}
        {!isLoading && activeTab === 'mes' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-600">Últimos 30 dias — todos os hábitos combinados</p>
            {monthLoading ? <Spinner /> : <HeatMap records={monthRecords} days={30} />}
          </div>
        )}

        {/* View: Padrões */}
        {!isLoading && activeTab === 'padroes' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-600">Taxa de conclusão — últimos 30 dias</p>
            {monthLoading ? <Spinner /> : <HabitPatterns habits={habits} records={monthRecords} />}
          </div>
        )}
      </div>
    </div>
  )
}
