import { createServerSupabaseClient } from './supabase-server'

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID!
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI!

export interface GmailMessage {
  id: string
  threadId: string
  from: string
  subject: string
  snippet: string
  date: string
  isRead: boolean
  labels: string[]
  body?: string
}

// URL de autorização OAuth
export function getGmailAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GMAIL_CLIENT_ID,
    redirect_uri: GMAIL_REDIRECT_URI,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state ? { state } : {}),
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// Troca code por tokens
export async function exchangeGmailCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  email: string
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      redirect_uri: GMAIL_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Failed to exchange Gmail code: ${res.status} ${errorText}`)
  }

  let tokens: { access_token: string; refresh_token: string; expires_in: number }
  try {
    tokens = await res.json()
  } catch (e) {
    throw new Error(`Invalid JSON response from Gmail token endpoint: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Gmail token response missing access_token or refresh_token')
  }

  // Busca e-mail do usuário
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userRes.ok) {
    throw new Error(`Failed to fetch Gmail user info: ${userRes.status}`)
  }

  let user: { email?: string }
  try {
    user = await userRes.json()
  } catch (e) {
    throw new Error(`Invalid JSON response from Gmail userinfo endpoint: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (!user.email) {
    throw new Error('Gmail user info response missing email field')
  }

  return { ...tokens, email: user.email }
}

// Renova access_token usando refresh_token
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Failed to refresh Gmail token: ${res.status} ${errorText}`)
  }

  let data: { access_token?: string }
  try {
    data = await res.json()
  } catch (e) {
    throw new Error(`Invalid JSON response from Gmail refresh endpoint: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (!data.access_token) {
    throw new Error('Gmail refresh response missing access_token')
  }

  return data.access_token
}

// Busca token válido do Supabase (renova se expirado)
async function getValidToken(email: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('email_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('provider', 'gmail')
    .eq('email', email)
    .single()

  if (error || !data) throw new Error('Gmail not connected')

  const expiresAt = new Date(data.expires_at).getTime()
  const now = Date.now()
  const bufferMs = 60_000 // 1 minute buffer

  // Token ainda é válido
  if (expiresAt > now + bufferMs) {
    return data.access_token
  }

  // Renova token
  const newToken = await refreshAccessToken(data.refresh_token)
  const newExpiresAt = new Date(now + 3600_000).toISOString()

  const { error: updateError } = await supabase
    .from('email_tokens')
    .update({
      access_token: newToken,
      expires_at: newExpiresAt,
    })
    .eq('provider', 'gmail')
    .eq('email', email)

  if (updateError) {
    console.error('Failed to update Gmail token in Supabase:', updateError)
    // Ainda retorna o novo token, mesmo se falhar a atualização
  }

  return newToken
}

// Lista mensagens
export async function listGmailMessages(
  email: string,
  options: { maxResults?: number; query?: string } = {}
): Promise<GmailMessage[]> {
  const token = await getValidToken(email)
  const { maxResults = 20, query = 'in:inbox' } = options

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!listRes.ok) {
    const errorText = await listRes.text()
    throw new Error(`Failed to list Gmail messages: ${listRes.status} ${errorText}`)
  }

  let listData: { messages?: Array<{ id: string }> }
  try {
    listData = await listRes.json()
  } catch (e) {
    throw new Error(`Invalid JSON response from Gmail list endpoint: ${e instanceof Error ? e.message : String(e)}`)
  }

  const messages: { id: string }[] = listData.messages ?? []

  // Busca detalhes em paralelo (máx 10 por vez) com tratamento de erro
  const results = await Promise.allSettled(
    messages.slice(0, 10).map((m) =>
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then(async (r) => {
          if (!r.ok) throw new Error(`Gmail API error: ${r.status}`)
          return r.json()
        })
    )
  )

  return results
    .map((result) => {
      if (result.status === 'rejected') {
        console.error('Failed to fetch Gmail message details:', result.reason)
        return null
      }
      const msg = result.value
      const headers: { name: string; value: string }[] = msg.payload?.headers ?? []
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? ''
      return {
        id: msg.id,
        threadId: msg.threadId,
        from: get('From'),
        subject: get('Subject'),
        snippet: msg.snippet ?? '',
        date: get('Date'),
        isRead: !msg.labelIds?.includes('UNREAD'),
        labels: msg.labelIds ?? [],
      }
    })
    .filter((msg): msg is GmailMessage => msg !== null)
}

// Arquiva mensagem (remove INBOX)
export async function archiveGmailMessage(email: string, messageId: string): Promise<void> {
  const token = await getValidToken(email)
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
  })
}

// Marca como lido
export async function markGmailAsRead(email: string, messageId: string): Promise<void> {
  const token = await getValidToken(email)
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  })
}
