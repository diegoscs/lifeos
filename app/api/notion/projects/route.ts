import { NextResponse } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getDate, getNumber } from '@/lib/notion'
import type { Project } from '@/types'

function pageToProject(page: Parameters<typeof isFullPage>[0]): Project | null {
  if (!isFullPage(page)) return null
  const p = page.properties

  return {
    id: page.id,
    name: getText(p['Nome']),
    status: (getSelect(p['Status']) as Project['status']) ?? null,
    category: (getSelect(p['Categoria']) as Project['category']) ?? null,
    priority: (getSelect(p['Prioridade']) as Project['priority']) ?? null,
    deadline: getDate(p['Prazo']),
    progress: getNumber(p['Progresso %']),
    nextAction: p['Próxima ação']?.type === 'rich_text'
      ? p['Próxima ação'].rich_text.map((t) => t.plain_text).join('')
      : null,
    deployUrl: p['URL deploy']?.type === 'url' ? (p['URL deploy'].url ?? null) : null,
  }
}

export async function GET() {
  try {
    const res = await notion.databases.query({
      database_id: DB.projects,
      sorts: [
        { property: 'Status', direction: 'ascending' },
        { property: 'Prioridade', direction: 'ascending' },
      ],
    })

    const projects = res.results
      .map(pageToProject)
      .filter((p): p is Project => p !== null)

    return NextResponse.json(projects)
  } catch (err) {
    console.error('[projects GET]', err)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, nextAction, progress } = await req.json() as {
      id: string
      nextAction?: string
      progress?: number
    }

    const properties: Record<string, unknown> = {}

    if (nextAction !== undefined) {
      properties['Próxima ação'] = {
        rich_text: [{ type: 'text', text: { content: nextAction } }],
      }
    }

    if (progress !== undefined) {
      properties['Progresso %'] = { number: progress }
    }

    const updated = await notion.pages.update({ page_id: id, properties })
    const project = pageToProject(updated)
    return NextResponse.json(project)
  } catch (err) {
    console.error('[projects PATCH]', err)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}
