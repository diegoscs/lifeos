import { NextResponse, type NextRequest } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getCheckbox, getDate } from '@/lib/notion'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

function pageToTask(page: PageObjectResponse, projectNames: Map<string, string> = new Map()): Task {
  const p = page.properties
  const projectId = p['Project']?.type === 'relation' ? (p['Project'].relation[0]?.id ?? null) : null
  return {
    id: page.id,
    title: getText(p['Name']),
    priority: getSelect(p['Priority']) as Task['priority'],
    status: (getSelect(p['Status']) ?? 'A fazer') as TaskStatus,
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

    const filters: object[] = []
    if (statusFilter) filters.push({ property: 'Status', select: { equals: statusFilter } })
    if (dueDateFilter) filters.push({ property: 'Due Date', date: { equals: dueDateFilter } })
    if (projectFilter) filters.push({ property: 'Project', relation: { contains: projectFilter } })

    const response = await notion.databases.query({
      database_id: DB.tasks,
      filter: filters.length === 0
        ? undefined
        : filters.length === 1
          ? filters[0] as Parameters<typeof notion.databases.query>[0]['filter']
          : { and: filters } as Parameters<typeof notion.databases.query>[0]['filter'],
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
      .map((p) => p.properties['Project']?.type === 'relation' ? p.properties['Project'].relation[0]?.id : null)
      .filter((id): id is string => !!id)
    const projectNames = await resolveProjectNames(projectIds)

    const tasks: Task[] = pages.map((p) => pageToTask(p, projectNames))
    return NextResponse.json(tasks)
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[tasks GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notion/tasks
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body: CreateTaskInput = await request.json()
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: body.title.trim() } }] },
      Status: { select: { name: 'A fazer' } },
      Complete: { checkbox: false },
    }
    if (body.priority) properties['Priority'] = { select: { name: body.priority } }
    if (body.dueDate) properties['Due Date'] = { date: { start: body.dueDate } }
    if (body.projectId) properties['Project'] = { relation: [{ id: body.projectId }] }

    const page = await notion.pages.create({
      parent: { database_id: DB.tasks },
      properties: properties as Parameters<typeof notion.pages.create>[0]['properties'],
    })

    if (!isFullPage(page)) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json(pageToTask(page), { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[tasks POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notion/tasks
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth()

    const body: UpdateTaskInput = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const properties: Record<string, unknown> = {}
    if (body.status !== undefined) properties['Status'] = { select: { name: body.status } }
    if (body.complete !== undefined) {
      properties['Complete'] = { checkbox: body.complete }
      if (body.complete && body.status === undefined) {
        properties['Status'] = { select: { name: 'Completada' as TaskStatus } }
      }
      if (!body.complete && body.status === undefined) {
        properties['Status'] = { select: { name: 'A fazer' as TaskStatus } }
      }
    }
    if (body.priority !== undefined) properties['Priority'] = { select: { name: body.priority as TaskPriority } }
    if (body.dueDate !== undefined) {
      properties['Due Date'] = body.dueDate ? { date: { start: body.dueDate } } : { date: null }
    }

    const page = await notion.pages.update({
      page_id: body.id,
      properties: properties as Parameters<typeof notion.pages.update>[0]['properties'],
    })

    if (!isFullPage(page)) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json(pageToTask(page))
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[tasks PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
