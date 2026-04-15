'use client'

interface StreakCardProps {
  streak: number | string
  isLoading: boolean
}

export default function StreakCard({ streak, isLoading }: StreakCardProps) {
  const value = isLoading ? '—' : streak

  return (
    <div className="bg-gradient-to-br from-orange-950 to-neutral-950 border border-orange-900 rounded-xl px-5 py-6 space-y-3 flex flex-col items-center justify-center">
      <div className="text-4xl">🔥</div>
      <div className="space-y-1 text-center">
        <p className="text-5xl font-bold text-orange-400">{value}</p>
        <p className="text-xs text-orange-300 uppercase tracking-wider">dias em sequência</p>
      </div>
    </div>
  )
}
