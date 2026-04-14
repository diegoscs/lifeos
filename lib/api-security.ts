import { NextResponse } from 'next/server'

/**
 * Adiciona headers de segurança a uma resposta API
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  // CORS permitir same-origin only
  response.headers.set('Access-Control-Allow-Origin', 'same-origin')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  // Segurança
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

/**
 * Cria resposta JSON com headers de segurança
 */
export function secureJsonResponse(
  data: unknown,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(data, init)
  return withSecurityHeaders(response)
}

/**
 * Valida se uma string é um UUID válido (Notion ID format)
 */
export function isValidNotionId(id: unknown): id is string {
  if (typeof id !== 'string') return false
  // Notion IDs podem ter ou sem dashes, são 32 caracteres hexadecimais
  return /^[a-f0-9]{32}$|^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
}

/**
 * Valida select enum contra valores permitidos
 */
export function isValidSelect<T extends string>(value: unknown, allowedValues: readonly T[]): value is T {
  return typeof value === 'string' && allowedValues.includes(value as T)
}

/**
 * Valida data em formato YYYY-MM-DD
 */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value).getTime())
}

/**
 * Trata erros de API de forma consistente
 */
export function handleApiError(error: unknown, context: string) {
  const isAuthError = error instanceof Error && error.message === 'Unauthorized'
  const status = isAuthError ? 401 : 500

  if (error instanceof Error) {
    console.error(`[${context}]`, error.message, error.stack)
    return secureJsonResponse(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status }
    )
  }

  console.error(`[${context}]`, error)
  return secureJsonResponse(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
