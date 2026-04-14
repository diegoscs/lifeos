import { NextResponse } from 'next/server'
import { notion, DB, isFullPage, getText, getSelect, getDate, getCheckbox } from '@/lib/notion'
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
    progress: null,
    deployUrl: p['URL deploy']?.type === 'url' ? (p['URL deploy'].url ?? null) : null,
  }
}

async function calcProgress(projectId: string): Promise<number | null> {
  const res = await notion.databases.query({
    database_id: DB.tasks,
    filter: {
      property: 'Project',
      relation: { contains: projectId },
    },
  })

  const tasks = res.results.filter(isFullPage)
  if (tasks.length === 0) return null

  const done = tasks.filter((t) => getCheckbox(t.properties['Complete'])).length
  return Math.round((done / tasks.length) * 100)
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

    const withProgress = await Promise.all(
      projects.map(async (project) => ({
        ...project,
        progress: await calcProgress(project.id),
      }))
    )

    return NextResponse.json(withProgress)
  } catch (err) {
    console.error('[projects GET]', err)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
