interface PlaceholderCardProps {
  title: string
  message: string
}

export default function PlaceholderCard({ title, message }: PlaceholderCardProps) {
  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3">
      <h2 className="text-xs text-neutral-500 uppercase tracking-wide">{title}</h2>
      <p className="text-sm text-neutral-700">{message}</p>
    </div>
  )
}
