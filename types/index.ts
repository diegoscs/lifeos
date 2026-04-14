// ──────────────────────────────────────────────
// Tarefas
// ──────────────────────────────────────────────
export type TaskPriority = 'Alta' | 'Média' | 'Baixa'
export type TaskStatus = 'A fazer' | 'Em andamento' | 'Completada' | 'Pausada'

export interface Task {
  id: string
  title: string
  priority: TaskPriority | null
  status: TaskStatus
  dueDate: string | null
  projectId: string | null
  projectName: string | null
  complete: boolean
}

export interface CreateTaskInput {
  title: string
  priority?: TaskPriority
  dueDate?: string
  projectId?: string
}

export interface UpdateTaskInput {
  id: string
  status?: TaskStatus
  complete?: boolean
  priority?: TaskPriority
  dueDate?: string
}

// ──────────────────────────────────────────────
// Hábitos
// ──────────────────────────────────────────────
export type HabitCategory = 'Saúde' | 'Produtividade' | 'Pessoal'
export type HabitFrequency = 'Diário' | 'Semanal'
export type HabitTime = 'Manhã' | 'Tarde' | 'Noite' | 'Qualquer hora'

export interface Habit {
  id: string
  name: string
  active: boolean
  category: HabitCategory | null
  frequency: HabitFrequency | null
  time: HabitTime | null
  weeklyGoal: number | null
}

// ──────────────────────────────────────────────
// Registros de Hábitos
// ──────────────────────────────────────────────
export interface HabitRecord {
  id: string
  title: string
  habit: string | null
  date: string | null
  completed: boolean
  failReason: string | null
}

export interface CreateRecordInput {
  habit: string
  date: string
  completed: boolean
  failReason?: string
}

// ──────────────────────────────────────────────
// Projetos
// ──────────────────────────────────────────────
export type ProjectStatus = 'Não iniciada' | 'Em andamento' | 'Concluído'
export type ProjectCategory = 'Cliente' | 'Portfolio' | 'Produto Próprio' | 'Site'

export interface Project {
  id: string
  name: string
  status: ProjectStatus | null
  category: ProjectCategory | null
  priority: TaskPriority | null
  deadline: string | null
  progress: number | null
  nextAction: string | null
  deployUrl: string | null
}

// ──────────────────────────────────────────────
// Clientes
// ──────────────────────────────────────────────
export type ClientStatus = 'Prospect' | 'Ativo' | 'Concluído' | 'Pausado'

export interface Client {
  id: string
  name: string
  status: ClientStatus | null
  totalValue: number | null
  contact: string | null
  lastInteraction: string | null
  notes: string | null
}

// ──────────────────────────────────────────────
// Financeiro
// ──────────────────────────────────────────────
export type FinanceType = 'Receita' | 'Gasto fixo' | 'Gasto variável' | 'Meta mensal' | 'NF pendente'
export type FinanceStatus = 'Pendente' | 'Recebido' | 'Pago' | 'Vencendo'
export type FinanceCategory = 'Projeto' | 'Pessoal' | 'Assinatura' | 'Imposto' | 'Outro'

export interface FinanceEntry {
  id: string
  description: string
  type: FinanceType | null
  value: number | null
  date: string | null
  status: FinanceStatus | null
  category: FinanceCategory | null
}

// ──────────────────────────────────────────────
// API Responses
// ──────────────────────────────────────────────
export interface ApiError {
  error: string
}
