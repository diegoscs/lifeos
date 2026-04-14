'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { useProjects } from '@/hooks/useProjects'
import ProjectCard from '@/components/projects/ProjectCard'
import Spinner from '@/components/ui/Spinner'
import type { ProjectStatus } from '@/types'

type View = 'lista' | 'kanban'

const KANBAN_COLUMNS: { status: ProjectStatus; label: string }[] = [
  { status: 'Não iniciada', label: 'Não iniciada' },
  { status: 'Em andamento', label: 'Em andamento' },
  { status: 'Concluído',    label: 'Concluído' },
]

const columnDot: Record<ProjectStatus, string> = {
  'Não iniciada': 'bg-neutral-600',
  'Em andamento': 'bg-blue-500',
  'Concluído':    'bg-green-500',
}

export default function ProjetosPage() {
  const [view, setView] = useState<View>('lista')
  const { projects, isLoading, isError, updateProject } = useProjects()

  const active = projects.filter((p) => p.status !== 'Concluído')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-neutral-900 rounded-lg p-1 w-fit">
          {(['lista', 'kanban'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === v
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              {v === 'lista' ? 'Lista' : 'Kanban'}
            </button>
          ))}
        </div>

        {!isLoading && (
          <span className="text-xs text-neutral-600">{active.length} ativos</span>
        )}
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-sm text-red-400">
          Erro ao carregar projetos.
        </div>
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <div className="text-center py-12 text-sm text-neutral-600">
          Nenhum projeto encontrado. Adicione projetos no Notion.
        </div>
      )}

      {/* View: Lista */}
      {!isLoading && !isError && view === 'lista' && projects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 max-w-4xl">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onUpdate={updateProject}
            />
          ))}
        </div>
      )}

      {/* View: Kanban */}
      {!isLoading && !isError && view === 'kanban' && projects.length > 0 && (
        <div className="grid grid-cols-3 gap-4 max-w-5xl">
          {KANBAN_COLUMNS.map(({ status, label }) => {
            const col = projects.filter((p) => p.status === status)
            return (
              <div key={status} className="space-y-2">
                {/* column header */}
                <div className="flex items-center gap-2">
                  <div className={clsx('w-2 h-2 rounded-full', columnDot[status])} />
                  <span className="text-xs text-neutral-500 font-medium">{label}</span>
                  <span className="text-xs text-neutral-700 ml-auto">{col.length}</span>
                </div>

                {/* cards */}
                <div className="space-y-2">
                  {col.length === 0 && (
                    <div className="rounded-xl border border-dashed border-neutral-900 py-8 text-center text-xs text-neutral-800">
                      Vazio
                    </div>
                  )}
                  {col.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onUpdate={updateProject}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
