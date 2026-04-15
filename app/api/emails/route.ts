import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { listGmailMessages } from '@/lib/gmail'
import { secureJsonResponse, handleApiError } from '@/lib/api-security'
import type { EmailMessage } from '@/hooks/useEmails'

async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, userId: user.id }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await requireAuth()

    // Buscar credenciais conectadas do Supabase
    const { data: tokens, error: tokensError } = await supabase
      .from('email_tokens')
      .select('provider, email, access_token, refresh_token, expires_at')

    if (tokensError) {
      console.error('Error fetching email tokens:', tokensError)
      return secureJsonResponse({
        messages: [],
        connected: [],
      })
    }

    const connected = (tokens ?? []).map((t) => ({
      provider: t.provider,
      email: t.email,
    }))

    // Se nenhuma conta conectada, retornar vazio
    if (!tokens || tokens.length === 0) {
      return secureJsonResponse({
        messages: [],
        connected: [],
      })
    }

    // Buscar e-mails de todas as contas conectadas
    const allMessages: EmailMessage[] = []

    for (const token of tokens) {
      if (token.provider === 'gmail') {
        try {
          const messages = await listGmailMessages(token.email)
          allMessages.push(
            ...messages.map((m) => ({
              ...m,
              provider: 'gmail' as const,
              account: token.email,
            }))
          )
        } catch (err) {
          console.error(`Failed to fetch Gmail messages for ${token.email}:`, err)
          // Continua com outras contas se uma falhar
        }
      }
    }

    // Ordenar por data (mais recentes primeiro)
    allMessages.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    return secureJsonResponse({
      messages: allMessages,
      connected,
    })
  } catch (err) {
    return handleApiError(err, 'emails GET')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuth()

    let body: unknown
    try {
      body = await request.json()
    } catch (e) {
      return secureJsonResponse({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null) {
      return secureJsonResponse({ error: 'Request body must be an object' }, { status: 400 })
    }

    // POST pode ser usado para marcar como lido, arquivar, etc (futura implementação)
    return secureJsonResponse({ error: 'Not implemented' }, { status: 501 })
  } catch (err) {
    return handleApiError(err, 'emails POST')
  }
}
