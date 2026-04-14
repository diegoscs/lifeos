'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import type { Habit, HabitRecord } from '@/types'

const FAIL_REASONS = ['Dormiu tarde', 'Compromisso', 'Esqueceu', 'Não quis']

interface HabitCheckInProps {
  habit: Habit
  record: HabitRecord | null
  onCheckIn: (habitName: string, date: string, completed: boolean, failReason?: string) => Promise<void>
  date: string
}

export default function HabitCheckIn({ habit, record, onCheckIn, date }: HabitCheckInProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const isDone = record?.completed === true
  const isFailed = record !== null && record.completed === false

  async function handleClick() {
    if (loading) return
    if (isDone || isFailed) return // já registrado

    // Clique = concluído
    setLoading(true)
    try {
      await onCheckIn(habit.name, date, true)
    } finally {
      setLoading(false)
    }
  }

  async function handleFailReason(reason: string) {
    setShowModal(false)
    setLoading(true)
    try {
      await onCheckIn(habit.name, date, false, reason)
    } finally {
      setLoading(false)
    }
  }

  async function handleSkip() {
    setShowModal(false)
    setLoading(true)
    try {
      await onCheckIn(habit.name, date, false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-900 group transition-colors">
        {/* círculo de check-in */}
        <button
          onClick={handleClick}
          disabled={loading || isDone || isFailed}
          className={clsx(
            'w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
            isDone && 'border-green-500 bg-green-500',
            isFailed && 'border-red-800 bg-red-900/40',
            !isDone && !isFailed && 'border-neutral-700 hover:border-neutral-400',
            loading && 'opacity-50'
          )}
        >
          {isDone && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 10">
              <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isFailed && (
            <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 10 10">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* nome */}
        <span className={clsx(
          'flex-1 text-sm',
          isDone ? 'text-neutral-500 line-through' : 'text-neutral-200'
        )}>
          {habit.name}
        </span>

        {/* categoria */}
        {habit.category && (
          <span className="text-xs text-neutral-600 hidden group-hover:inline">{habit.category}</span>
        )}

        {/* botão "não fiz" — só aparece se não registrado */}
        {!isDone && !isFailed && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-neutral-700 hover:text-neutral-500 hidden group-hover:inline transition-colors"
          >
            não fiz
          </button>
        )}

        {/* motivo da falha */}
        {isFailed && record?.failReason && (
          <span className="text-xs text-red-800">{record.failReason}</span>
        )}
      </div>

      {/* Modal motivo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-72 space-y-4">
            <p className="text-sm text-neutral-300 font-medium">
              Por que não fez <span className="text-white">{habit.name}</span>?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FAIL_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleFailReason(reason)}
                  className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors text-left"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="w-full text-xs text-neutral-600 hover:text-neutral-400 transition-colors pt-1"
            >
              Pular (sem motivo)
            </button>
          </div>
        </div>
      )}
    </>
  )
}
