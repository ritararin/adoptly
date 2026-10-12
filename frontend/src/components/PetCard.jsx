import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart } from 'lucide-react'
import ScoreGauge from './ScoreGauge'

export default function PetCard({ pet, score, summary }) {
  const [saved, setSaved] = useState(false)
  return (
    <article className="group overflow-hidden rounded-[20px] border border-line bg-white shadow-soft transition hover:shadow-lift">
      <div className="relative h-[220px] overflow-hidden bg-forest-wash">
        {pet.photoUrl
          ? <img src={pet.photoUrl} alt={pet.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="flex h-full w-full items-center justify-center text-7xl">
              {pet.species === 'Cat' ? '🐱' : '🐶'}
            </div>}
        {score != null && (
          <div className="absolute left-4 top-4 rounded-full bg-gold-soft px-3 py-1.5 text-[11px] font-bold text-gold-ink">
            {Math.round(score * 100)}% match
          </div>
        )}
        <button
          type="button"
          onClick={() => setSaved(s => !s)}
          aria-label={saved ? 'Remove from saved' : 'Save pet'}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/85 text-ink-muted backdrop-blur-sm hover:bg-white">
          <Heart size={17} fill={saved ? '#df805b' : 'none'} color={saved ? '#df805b' : 'currentColor'} />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="h-serif text-[23px] leading-tight">{pet.name}</h3>
            <p className="mt-0.5 truncate text-xs text-ink-faint">
              {pet.breed} · {pet.age} yr{pet.age === 1 ? '' : 's'} · {pet.size}
            </p>
          </div>
          {score != null && <div className="shrink-0"><ScoreGauge score={score} size={44} /></div>}
        </div>

        {summary && (
          <p className="mt-4 rounded-xl bg-forest-wash px-3 py-2.5 text-[12px] italic leading-5 text-ink-muted">
            “{summary}”
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
          <Link to={`/pets/${pet.id}`} state={{ score, summary }}
            className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-forest-dark">
            View profile <ArrowRight size={13} />
          </Link>
          <span className="text-[10px] text-ink-whisper">{pet.temperament}</span>
        </div>
      </div>
    </article>
  )
}