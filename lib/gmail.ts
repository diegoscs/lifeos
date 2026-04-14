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

  if (!res.ok) throw new Error('Failed to exchange Gmail code')
  const tokens = await res.json()

  // Busca e-mail do usuário
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const user = await userRes.json()

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
  if (!res.ok) throw new Error('Failed to refresh Gmail token')
  const data = await res.json()
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

  const isExpired = new Date(data.expires_at) <= new Date(Date.now() + 60_000)
  if (!isExpired) return data.access_token

  // Renova
  const newToken = await refreshAccessToken(data.refresh_token)
  await supabase
    .from('email_tokens')
    .update({
      access_token: newToken,
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    })
    .eq('provider', 'gmail')
    .eq('email', email)

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
  if (!listRes.ok) throw new Error('Failed to list Gmail messages')
  const listData = await listRes.json()
  const messages: { id: string }[] = listData.messages ?? []

  // Busca detalhes em paralelo (máx 10 por vez)
  const details = await Promise.all(
    messages.slice(0, 10).map((m) =>
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then((r) => r.json())
    )
  )

  return details.map((msg) => {
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
