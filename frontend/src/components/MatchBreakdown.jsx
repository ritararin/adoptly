import { TrendingUp, TrendingDown, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { getFactorSymbol, getFactorDescription } from '../lib/shapExplain'

export default function MatchBreakdown({ contributions = [] }) {
  if (!contributions || contributions.length === 0) {
    return (
      <p className="text-xs text-ink-muted italic">
        No factor breakdowns recorded for this evaluation.
      </p>
    )
  }

  const max = Math.max(0.01, ...contributions.map(c => Math.abs(c.impact || c.contribution || 0)))

  return (
    <div className="space-y-4">
      <div className="space-y-3.5">
        {contributions.map((c, index) => {
          const impact = c.impact ?? c.contribution ?? 0
          const absImpact = Math.abs(impact)
          const isPositive = (c.effect === 'raises') || impact >= 0
          const barWidthPct = Math.min(50, Math.max(8, (absImpact / max) * 50))
          const { symbol, badgeText } = getFactorSymbol(impact, c.effect)
          const description = getFactorDescription(c)

          return (
            <div
              key={`${c.feature || c.label}-${index}`}
              className="rounded-2xl border border-line-soft bg-cream-soft/60 p-3.5 transition-all hover:bg-cream-soft"
            >
              {/* Factor Header & Symbol Badge (No Raw Numbers) */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-ink-head">
                  {c.label}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-2xs ${
                    isPositive
                      ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100/80 text-rose-800 border border-rose-200'
                  }`}
                  title={isPositive ? 'Raises compatibility' : 'Lowers compatibility'}
                >
                  {isPositive ? (
                    <TrendingUp size={12} className="text-emerald-700" />
                  ) : (
                    <TrendingDown size={12} className="text-rose-600" />
                  )}
                  <span className="tracking-widest font-mono text-sm leading-none">{symbol}</span>
                  <span className="text-[10px] font-semibold opacity-90 hidden sm:inline">({badgeText})</span>
                </span>
              </div>

              {/* Natural Language Explanation */}
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
                {description}
              </p>

              {/* Visual Relative Balance Bar */}
              <div className="mt-2.5 relative h-1.5 w-full rounded-full bg-cream-deep overflow-hidden">
                {/* Center baseline divider */}
                <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-line z-10" />

                <div
                  className={`absolute inset-y-0 rounded-full transition-all duration-500 ${
                    isPositive
                      ? 'left-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600'
                      : 'right-1/2 bg-gradient-to-l from-rose-400 to-rose-500'
                  }`}
                  style={{ width: `${barWidthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Symbol-Based Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
            +
          </span>
          <span><strong>+ / ++</strong> Factor boosts compatibility</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-800">
            -
          </span>
          <span><strong>- / --</strong> Lifestyle consideration / trade-off</span>
        </span>
      </div>
    </div>
  )
}
