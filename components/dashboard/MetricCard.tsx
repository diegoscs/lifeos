interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
}

export default function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl px-5 py-4 space-y-1">
      <p className="text-xs text-neutral-600 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="text-xs text-neutral-600">{sub}</p>}
    </div>
  )
}
