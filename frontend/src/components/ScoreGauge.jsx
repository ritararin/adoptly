export default function ScoreGauge({ score, size = 56 }) {
  const pct = Math.round(score * 100)
  const r = size / 2 - 5, c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="white" stroke="#e5e6df" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f5c48" strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={c * (1 - score)} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-xs font-semibold text-forest">
        {pct}%
      </span>
    </div>
  )
}