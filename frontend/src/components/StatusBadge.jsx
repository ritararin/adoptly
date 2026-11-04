const STATUS_STYLES = {
  'Interview Scheduled': {
    wrapper: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    dot: 'bg-emerald-500 animate-pulse',
  },
  'Available': {
    wrapper: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    dot: 'bg-emerald-500',
  },
  'Pending Review': {
    wrapper: 'bg-amber-50 text-amber-800 border-amber-200/70',
    dot: 'bg-amber-500 animate-pulse',
  },
  'Pending': {
    wrapper: 'bg-amber-50 text-amber-800 border-amber-200/70',
    dot: 'bg-amber-500',
  },
  'Adoption Completed': {
    wrapper: 'bg-forest text-cream border-forest-dark',
    dot: 'bg-gold',
  },
  'Adopted': {
    wrapper: 'bg-ink/5 text-ink-muted border-line',
    dot: 'bg-ink-whisper',
  },
  'Rejected': {
    wrapper: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dot: 'bg-rose-400',
  },
  'Failed Adoption': {
    wrapper: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dot: 'bg-rose-400',
  },
  'Cancelled': {
    wrapper: 'bg-cream-dim text-ink-muted border-line',
    dot: 'bg-ink-whisper',
  },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const style = STATUS_STYLES[status] || {
    wrapper: 'bg-cream-soft text-ink-muted border-line',
    dot: 'bg-ink-whisper',
  }

  const padding = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide shadow-2xs transition-all ${style.wrapper} ${padding}`}
    >
      <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} />
      <span>{status}</span>
    </span>
  )
}
