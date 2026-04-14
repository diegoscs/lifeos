'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import type { Habit, HabitRecord } from '@/types'

const FAIL_REASONS = ['Dormiu tarde', 'Compromisso', 'Esqueceu', 'Não quis']

interface HabitCheckInProps {
  habit: Habit
  record: HabitRecord | null
  date: string
  onCheckIn: (habitName: string, date: string, completed: boolean, failReason?: string) => Promise<void>
  onUpdate: (id: string, completed: boolean, failReason?: string) => Promise<void>
}

type ModalMode = 'fail' | 'undo' | null

export default function HabitCheckIn({ habit, record, date, onCheckIn, onUpdate }: HabitCheckInProps) {
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [loading, setLoading] = useState(false)

  const isDone = record?.completed === true
  const isFailed = record !== null && record.completed === false

  async function withLoading(fn: () => Promise<void>) {
    setLoading(true)
    try { await fn() } finally { setLoading(false) }
  }

  // Clique no círculo verde (concluído) → abre modal para desfazer
  function handleDoneClick() {
    setModalMode('undo')
  }

  // Clique no círculo vermelho (falhou) → marca como concluído diretamente
  async function handleFailedClick() {
    if (!record) return
    await withLoading(() => onUpdate(record.id, true))
  }

  // Clique no círculo vazio → marca como concluído
  async function handleEmptyClick() {
    await withLoading(() => onCheckIn(habit.name, date, true))
  }

  // Modal: motivo de falha (novo registro ou update)
  async function handleFailReason(reason: string) {
    setModalMode(null)
    await withLoading(() =>
      record
        ? onUpdate(record.id, false, reason)
        : onCheckIn(habit.name, date, false, reason)
    )
  }

  async function handleSkipReason() {
    setModalMode(null)
    await withLoading(() =>
      record
        ? onUpdate(record.id, false)
        : onCheckIn(habit.name, date, false)
    )
  }

  // Modal: desfazer (marcar como não feito)
  function handleUndoRequest() {
    setModalMode('undo')
  }

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-neutral-900 group transition-colors">
        {/* círculo de check-in */}
        <button
          onClick={
            loading ? undefined
              : isDone ? handleDoneClick
              : isFailed ? handleFailedClick
              : handleEmptyClick
          }
          disabled={loading}
          title={
            isDone ? 'Clique para desfazer'
              : isFailed ? 'Clique para marcar como feito'
              : 'Marcar como feito'
          }
          className={clsx(
            'w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
            isDone && 'border-green-500 bg-green-500 hover:bg-green-600 hover:border-green-600',
            isFailed && 'border-red-800 bg-red-900/40 hover:bg-red-800/60 hover:border-red-700',
            !isDone && !isFailed && 'border-neutral-700 hover:border-white hover:scale-110',
            loading && 'opacity-40 cursor-wait'
          )}
        >
          {isDone && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 10 10">
              <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isFailed && (
            <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 10 10">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* nome + horário */}
        <div className="flex-1 min-w-0">
          <span className={clsx(
            'text-sm block truncate',
            isDone ? 'text-neutral-500 line-through' : 'text-neutral-200'
          )}>
            {habit.name}
          </span>
          {habit.time && habit.time !== 'Qualquer hora' && (
            <span className="text-[10px] text-neutral-700">{habit.time}</span>
          )}
        </div>

        {/* ações no hover */}
        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFailed && (
            <button
              onClick={() => setModalMode('fail')}
              className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors"
            >
              não fiz
            </button>
          )}
          {isFailed && record?.failReason && (
            <span className="text-xs text-red-900">{record.failReason}</span>
          )}
          {habit.category && (
            <span className="text-xs text-neutral-700">{habit.category}</span>
          )}
        </div>
      </div>

      {/* Modal motivo de falha */}
      {(modalMode === 'fail') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setModalMode(null)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-72 space-y-4" onClick={(e) => e.stopPropagation()}>
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
              onClick={handleSkipReason}
              className="w-full text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Pular (sem motivo)
            </button>
          </div>
        </div>
      )}

      {/* Modal desfazer */}
      {modalMode === 'undo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setModalMode(null)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-64 space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-neutral-300">
              Desfazer <span className="text-white">{habit.name}</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setModalMode(null); if (record) withLoading(() => onUpdate(record.id, false)) }}
                className="flex-1 px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-xs text-red-300 transition-colors"
              >
                Não fiz
              </button>
              <button
                onClick={() => setModalMode(null)}
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
