import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { listGmailMessages } from '@/lib/gmail'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Busca contas conectadas
    const { data: tokens } = await supabase
      .from('email_tokens')
      .select('provider, email')

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ messages: [], connected: [] })
    }

    const allMessages = await Promise.allSettled(
      tokens.map(async (t) => {
        if (t.provider === 'gmail') {
          const msgs = await listGmailMessages(t.email, { maxResults: 20 })
          return msgs.map((m) => ({ ...m, provider: 'gmail' as const, account: t.email }))
        }
        return []
      })
    )

    const messages = allMessages
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const connected = tokens.map((t) => ({ provider: t.provider, email: t.email }))

    return NextResponse.json({ messages, connected })
  } catch (err) {
    console.error('[emails GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
