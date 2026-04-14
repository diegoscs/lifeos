import { NextResponse, type NextRequest } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getCheckbox, getNumber } from '@/lib/notion'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { secureJsonResponse, handleApiError } from '@/lib/api-security'
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
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const response = await notion.databases.query({
      database_id: DB.habits,
      filter: { property: 'Ativo', checkbox: { equals: true } },
      sorts: [{ property: 'Nome', direction: 'ascending' }],
    })

    const habits: Habit[] = response.results.filter(isFullPage).map(pageToHabit)
    return secureJsonResponse(habits)
  } catch (err) {
    return handleApiError(err, 'habits GET')
  }
}
