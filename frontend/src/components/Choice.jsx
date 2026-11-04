// Categorical selector: single or multi. Same props as before.
export default function Choice({ options, value, onChange, multi = false }) {
  const selected = v => (multi ? value?.includes(v) : value === v)
  const toggle = v => {
    if (!multi) return onChange(v)
    const cur = value || []
    onChange(cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v])
  }
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map(o => {
        const isSel = selected(o)
        return (
          <button
            type="button"
            key={o}
            onClick={() => toggle(o)}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
              isSel
                ? 'border-forest bg-gradient-to-r from-forest to-forest-dark text-white shadow-sm shadow-forest/30 scale-[1.02]'
                : 'border-line/90 bg-white/90 text-ink-muted hover:border-forest/40 hover:bg-forest-wash hover:text-forest'
            }`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}