import { useEffect, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPet, getAdopterProfile, submitApplication } from '../lib/api'
import { scorePair } from '../lib/scorer'
import ScoreGauge from '../components/ScoreGauge'
import MatchBreakdown from '../components/MatchBreakdown'
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'

export default function PetDetail() {
  const { id } = useParams(); const { user } = useAuth(); const nav = useNavigate()
  const [pet, setPet] = useState(null); const [match, setMatch] = useState(null); const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    (async () => {
      const p = await getPet(id); setPet(p)
      if (user.role === 'adopter') {
        const prof = await getAdopterProfile(user.uid); setProfile(prof)
        // TODO: swap for a per-pet call to the ML endpoint once deployed.
        if (prof && p) setMatch(scorePair(prof, p))
      }
    })()
  }, [id, user])

  const apply = async () => {
    setBusy(true)
    await submitApplication({
      adopterId: user.uid, adopterName: user.name, petId: pet.id, petName: pet.name, shelterId: pet.shelterId,
      score: match?.score ?? null, contributions: match?.contributions ?? [], adopterProfile: profile
    })
    nav('/my-applications')
  }

  if (!pet) return <p className="text-sm text-ink-muted">Loading…</p>

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => nav(-1)} className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-forest-dark">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-soft">
          <div className="flex h-64 items-center justify-center bg-forest-wash text-7xl">
            {pet.photoUrl
              ? <img src={pet.photoUrl} alt={pet.name} className="h-full w-full object-cover" />
              : (pet.species === 'Cat' ? '🐱' : '🐶')}
          </div>
          <div className="p-6">
            <h1 className="h-serif text-3xl">{pet.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">{pet.breed} · {pet.age} yr{pet.age === 1 ? '' : 's'} · {pet.size}</p>

            <dl className="mt-6 grid grid-cols-2 gap-4">
              {[['Species', pet.species], ['Temperament', pet.temperament], ['Energy', pet.energyLevel],
                ['Health', pet.healthStatus], ['Care needs', pet.careRequirements], ['Status', pet.adoptionStatus]]
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="label mb-1">{k}</dt>
                    <dd className="text-sm font-medium text-ink-head">{v || '—'}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        {user.role === 'adopter' && (
          <div className="space-y-6">
            <div className="rounded-[20px] border border-line bg-white p-6 shadow-soft">
              {match ? (
                <>
                  <div className="flex items-center gap-4">
                    <ScoreGauge score={match.score} size={80} />
                    <div>
                      <h2 className="h-serif text-lg">Why this score?</h2>
                      <p className="mt-1 text-xs leading-5 text-ink-muted">{match.summary}</p>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-line-soft pt-5">
                    <MatchBreakdown contributions={match.contributions} />
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <Sparkles className="mx-auto text-terracotta" size={20} />
                  <p className="mt-3 text-sm text-ink-muted">Complete your profile to see a compatibility score.</p>
                </div>
              )}
            </div>

            <div className="rounded-[20px] border border-line bg-white p-5 shadow-soft">
              <button className="btn-primary w-full"
                disabled={busy || pet.adoptionStatus !== 'Available' || !profile}
                onClick={apply}>
                {pet.adoptionStatus !== 'Available'
                  ? 'Not available'
                  : busy
                    ? 'Submitting…'
                    : <><CheckCircle2 size={16} /> Apply to adopt</>}
              </button>
              <p className="mt-3 text-center text-[11px] text-ink-whisper">
                Applications are reviewed by the shelter. You'll be notified of any updates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}