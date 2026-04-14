'use client'

import MetricCard from '@/components/dashboard/MetricCard'
import TasksCard from '@/components/dashboard/TasksCard'
import HabitsCard from '@/components/dashboard/HabitsCard'
import PlaceholderCard from '@/components/dashboard/PlaceholderCard'
import { useMetrics } from '@/hooks/useMetrics'

export default function DashboardPage() {
  const { pendingToday, habitStreak, activeHabits, isLoading } = useMetrics()

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
          value="—"
          sub="configure projetos"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Projetos"
          message="Cards de projeto disponíveis no Passo 4.2."
        />
        <PlaceholderCard
          title="Finanças"
          message="Visão financeira disponível no Passo 3.5."
        />
        <PlaceholderCard
          title="Deploys"
          message="Status de deploy disponível no Passo 4.1."
        />
      </div>
    </div>
  )
}
