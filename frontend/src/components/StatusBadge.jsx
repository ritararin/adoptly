const COLORS = {
  'Pending Review':      'bg-gold-soft text-gold-ink',
  'Interview Scheduled': 'bg-forest-tint text-forest',
  'Adoption Completed':  'bg-forest-wash text-forest-dark',
  'Rejected':            'bg-terracotta/15 text-terracotta-deep',
  'Failed Adoption':     'bg-terracotta/15 text-terracotta-deep',
  'Cancelled':           'bg-cream-dim text-ink-muted',
  'Available':           'bg-forest-tint text-forest',
  'Pending':             'bg-gold-soft text-gold-ink',
  'Adopted':             'bg-cream-dim text-ink-muted'
}
export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${COLORS[status] || 'bg-cream-dim text-ink-muted'}`}>
      {status}
    </span>
  )
}