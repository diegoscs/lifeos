import { NextResponse, type NextRequest } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getCheckbox, getDate } from '@/lib/notion'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { secureJsonResponse, handleApiError, isValidSelect, isValidDate, isValidNotionId } from '@/lib/api-security'
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

const VALID_STATUSES: readonly TaskStatus[] = ['A fazer', 'Em andamento', 'Completada', 'Pausada']
const VALID_PRIORITIES: readonly TaskPriority[] = ['Alta', 'Média', 'Baixa']

async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

function pageToTask(page: PageObjectResponse, projectNames: Map<string, string> = new Map()): Task {
  const p = page.properties
  const projectId = p['Project']?.type === 'relation' ? (p['Project'].relation[0]?.id ?? null) : null

  const priority = getSelect(p['Priority'])
  const status = getSelect(p['Status']) ?? 'A fazer'

  // Validar valores contra enums
  if (priority && !isValidSelect(priority, VALID_PRIORITIES)) {
    console.warn(`Invalid priority value: ${priority}`)
  }

  if (!isValidSelect(status, VALID_STATUSES)) {
    console.warn(`Invalid status value: ${status}, defaulting to 'A fazer'`)
  }

  return {
    id: page.id,
    title: getText(p['Name']),
    priority: (isValidSelect(priority, VALID_PRIORITIES) ? priority : 'Média') as Task['priority'],
    status: (isValidSelect(status, VALID_STATUSES) ? status : 'A fazer') as TaskStatus,
    dueDate: getDate(p['Due Date']),
    projectId,
    projectName: projectId ? (projectNames.get(projectId) ?? null) : null,
    complete: getCheckbox(p['Complete']),
  }
}

// Busca nomes dos projetos em paralelo dado um set de IDs
async function resolveProjectNames(projectIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(projectIds)]
  if (unique.length === 0) return new Map()

  const results = await Promise.allSettled(
    unique.map((id) => notion.pages.retrieve({ page_id: id }))
  )

  const map = new Map<string, string>()
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && isFullPage(result.value)) {
      const name = getText(result.value.properties['Nome'])
      map.set(unique[i], name)
    }
  })
  return map
}

// GET /api/notion/tasks
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const dueDateFilter = searchParams.get('dueDate')
    const projectFilter = searchParams.get('projectId')

    // Validar filtros
    const filters: Parameters<typeof notion.databases.query>[0]['filter'][] = []

    if (statusFilter) {
      if (!isValidSelect(statusFilter, VALID_STATUSES)) {
        return secureJsonResponse({ error: 'Invalid status filter value' }, { status: 400 })
      }
      filters.push({ property: 'Status', select: { equals: statusFilter } } as Parameters<typeof notion.databases.query>[0]['filter'])
    }

    if (dueDateFilter) {
      if (!isValidDate(dueDateFilter)) {
        return secureJsonResponse({ error: 'Invalid dueDate filter format (expected YYYY-MM-DD)' }, { status: 400 })
      }
      filters.push({ property: 'Due Date', date: { equals: dueDateFilter } } as Parameters<typeof notion.databases.query>[0]['filter'])
    }

    if (projectFilter) {
      if (!isValidNotionId(projectFilter)) {
        return secureJsonResponse({ error: 'Invalid projectId filter format' }, { status: 400 })
      }
      filters.push({ property: 'Project', relation: { contains: projectFilter } } as Parameters<typeof notion.databases.query>[0]['filter'])
    }

    const response = await notion.databases.query({
      database_id: DB.tasks,
      filter:
        filters.length === 0
          ? undefined
          : filters.length === 1
            ? filters[0]
            : ({ and: filters } as Parameters<typeof notion.databases.query>[0]['filter']),
      sorts: [
        { property: 'Complete', direction: 'ascending' },
        { property: 'Priority', direction: 'ascending' },
        { property: 'Due Date', direction: 'ascending' },
      ],
      page_size: 100,
    })

    const pages = response.results.filter(isFullPage)

    // Resolve nomes dos projetos
    const projectIds = pages
      .map((p) => (p.properties['Project']?.type === 'relation' ? p.properties['Project'].relation[0]?.id : null))
      .filter((id): id is string => !!id)
    const projectNames = await resolveProjectNames(projectIds)

    const tasks: Task[] = pages.map((p) => pageToTask(p, projectNames))
    return secureJsonResponse(tasks)
  } catch (err) {
    return handleApiError(err, 'tasks GET')
  }
}

