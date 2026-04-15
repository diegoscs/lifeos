'use client'

import MetricCard from '@/components/dashboard/MetricCard'
import CompletedTasksCard from '@/components/dashboard/CompletedTasksCard'
import TasksCard from '@/components/dashboard/TasksCard'
import HabitsCard from '@/components/dashboard/HabitsCard'
import ProjectsCard from '@/components/dashboard/ProjectsCard'
import PlaceholderCard from '@/components/dashboard/PlaceholderCard'
import { useMetrics } from '@/hooks/useMetrics'
import { useProjects } from '@/hooks/useProjects'

export default function DashboardPage() {
  const { pendingToday, habitStreak, activeHabits, isLoading } = useMetrics()
  const { projects } = useProjects()
  const activeProjectCount = projects.filter((p) => p.status === 'Em andamento').length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <CompletedTasksCard />
        <MetricCard
          label="Tarefas hoje"
          value={isLoading ? '—' : pendingToday}
          sub="pendentes"
        />
        <MetricCard
          label="Streak hábitos"
          value={isLoading ? '—' : `${habitStreak}d`}
          sub={`${activeHabits} hábito${activeHabits !== 1 ? 's' : ''} ativos`}
        />
        <MetricCard
          label="Projetos ativos"
          value={isLoading ? '—' : activeProjectCount}
          sub={`em andamento`}
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TasksCard />
        <HabitsCard />
        <PlaceholderCard
          title="E-mails"
          message="Configure sua conta Gmail ou Outlook na Fase 3."
        />
        <PlaceholderCard
          title="Alertas"
          message="Alertas de clientes, NFs e deploys aparecem aqui."
        />
      </div>

      {/* Grid secundário */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        <ProjectsCard />
      </div>
    </div>
  )
}
