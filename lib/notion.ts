import { Client } from '@notionhq/client'
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  PartialDatabaseObjectResponse,
  DatabaseObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// IDs dos bancos
export const DB = {
  tasks:    process.env.NOTION_TASKS_DB!,
  projects: process.env.NOTION_PROJECTS_DB!,
  habits:   process.env.NOTION_HABITS_DB!,
  records:  process.env.NOTION_RECORDS_DB!,
  finance:  process.env.NOTION_FINANCE_DB!,
} as const

export type NotionResult =
  | PageObjectResponse
  | PartialPageObjectResponse
  | PartialDatabaseObjectResponse
  | DatabaseObjectResponse

// Filtra só páginas completas (têm `properties`)
export function isFullPage(page: NotionResult): page is PageObjectResponse {
  return 'properties' in page && 'parent' in page
}

// Extrai texto de title ou rich_text
export function getText(prop: PageObjectResponse['properties'][string]): string {
  if (prop.type === 'title') return prop.title.map((t) => t.plain_text).join('')
  if (prop.type === 'rich_text') return prop.rich_text.map((t) => t.plain_text).join('')
  return ''
}

// Extrai valor de select
export function getSelect(prop: PageObjectResponse['properties'][string]): string | null {
  if (prop.type === 'select') return prop.select?.name ?? null
  return null
}

// Extrai valor de checkbox
export function getCheckbox(prop: PageObjectResponse['properties'][string]): boolean {
  if (prop.type === 'checkbox') return prop.checkbox
  return false
}

// Extrai data (start)
export function getDate(prop: PageObjectResponse['properties'][string]): string | null {
  if (prop.type === 'date') return prop.date?.start ?? null
  return null
}

// Extrai número
export function getNumber(prop: PageObjectResponse['properties'][string]): number | null {
  if (prop.type === 'number') return prop.number
  return null
}
