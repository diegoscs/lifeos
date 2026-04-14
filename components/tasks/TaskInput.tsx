'use client'

import { useState } from 'react'
import type { CreateTaskInput, TaskPriority } from '@/types'

interface TaskInputProps {
  onAdd: (input: CreateTaskInput) => Promise<void>
}

export default function TaskInput({ onAdd }: TaskInputProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !title.trim()) return
    setLoading(true)
    try {
      await onAdd({ title: title.trim() })
      setTitle('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-0.5 h-8 rounded-full bg-neutral-800 shrink-0" />
      <div className="w-4 h-4 rounded border border-dashed border-neutral-700 shrink-0" />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Adicionar tarefa… (Enter para salvar)"
        disabled={loading}
        className="flex-1 bg-transparent text-sm text-neutral-400 placeholder-neutral-700 focus:outline-none focus:text-neutral-200 disabled:opacity-50"
      />
    </div>
  )
}
