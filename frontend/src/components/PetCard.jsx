import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Sparkles, Zap, HeartHandshake, Quote, MapPin } from 'lucide-react'
import ScoreGauge from './ScoreGauge'
import PetHoverPreview from './PetHoverPreview'
import { generatePetSummary } from '../lib/petSummary'

export default function PetCard({ pet, score, summary }) {
  const [saved, setSaved] = useState(false)
  const scorePct = score != null ? Math.round(score * 100) : null

  // Always compute a vibrant, pet-specific summary if the passed summary is empty or the old generic text
  const finalSummary = (!summary || summary.includes('Based on your lifestyle profile'))
    ? generatePetSummary(pet, score)
    : summary

  const energyLevel = Number(pet?.energyLevel) || 3
  const childFriendly = Number(pet?.childFriendly) || 3
  const locationStr = pet.location || pet.shelterLocation

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-line/90 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-forest/40 hover:shadow-xl hover:ring-2 hover:ring-forest/10">
      <div>
        {/* Photo Container with Vignette Gradient, Proportional Fit, and Click-to-View Profile Link */}
        <Link
          to={`/pets/${pet.id}`}
          state={{ score, summary: finalSummary }}
          title={`View ${pet.name}'s profile`}
          className="relative block aspect-[4/3] min-h-[240px] max-h-[300px] w-full overflow-hidden bg-forest-wash cursor-pointer"
        >
          {pet.photoUrl ? (
            <>
              {/* Blurred ambient background to gracefully fill borders */}
              <img
                src={pet.photoUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-30 pointer-events-none"
              />
              {/* Main pet image with face-biased positioning */}
              <img
                src={pet.photoUrl}
                alt={pet.name}
                className="relative h-full w-full object-cover object-[center_20%] transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl select-none bg-gradient-to-br from-forest-wash to-cream-dim">
              {pet.species === 'Cat' ? '🐱' : '🐶'}
            </div>
          )}

          {/* Bottom vignette overlay for visual contrast */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none z-10" />

          {/* Match Score Badge */}
          {scorePct != null && (
            <div className="absolute left-3.5 top-3.5 z-10">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold shadow-md backdrop-blur-md transition-transform group-hover:scale-105 ${
                  scorePct >= 80
                    ? 'border border-emerald-400/40 bg-forest/90 text-gold shadow-forest/20'
                    : scorePct >= 65
                    ? 'border border-amber-400/30 bg-amber-900/85 text-amber-200'
                    : 'border border-white/20 bg-black/60 text-white'
                }`}
              >
                <Sparkles size={11} className={scorePct >= 80 ? 'text-gold animate-pulse' : 'text-current'} />
                <span>{scorePct}% Match</span>
              </div>
            </div>
          )}

          {/* Quick Pet Age Pill Overlay on Image */}
          {pet.age != null && (
            <div className="absolute left-3.5 bottom-3 text-[11px] font-semibold text-white/95 drop-shadow-sm z-10">
              {pet.age} year{Number(pet.age) === 1 ? '' : 's'} old
            </div>
          )}

          {/* Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSaved(s => !s)
            }}
            aria-label={saved ? 'Remove from saved' : 'Save pet'}
            className="absolute right-3.5 top-3.5 z-20 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-muted shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-90"
          >
            <Heart
              size={16}
              fill={saved ? '#e11d48' : 'none'}
              color={saved ? '#e11d48' : 'currentColor'}
              className="transition-transform duration-200"
            />
          </button>
        </Link>

        {/* Content Section */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <PetHoverPreview pet={pet}>
                <Link
                  to={`/pets/${pet.id}`}
                  state={{ score, summary: finalSummary }}
                  className="group/name block"
                >
                  <h3 className="font-serif text-[22px] font-bold text-ink-head leading-tight group-hover/name:text-forest group-hover:text-forest transition-colors cursor-pointer">
                    {pet.name}
                  </h3>
                </Link>
              </PetHoverPreview>
              <p className="mt-1 truncate text-xs font-medium text-ink-muted">
                {[pet.breed || pet.species, pet.size].filter(Boolean).join(' · ')}
              </p>
              {locationStr && (
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-forest">
                  <MapPin size={11} className="shrink-0 text-forest" />
                  <span className="truncate">{locationStr}</span>
                </div>
              )}
            </div>
            {score != null && (
              <div className="shrink-0 transition-transform group-hover:scale-105">
                <ScoreGauge score={score} size={44} />
              </div>
            )}
          </div>

          {/* Trait Indicators Row */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {pet.temperament && (
              <span className="rounded-lg border border-forest/15 bg-forest-wash px-2 py-0.5 text-[10px] font-bold text-forest">
                {pet.temperament}
              </span>
            )}
            <span className="rounded-lg border border-line-soft bg-cream-soft px-2 py-0.5 text-[10px] font-semibold text-ink-muted flex items-center gap-1">
              <Zap size={10} className="text-amber-600" />
              <span>Energy {energyLevel}/5</span>
            </span>
            {childFriendly >= 4 && (
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <HeartHandshake size={10} className="text-emerald-600" />
                <span>Kid Friendly</span>
              </span>
            )}
          </div>

          {/* Tailored Pet-Specific Summary */}
          {finalSummary && (
            <div className="mt-3.5 relative overflow-hidden rounded-2xl border border-line-soft bg-cream-soft/75 p-3.5 transition-colors group-hover:bg-cream-soft">
              <div className="flex items-start gap-2">
                <Quote size={12} className="text-forest/60 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-ink-muted italic font-medium">
                  {finalSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-5 pb-5 pt-1">
        <Link
          to={`/pets/${pet.id}`}
          state={{ score, summary: finalSummary }}
          className="flex w-full items-center justify-between rounded-xl border border-forest/20 bg-forest-wash/80 px-4 py-2.5 text-xs font-bold text-forest transition-all hover:bg-forest hover:text-white hover:shadow-md group/btn"
        >
          <span>Meet {pet.name}</span>
          <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </article>
  )
}
