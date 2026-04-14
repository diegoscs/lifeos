'use client'

import { clsx } from 'clsx'
import type { Habit, HabitRecord } from '@/types'

interface HabitPatternsProps {
  habits: Habit[]
  records: HabitRecord[]
}

const SIZE = 56
const STROKE = 5
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

function ringColor(rate: number) {
  if (rate >= 80) return '#22c55e' // green-500
  if (rate >= 50) return '#eab308' // yellow-500
  return '#ef4444'                  // red-500
}

function ringBg(rate: number) {
  if (rate >= 80) return '#14532d33' // green-900/20
  if (rate >= 50) return '#71350033' // yellow-900/20
  return '#7f1d1d33'                 // red-900/20
}

interface CircleProps {
  rate: number
}

function CircleProgress({ rate }: CircleProps) {
  const offset = CIRCUMFERENCE - (rate / 100) * CIRCUMFERENCE
  const color = ringColor(rate)
  const bg = ringBg(rate)

  return (
    <svg width={SIZE} height={SIZE} className="-rotate-90">
      {/* background ring */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={bg}
        strokeWidth={STROKE}
      />
      {/* progress ring */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

export default function HabitPatterns({ habits, records }: HabitPatternsProps) {
  const stats = habits.map((habit) => {
    const habitRecords = records.filter((r) => r.habit === habit.name)
    const done = habitRecords.filter((r) => r.completed).length
    const total = habitRecords.length
    const rate = total > 0 ? Math.round((done / total) * 100) : 0
    return { habit, done, total, rate }
  }).sort((a, b) => b.rate - a.rate)

  if (stats.length === 0) {
    return <p className="text-sm text-neutral-600">Nenhum registro nos últimos 30 dias.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map(({ habit, done, total, rate }) => (
        <div
          key={habit.id}
          className="flex flex-col items-center gap-2 bg-neutral-900 rounded-2xl p-4"
        >
          {/* ring */}
          <div className="relative">
            <CircleProgress rate={rate} />
            {/* percentage label in center */}
            <span
              className="absolute inset-0 flex items-center justify-center text-xs font-semibold rotate-0"
              style={{ color: ringColor(rate) }}
            >
              {rate}%
            </span>
          </div>

          {/* habit name */}
          <p className="text-[11px] text-neutral-300 text-center leading-tight line-clamp-2">
            {habit.name}
          </p>

          {/* done/total */}
          <p className="text-[10px] text-neutral-600">
            {done}/{total} dias
          </p>
        </div>
      ))}
    </div>
  )
}