// POST /api/notion/tasks
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    let body: unknown
    try {
      body = await request.json()
    } catch (e) {
      return secureJsonResponse({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null) {
      return secureJsonResponse({ error: 'Request body must be an object' }, { status: 400 })
    }

    const input = body as Record<string, unknown>

    // Validar title
    const title = input.title
    if (typeof title !== 'string' || !title.trim()) {
      return secureJsonResponse({ error: 'title is required and must be a non-empty string' }, { status: 400 })
    }

    if (title.length > 1000) {
      return secureJsonResponse({ error: 'title must not exceed 1000 characters' }, { status: 400 })
    }

    // Validar priority se fornecido
    if (input.priority !== undefined) {
      if (!isValidSelect(input.priority, VALID_PRIORITIES)) {
        return secureJsonResponse({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` }, { status: 400 })
      }
    }

    // Validar dueDate se fornecido
    if (input.dueDate !== undefined) {
      if (!isValidDate(input.dueDate)) {
        return secureJsonResponse({ error: 'dueDate must be in YYYY-MM-DD format' }, { status: 400 })
      }
    }

    // Validar projectId se fornecido
    if (input.projectId !== undefined) {
      if (!isValidNotionId(input.projectId)) {
        return secureJsonResponse({ error: 'Invalid projectId format' }, { status: 400 })
      }
    }

    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: title.trim() } }] },
      Status: { select: { name: 'A fazer' } },
      Complete: { checkbox: false },
    }

    if (input.priority) properties['Priority'] = { select: { name: input.priority as TaskPriority } }
    if (input.dueDate) properties['Due Date'] = { date: { start: input.dueDate as string } }
    if (input.projectId) properties['Project'] = { relation: [{ id: input.projectId as string }] }

    const page = await notion.pages.create({
      parent: { database_id: DB.tasks },
      properties: properties as Parameters<typeof notion.pages.create>[0]['properties'],
    })

    if (!isFullPage(page)) {
      return secureJsonResponse({ error: 'Failed to create task' }, { status: 500 })
    }

    return secureJsonResponse(pageToTask(page), { status: 201 })
  } catch (err) {
    return handleApiError(err, 'tasks POST')
  }
}

// PATCH /api/notion/tasks
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth()

    let body: unknown
    try {
      body = await request.json()
    } catch (e) {
      return secureJsonResponse({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null) {
      return secureJsonResponse({ error: 'Request body must be an object' }, { status: 400 })
    }

    const input = body as Record<string, unknown>

    // Validar id
    if (!isValidNotionId(input.id)) {
      return secureJsonResponse({ error: 'id is required and must be a valid Notion ID' }, { status: 400 })
    }

    const properties: Record<string, unknown> = {}

    // Validar e aplicar status
    if (input.status !== undefined) {
      if (!isValidSelect(input.status, VALID_STATUSES)) {
        return secureJsonResponse({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
      }
      properties['Status'] = { select: { name: input.status as TaskStatus } }
    }

    // Aplicar complete com status automático
    if (input.complete !== undefined) {
      if (typeof input.complete !== 'boolean') {
        return secureJsonResponse({ error: 'complete must be a boolean' }, { status: 400 })
      }

      properties['Complete'] = { checkbox: input.complete }

      if (input.status === undefined) {
        const autoStatus = input.complete ? 'Completada' : 'A fazer'
        properties['Status'] = { select: { name: autoStatus as TaskStatus } }
      }
    }

    // Validar e aplicar priority
    if (input.priority !== undefined) {
      if (!isValidSelect(input.priority, VALID_PRIORITIES)) {
        return secureJsonResponse({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` }, { status: 400 })
      }
      properties['Priority'] = { select: { name: input.priority as TaskPriority } }
    }

    // Validar e aplicar dueDate
    if (input.dueDate !== undefined) {
      if (input.dueDate !== null && !isValidDate(input.dueDate)) {
        return secureJsonResponse({ error: 'dueDate must be in YYYY-MM-DD format or null' }, { status: 400 })
      }
      properties['Due Date'] = input.dueDate ? { date: { start: input.dueDate as string } } : { date: null }
    }

    const page = await notion.pages.update({
      page_id: input.id as string,
      properties: properties as Parameters<typeof notion.pages.update>[0]['properties'],
    })

    if (!isFullPage(page)) {
      return secureJsonResponse({ error: 'Failed to update task' }, { status: 500 })
    }

    return secureJsonResponse(pageToTask(page))
  } catch (err) {
    return handleApiError(err, 'tasks PATCH')
  }
}
