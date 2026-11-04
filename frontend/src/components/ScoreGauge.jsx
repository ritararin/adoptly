export default function ScoreGauge({ score, size = 56 }) {
  const normalized = Math.max(0, Math.min(1, Number(score) || 0))
  const pct = Math.round(normalized * 100)
  const strokeWidth = size > 64 ? 6 : 4.5
  const r = size / 2 - strokeWidth - 1
  const c = 2 * Math.PI * r

  const color =
    pct >= 75
      ? '#1f5c48' // Forest emerald
      : pct >= 50
      ? '#d97706' // Warm amber
      : '#e11d48' // Rose

  const fontSize = size > 64 ? 'text-lg' : 'text-[11px]'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="white"
          stroke="#edf0ea"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - normalized)}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-serif font-bold ${fontSize}`}
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  )
}
