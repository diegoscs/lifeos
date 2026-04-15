'use client'

import MetricCard from '@/components/dashboard/MetricCard'
import TasksCard from '@/components/dashboard/TasksCard'
import HabitsCard from '@/components/dashboard/HabitsCard'
import ProjectsCard from '@/components/dashboard/ProjectsCard'
import { useMetrics } from '@/hooks/useMetrics'
import { useProjects } from '@/hooks/useProjects'

export default function DashboardPage() {
  const { pendingToday, habitStreak, activeHabits, isLoading } = useMetrics()
  const { projects } = useProjects()
  const activeProjectCount = projects.filter((p) => p.status === 'Em andamento').length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          label="Receita do mês"
          value="R$ —"
          sub="configure finanças"
        />
        <MetricCard
          label="Projetos ativos"
          value={isLoading ? '—' : activeProjectCount}
          sub={`em andamento`}
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TasksCard />
        <HabitsCard />
        <ProjectsCard />
      </div>
    </div>
  )
}
