import { NextResponse } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getCheckbox, getNumber } from '@/lib/notion'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Habit, HabitCategory, HabitFrequency, HabitTime } from '@/types'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

function pageToHabit(page: PageObjectResponse): Habit {
  const p = page.properties
  return {
    id: page.id,
    name: getText(p['Nome']),
    active: getCheckbox(p['Ativo']),
    category: getSelect(p['Categoria']) as HabitCategory | null,
    frequency: getSelect(p['Frequência']) as HabitFrequency | null,
    time: getSelect(p['Horário']) as HabitTime | null,
    weeklyGoal: getNumber(p['Meta semanal']),
  }
}

// GET /api/notion/habits — retorna hábitos ativos
export async function GET() {
  try {
    await requireAuth()

    const response = await notion.databases.query({
      database_id: DB.habits,
      filter: { property: 'Ativo', checkbox: { equals: true } },
      sorts: [{ property: 'Nome', direction: 'ascending' }],
    })

    const habits: Habit[] = response.results.filter(isFullPage).map(pageToHabit)
    return NextResponse.json(habits)
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[habits GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
