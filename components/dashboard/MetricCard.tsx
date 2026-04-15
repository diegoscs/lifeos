interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'indigo' | 'green' | 'yellow' | 'blue'
}

const accentBar: Record<string, string> = {
  indigo: 'bg-indigo-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  blue:   'bg-blue-500',
}

export default function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl px-5 py-4 space-y-1 hover:border-neutral-800 transition-colors relative overflow-hidden">
      {accent && (
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar[accent]}`} />
      )}
      <p className="text-xs text-neutral-600 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="text-xs text-neutral-600">{sub}</p>}
    </div>
  )
}
