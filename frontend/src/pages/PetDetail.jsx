import { useEffect, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPet, getAdopterProfile, submitApplication } from '../lib/api'
import { scorePair } from '../lib/scorer'
import { getCompatibility } from '../recommendationApi'
import { generatePetSummary } from '../lib/petSummary'
import ScoreGauge from '../components/ScoreGauge'
import MatchBreakdown from '../components/MatchBreakdown'
import StatusBadge from '../components/StatusBadge'
import { ArrowLeft, Sparkles, CheckCircle2, AlertTriangle, Info, Heart, Zap, ShieldCheck, MapPin, Building2 } from 'lucide-react'

export default function PetDetail() {
  const { id } = useParams(); const { user } = useAuth(); const nav = useNavigate()
  const [pet, setPet] = useState(null); const [match, setMatch] = useState(null); const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loadingMatch, setLoadingMatch] = useState(false)

  useEffect(() => {
    (async () => {
      const p = await getPet(id); setPet(p)
      if (user.role === 'adopter') {
        const prof = await getAdopterProfile(user.uid); setProfile(prof)
        if (prof && p) {
          setLoadingMatch(true)
          try {
            // Call the fast, dedicated single-pet endpoint (pet first, adopter profile second)
            const res = await getCompatibility(p, prof)
            const rawFactors = res.top_factors || res.explanation?.top_factors || []

            let contributions = rawFactors.map(tf => ({
              feature: tf.feature,
              label: tf.label,
              detail: `${tf.effect === 'raises' ? 'Raises' : 'Lowers'} score (${tf.contribution > 0 ? '+' : ''}${tf.contribution})`,
              impact: tf.contribution,
              effect: tf.effect
            }))

            // Fallback to local rubric breakdown if model returned no SHAP factors
            if (contributions.length === 0) {
              const localFallback = scorePair(prof, p)
              contributions = localFallback.contributions || []
            }

            setMatch({
              score: res.compatibility_score ?? (res.score ? res.score / 100 : 0),
              recommended: res.recommended,
              exclusion_reason: res.exclusion_reason,
              flags: res.flags || [],
              contributions,
              summary: res.explanation?.summary || res.summary
            })
          } catch (e) {
            console.warn('getCompatibility failed, using local rubric fallback:', e)
            setMatch(scorePair(prof, p))
          } finally {
            setLoadingMatch(false)
          }
        }
      }
    })()
  }, [id, user])

  const defaultShelterLoc = pet?.location || pet?.shelterLocation || 
    (pet?.shelterEmail?.includes('strathmore') ? 'Nairobi - Strathmore Hub' : 'Nairobi - Central Shelter')
  const defaultShelterName = pet?.shelterName || 
    (pet?.shelterEmail?.includes('strathmore') ? 'Strathmore Animal Sanctuary' : 'Adoptly Rescue Center')

  const apply = async () => {
    setBusy(true)
    try {
      await submitApplication({
        adopterId: user.uid,
        adopterName: user.name,
        petId: pet.id,
        petName: pet.name,
        petPhotoUrl: pet.photoUrl || '',
        petBreed: pet.breed || '',
        petSpecies: pet.species || 'Dog',
        shelterId: pet.shelterId,
        shelterEmail: pet.shelterEmail || '',
        shelterName: defaultShelterName,
        shelterLocation: defaultShelterLoc,
        pet: {
          id: pet.id,
          name: pet.name,
          breed: pet.breed,
          species: pet.species,
          photoUrl: pet.photoUrl,
          age: pet.age,
          energyLevel: pet.energyLevel,
          childFriendly: pet.childFriendly,
          adoptionStatus: pet.adoptionStatus,
          location: defaultShelterLoc,
          shelterLocation: defaultShelterLoc,
          shelterName: defaultShelterName,
        },
        score: match?.score ?? null,
        contributions: match?.contributions ?? [],
        adopterProfile: profile
      })
      nav('/my-applications')
    } catch (e) {
      console.error('Failed to submit application:', e)
      alert('Could not submit application. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!pet) return <p className="text-sm text-ink-muted">Loading…</p>

  const displaySummary = (!match?.summary || match?.summary.includes('Based on your lifestyle profile'))
    ? generatePetSummary(pet, match?.score, match?.contributions, match?.flags)
    : match?.summary

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-forest-dark transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Pet Photo and Dossier */}
        <div className="overflow-hidden rounded-[28px] border border-line/90 bg-white shadow-soft">
          <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-forest-wash">
            {pet.photoUrl ? (
              <>
                <img
                  src={pet.photoUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-30 pointer-events-none"
                />
                <img
                  src={pet.photoUrl}
                  alt={pet.name}
                  className="relative h-full w-full object-cover object-[center_20%]"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-8xl bg-gradient-to-br from-forest-wash to-cream-dim">
                {pet.species === 'Cat' ? '🐱' : '🐶'}
              </div>
            )}
            <div className="absolute right-3.5 top-3.5">
              <StatusBadge status={pet.adoptionStatus || 'Available'} size="sm" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute left-4 bottom-3 text-white text-xs font-semibold drop-shadow-sm">
              {pet.species} · {pet.breed || 'Breed unlisted'}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="h-serif text-3xl font-bold">{pet.name}</h1>
                <p className="mt-1 text-xs font-medium text-ink-muted">
                  {pet.breed} · {pet.age} yr{Number(pet.age) === 1 ? '' : 's'} · {pet.size} size
                </p>

                {/* Shelter Specification */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-line-soft bg-cream-soft px-2.5 py-1 text-xs font-semibold text-ink-head">
                    <Building2 size={13} className="text-forest" />
                    <span>{defaultShelterName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-forest/20 bg-forest-wash px-2.5 py-1 text-xs font-bold text-forest">
                    <MapPin size={13} className="text-forest" />
                    <span>{defaultShelterLoc}</span>
                  </span>
                </div>
              </div>
              {pet.temperament && (
                <span className="rounded-xl border border-forest/20 bg-forest-wash px-3 py-1 text-xs font-bold text-forest shrink-0">
                  {pet.temperament}
                </span>
              )}
            </div>

            {/* Trait highlights */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-line-soft bg-cream-soft p-2.5 flex items-center gap-2">
                <Zap size={14} className="text-amber-600 shrink-0" />
                <span className="truncate">Energy Level: <strong>{pet.energyLevel || 3}/5</strong></span>
              </div>
              <div className="rounded-xl border border-line-soft bg-cream-soft p-2.5 flex items-center gap-2">
                <Heart size={14} className="text-rose-500 shrink-0" />
                <span className="truncate">Child Friendly: <strong>{pet.childFriendly || 3}/5</strong></span>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line-soft pt-4">
              {[
                ['Species', pet.species], 
                ['Shelter Location', defaultShelterLoc],
                ['Health status', pet.healthStatus || 'Healthy'], 
                ['Adoption status', pet.adoptionStatus],
                ['Care requirements', pet.careRequirements || 'Standard companionship']
              ].map(([k, v]) => (
                <div key={k} className={k === 'Care requirements' ? 'col-span-2' : ''}>
                  <dt className="label mb-1">{k}</dt>
                  <dd className="text-sm font-medium text-ink-head">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right: Compatibility Analysis & Apply Form */}
        {user.role === 'adopter' && (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-line/90 bg-white p-6 shadow-soft">
              {loadingMatch ? (
                <div className="py-8 text-center text-sm text-ink-muted">
                  <Sparkles className="mx-auto mb-2 text-forest animate-pulse" size={26} />
                  <p className="font-semibold text-ink-head">Analyzing compatibility...</p>
                  <p className="mt-1 text-xs">Evaluating lifestyle fit and pet traits</p>
                </div>
              ) : match ? (
                <>
                  {match.recommended === false && (
                    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-900 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-sm text-rose-700 mb-1">
                        <AlertTriangle size={16} className="text-rose-600" /> Child Safety Notice
                      </div>
                      <p className="leading-relaxed">{match.exclusion_reason || 'Not recommended for households with young children.'}</p>
                    </div>
                  )}

                  {match.flags && match.flags.includes('child_friendliness_not_assessed') && (
                    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                      <span><strong>Notice:</strong> Child-friendliness not assessed by shelter. Default species estimate applied.</span>
                    </div>
                  )}

                  {match.flags && match.flags.includes('energy_level_not_assessed') && (
                    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                      <Info size={14} className="shrink-0 text-amber-600" />
                      <span><strong>Notice:</strong> Energy level not assessed by shelter. Default species estimate applied.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <ScoreGauge score={match.score} size={84} />
                    <div className="min-w-0">
                      <h2 className="font-serif text-lg font-bold text-ink-head">Compatibility Analysis</h2>
                      <p className="mt-1 text-xs leading-relaxed text-ink-muted italic font-medium">“{displaySummary}”</p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-line-soft pt-5">
                    <MatchBreakdown contributions={match.contributions} />
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <Sparkles className="mx-auto text-forest mb-2" size={24} />
                  <p className="text-sm font-bold text-ink-head">Personalized Compatibility</p>
                  <p className="mt-1 text-xs text-ink-muted">Complete your adopter profile to calculate a compatibility score for {pet.name}.</p>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-line/90 bg-white p-6 shadow-soft">
              <button
                className="btn-primary w-full py-3 text-sm shadow-md"
                disabled={busy || pet.adoptionStatus !== 'Available' || !profile}
                onClick={apply}
              >
                {pet.adoptionStatus !== 'Available'
                  ? 'Not available'
                  : busy
                    ? 'Submitting application…'
                    : <><CheckCircle2 size={16} /> Apply to adopt {pet.name}</>}
              </button>
              <p className="mt-3 text-center text-[11px] text-ink-whisper">
                Your application will be forwarded to the verified shelter team at {defaultShelterLoc} for review.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
