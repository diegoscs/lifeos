import { NextResponse, type NextRequest } from 'next/server'
import { exchangeGmailCode } from '@/lib/gmail'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/emails?error=gmail_denied`)
  }

  try {
    const { access_token, refresh_token, expires_in, email } = await exchangeGmailCode(code)

    const supabase = await createServerSupabaseClient()
    const { error: dbError } = await supabase.from('email_tokens').upsert(
      {
        provider: 'gmail',
        email,
        access_token,
        refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      },
      { onConflict: 'provider,email' }
    )

    if (dbError) throw dbError

    return NextResponse.redirect(`${origin}/emails?connected=gmail`)
  } catch (err) {
    console.error('[gmail callback]', err)
    return NextResponse.redirect(`${origin}/emails?error=gmail_failed`)
  }
}
