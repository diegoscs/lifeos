'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import { useProjects } from '@/hooks/useProjects'
import Spinner from '@/components/ui/Spinner'

export default function ProjectsCard() {
  const { projects, isLoading } = useProjects()

  const active = projects.filter((p) => p.status === 'Em andamento').slice(0, 3)

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wide">Projetos ativos</h2>
        <Link href="/projetos" className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors">
          ver todos →
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {!isLoading && active.length === 0 && (
        <p className="text-sm text-neutral-600 py-2">Nenhum projeto em andamento.</p>
      )}

      {!isLoading && active.map((project) => (
        <div key={project.id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-200 truncate">{project.name}</span>
            {project.progress !== null && (
              <span className="text-xs text-neutral-500">{project.progress}%</span>
            )}
          </div>
          {project.progress !== null && (
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full transition-all',
                  project.progress < 50 ? 'bg-red-500' : project.progress < 80 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(project.progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
