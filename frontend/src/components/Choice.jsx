// Categorical selector: single or multi. Same props as before.
export default function Choice({ options, value, onChange, multi = false }) {
  const selected = v => (multi ? value?.includes(v) : value === v)
  const toggle = v => {
    if (!multi) return onChange(v)
    const cur = value || []
    onChange(cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button type="button" key={o} onClick={() => toggle(o)}
          className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${
            selected(o)
              ? 'border-forest bg-forest text-white shadow-sm'
              : 'border-line bg-white text-ink-muted hover:border-forest/50 hover:text-forest'
          }`}>
          {o}
        </button>
      ))}
    </div>
  )
}