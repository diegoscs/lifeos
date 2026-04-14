import { NextResponse, type NextRequest } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getCheckbox, getDate } from '@/lib/notion'
import { createServerSupabaseClient } from '@/lib/supabase-server'
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

    const filters: object[] = []
    if (date) {
      filters.push({ property: 'Data', date: { equals: date } })
    } else if (startDate && endDate) {
      filters.push({ property: 'Data', date: { on_or_after: startDate } })
      filters.push({ property: 'Data', date: { on_or_before: endDate } })
    }
    if (habit) filters.push({ property: 'Hábito', select: { equals: habit } })

    const response = await notion.databases.query({
      database_id: DB.records,
      filter: filters.length === 0
        ? undefined
        : filters.length === 1
          ? filters[0] as Parameters<typeof notion.databases.query>[0]['filter']
          : { and: filters } as Parameters<typeof notion.databases.query>[0]['filter'],
      sorts: [{ property: 'Data', direction: 'descending' }],
      page_size: 100,
    })

    const records: HabitRecord[] = response.results.filter(isFullPage).map(pageToRecord)
    return NextResponse.json(records)
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[records GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notion/records
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body: CreateRecordInput = await request.json()
    if (!body.habit || !body.date) {
      return NextResponse.json({ error: 'habit and date are required' }, { status: 400 })
    }

    const page = await notion.pages.create({
      parent: { database_id: DB.records },
      properties: {
        Registro: { title: [{ text: { content: `${body.habit} - ${body.date}` } }] },
        Hábito: { select: { name: body.habit } },
        Data: { date: { start: body.date } },
        Concluído: { checkbox: body.completed },
        ...(body.failReason
          ? { 'Motivo falha': { rich_text: [{ text: { content: body.failReason } }] } }
          : {}),
      },
    })

    if (!isFullPage(page)) {
      return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
    }

    return NextResponse.json(pageToRecord(page), { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[records POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
