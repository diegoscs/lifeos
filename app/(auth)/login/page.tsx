'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="w-full max-w-sm space-y-4 px-6">
          <h1 className="text-2xl font-semibold text-white">Verifique seu e-mail</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Enviamos um link de acesso para{' '}
            <span className="text-white font-medium">{email}</span>.
            <br />
            Clique no link para entrar no LifeOS.
          </p>
          <button
            onClick={() => { setSubmitted(false); setEmail('') }}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Usar outro e-mail
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">LifeOS</h1>
          <p className="text-neutral-400 text-sm">Digite seu e-mail para receber o link de acesso.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoFocus
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-white text-neutral-950 font-medium rounded-lg px-4 py-3 text-sm hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar link de acesso'}
          </button>
        </form>
      </div>
    </div>
  )
}
