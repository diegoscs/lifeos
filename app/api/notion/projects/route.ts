import { NextResponse, type NextRequest } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getDate, getCheckbox } from '@/lib/notion'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { secureJsonResponse, handleApiError } from '@/lib/api-security'
import type { Project } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

function pageToProject(page: PageObjectResponse): Project | null {
  const p = page.properties

  const status = getSelect(p['Status'])
  const category = getSelect(p['Categoria'])
  const priority = getSelect(p['Prioridade'])

  return {
    id: page.id,
    name: getText(p['Nome']),
    status: (status as Project['status']) ?? null,
    category: (category as Project['category']) ?? null,
    priority: (priority as Project['priority']) ?? null,
    deadline: getDate(p['Prazo']),
    progress: null,
    deployUrl: p['URL deploy']?.type === 'url' ? (p['URL deploy'].url ?? null) : null,
  }
}

/**
 * Calcula progresso de múltiplos projetos em uma única query
 * Evita N+1 queries ao usar filter OR em vez de queries individuais
 */
async function calculateProgressBatch(projectIds: string[]): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map()

  // Construir filtro OR para todos os projetos de uma vez
  const filters = projectIds.map((id) => ({
    property: 'Project',
    relation: { contains: id },
  }))

  const orFilter = filters.length === 1
    ? filters[0]
    : { or: filters }

  const res = await notion.databases.query({
    database_id: DB.tasks,
    filter: orFilter,
  })

  const tasks = res.results.filter(isFullPage)

  // Agrupar tarefas por projeto
  const tasksByProject = new Map<string, Array<{ id: string; complete: boolean }>>()

  tasks.forEach((task) => {
    const projectId = task.properties['Project']?.type === 'relation'
      ? task.properties['Project'].relation[0]?.id
      : null

    if (projectId) {
      if (!tasksByProject.has(projectId)) {
        tasksByProject.set(projectId, [])
      }
      tasksByProject.get(projectId)!.push({
        id: task.id,
        complete: getCheckbox(task.properties['Complete']),
      })
    }
  })

  // Calcular progresso para cada projeto
  const progressMap = new Map<string, number>()

  projectIds.forEach((projectId) => {
    const projectTasks = tasksByProject.get(projectId) ?? []
    if (projectTasks.length === 0) {
      progressMap.set(projectId, 0)
    } else {
      const done = projectTasks.filter((t) => t.complete).length
      const progress = Math.round((done / projectTasks.length) * 100)
      progressMap.set(projectId, progress)
    }
  })

  return progressMap
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const res = await notion.databases.query({
      database_id: DB.projects,
      sorts: [
        { property: 'Status', direction: 'ascending' },
        { property: 'Prioridade', direction: 'ascending' },
      ],
    })

    const projects = res.results
      .filter(isFullPage)
      .map(pageToProject)
      .filter((p): p is Project => p !== null)

    // Calcular progresso de todos os projetos em uma única query
    const progressMap = await calculateProgressBatch(projects.map((p) => p.id))

    const withProgress = projects.map((project) => ({
      ...project,
      progress: progressMap.get(project.id) ?? 0,
    }))

    return secureJsonResponse(withProgress)
  } catch (err) {
    return handleApiError(err, 'projects GET')
  }
}
