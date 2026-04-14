import { clsx } from 'clsx'

export default function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'w-4 h-4 rounded-full border-2 border-neutral-700 border-t-neutral-400 animate-spin',
        className
      )}
    />
  )
}
