// SHAP-style contributions as a diverging bar list (FR-06). Contract unchanged.
export default function MatchBreakdown({ contributions = [] }) {
  const max = Math.max(0.01, ...contributions.map(c => Math.abs(c.impact)))
  return (
    <div className="space-y-3.5">
      {contributions.map(c => (
        <div key={c.feature}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-head">{c.label}</span>
            <span className="text-[11px] text-ink-faint">{c.detail}</span>
          </div>
          <div className="relative h-2 rounded-full bg-cream-dim">
            <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
            <div
              className={`absolute inset-y-0 rounded-full ${c.impact >= 0 ? 'bg-forest' : 'bg-terracotta'}`}
              style={c.impact >= 0
                ? { left: '50%', width: `${(c.impact / max) * 50}%` }
                : { right: '50%', width: `${(-c.impact / max) * 50}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-1 text-[11px] text-ink-whisper">
        <span className="font-semibold text-forest">Green</span> raises the compatibility score ·{' '}
        <span className="font-semibold text-terracotta">Terracotta</span> lowers it.
      </p>
    </div>
  )
}