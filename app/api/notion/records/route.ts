import { NextResponse, type NextRequest } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getCheckbox, getDate } from '@/lib/notion'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { secureJsonResponse, handleApiError, isValidDate, isValidNotionId } from '@/lib/api-security'
import type { HabitRecord, CreateRecordInput } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

function pageToRecord(page: PageObjectResponse): HabitRecord {
  const p = page.properties
  return {
    id: page.id,
    title: getText(p['Registro']),
    habit: getSelect(p['Hábito']),
    date: getDate(p['Data']),
    completed: getCheckbox(p['Concluído']),
    failReason: getText(p['Motivo falha']) || null,
  }
}

// GET /api/notion/records
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const habit = searchParams.get('habit')

    // Validar datas
    if (date && !isValidDate(date)) {
      return secureJsonResponse({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 })
    }

    if (startDate && !isValidDate(startDate)) {
      return secureJsonResponse({ error: 'Invalid startDate format (expected YYYY-MM-DD)' }, { status: 400 })
    }

    if (endDate && !isValidDate(endDate)) {
      return secureJsonResponse({ error: 'Invalid endDate format (expected YYYY-MM-DD)' }, { status: 400 })
    }

    const filters: Parameters<typeof notion.databases.query>[0]['filter'][] = []

    if (date) {
      filters.push({ property: 'Data', date: { equals: date } } as Parameters<typeof notion.databases.query>[0]['filter'])
    } else if (startDate && endDate) {
      filters.push({ property: 'Data', date: { on_or_after: startDate } } as Parameters<typeof notion.databases.query>[0]['filter'])
      filters.push({ property: 'Data', date: { on_or_before: endDate } } as Parameters<typeof notion.databases.query>[0]['filter'])
    }

    if (habit) {
      filters.push({ property: 'Hábito', select: { equals: habit } } as Parameters<typeof notion.databases.query>[0]['filter'])
    }

    const response = await notion.databases.query({
      database_id: DB.records,
      filter:
        filters.length === 0
          ? undefined
          : filters.length === 1
            ? filters[0]
            : ({ and: filters } as Parameters<typeof notion.databases.query>[0]['filter']),
      sorts: [{ property: 'Data', direction: 'descending' }],
      page_size: 100,
    })

    const records: HabitRecord[] = response.results.filter(isFullPage).map(pageToRecord)
    return secureJsonResponse(records)
  } catch (err) {
    return handleApiError(err, 'records GET')
  }
}

// POST /api/notion/records — cria novo registro
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

    // Validar habit
    if (typeof input.habit !== 'string' || !input.habit.trim()) {
      return secureJsonResponse({ error: 'habit is required and must be a non-empty string' }, { status: 400 })
    }

    // Validar date
    if (!isValidDate(input.date)) {
      return secureJsonResponse({ error: 'date is required and must be in YYYY-MM-DD format' }, { status: 400 })
    }

    // Validar completed
    const completed = typeof input.completed === 'boolean' ? input.completed : false

    // Validar failReason se fornecido
    let failReason: string | undefined
    if (input.failReason !== undefined) {
      if (typeof input.failReason !== 'string' || !input.failReason.trim()) {
        return secureJsonResponse({ error: 'failReason must be a non-empty string or undefined' }, { status: 400 })
      }
      failReason = input.failReason
    }

    const page = await notion.pages.create({
      parent: { database_id: DB.records },
      properties: {
        Registro: { title: [{ text: { content: `${input.habit} - ${input.date}` } }] },
        Hábito: { select: { name: input.habit as string } },
        Data: { date: { start: input.date as string } },
        Concluído: { checkbox: completed },
        ...(failReason ? { 'Motivo falha': { rich_text: [{ text: { content: failReason } }] } } : {}),
      },
    })

    if (!isFullPage(page)) {
      return secureJsonResponse({ error: 'Failed to create record' }, { status: 500 })
    }

    return secureJsonResponse(pageToRecord(page), { status: 201 })
  } catch (err) {
    return handleApiError(err, 'records POST')
  }
}

// PATCH /api/notion/records — atualiza registro existente
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

    // Validar completed
    if (typeof input.completed !== 'boolean') {
      return secureJsonResponse({ error: 'completed is required and must be a boolean' }, { status: 400 })
    }

    // Validar failReason se fornecido
    if (input.failReason !== undefined) {
      if (typeof input.failReason !== 'string' || !input.failReason.trim()) {
        return secureJsonResponse({ error: 'failReason must be a non-empty string or undefined' }, { status: 400 })
      }
    }

    const page = await notion.pages.update({
      page_id: input.id as string,
      properties: {
        Concluído: { checkbox: input.completed as boolean },
        'Motivo falha': {
          rich_text:
            typeof input.failReason === 'string' && input.failReason.trim()
              ? [{ text: { content: input.failReason } }]
              : [],
        },
      },
    })

    if (!isFullPage(page)) {
      return secureJsonResponse({ error: 'Failed to update record' }, { status: 500 })
    }

    return secureJsonResponse(pageToRecord(page))
  } catch (err) {
    return handleApiError(err, 'records PATCH')
  }
}
