import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAdopterProfile, getRecommendations } from '../lib/api'
import PetCard from '../components/PetCard'
import ScoreGauge from '../components/ScoreGauge'
import { ArrowRight, Sparkles, SlidersHorizontal, Heart, Home } from 'lucide-react'

export default function Matches() {
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, profile: null, recs: [], error: '' })
  useEffect(() => {
    (async () => {
      try {
        const profile = await getAdopterProfile(user.uid)
        if (!profile) return setState({ loading: false, profile: null, recs: [], error: '' })
        const recs = await getRecommendations(user.uid, profile)
        setState({ loading: false, profile, recs, error: '' })
      } catch (e) { setState({ loading: false, profile: null, recs: [], error: e.message }) }
    })()
  }, [user.uid])

  if (state.loading) return <p className="text-sm text-ink-muted">Finding your best matches…</p>
  if (state.error) return <p className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta-deep">{state.error}</p>

  if (!state.profile) return (
    <div className="mx-auto max-w-md rounded-[24px] border border-line bg-white p-8 text-center shadow-soft">
      <Sparkles className="mx-auto text-terracotta" size={22} />
      <h2 className="mt-4 h-serif text-xl">Complete your profile</h2>
      <p className="mt-2 text-sm text-ink-muted">Tell us about your lifestyle to see compatible pets.</p>
      <Link to="/profile" className="btn-primary mt-6 inline-flex">Complete profile <ArrowRight size={15} /></Link>
    </div>
  )

  const [top, ...rest] = state.recs

  return (
    <div>
      <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Your adoption journey</p>
          <h1 className="mt-2 h-serif text-[38px] leading-none sm:text-[46px]">
            Hi {user.name?.split(' ')[0] || 'there'}<span className="text-terracotta">.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
            We found {state.recs.length} companion{state.recs.length === 1 ? '' : 's'} that could be a wonderful fit.
          </p>
        </div>
        <Link to="/profile" className="btn-primary w-fit"><SlidersHorizontal size={16} /> Update preferences</Link>
      </div>

      {state.recs.length === 0 ? (
        <div className="rounded-[20px] border border-line bg-white p-8 text-center shadow-soft">
          <p className="text-sm text-ink-muted">No available pets right now.</p>
          <Link to="/profile" className="mt-3 inline-block text-sm font-bold text-forest hover:text-forest-dark">Adjust your preferences</Link>
        </div>
      ) : (
        <>
          <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
            <div className="relative min-h-[285px] overflow-hidden rounded-[24px] bg-forest-glow p-7 sm:p-9">
              <div className="relative z-10 max-w-[320px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-forest">
                  <Sparkles size={12} /> Top match
                </span>
                <h2 className="mt-5 font-serif text-[30px] leading-[1.05] tracking-[-0.04em] text-forest-dark sm:text-[34px]">
                  Meet {top.pet.name}, your strongest match.
                </h2>
                <p className="mt-3 text-sm leading-5 text-ink-muted">
                  {top.pet.breed} · {top.pet.age} yr{top.pet.age === 1 ? '' : 's'} · {top.pet.size}
                </p>
                <Link to={`/pets/${top.pet.id}`} state={{ score: top.score, summary: top.summary }}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-forest hover:text-forest-dark">
                  View profile <ArrowRight size={15} />
                </Link>
              </div>
              {top.pet.photoUrl && (
                <img src={top.pet.photoUrl} alt={top.pet.name}
                  className="absolute bottom-0 right-[-40px] h-[92%] w-[57%] rounded-l-3xl object-cover object-left-top sm:right-[-15px] sm:w-[52%]" />
              )}
            </div>

            <div className="rounded-[24px] bg-terracotta-soft p-7 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-terracotta-dark">Your compatibility</p>
                  <p className="mt-4 font-serif text-5xl tracking-[-0.06em] text-terracotta-deep">
                    {Math.round(top.score * 100)}<span className="text-2xl">%</span>
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full border-[5px] border-terracotta/50 text-terracotta">
                  <Heart size={18} fill="currentColor" />
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-terracotta/25">
                <div className="h-full rounded-full bg-terracotta" style={{ width: `${Math.round(top.score * 100)}%` }} />
              </div>
              <p className="mt-4 text-sm leading-5 text-terracotta-deep/80">{top.summary}</p>
              <Link to={`/pets/${top.pet.id}`} state={{ score: top.score, summary: top.summary }}
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-terracotta-deep hover:underline">
                See the breakdown <ArrowRight size={13} />
              </Link>
            </div>
          </section>

          {rest.length > 0 && (
            <section className="mt-12">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="h-serif text-2xl">More recommendations</h2>
                  <p className="mt-1 text-xs text-ink-faint">Ranked by predicted compatibility</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {rest.map(r => <PetCard key={r.petId} pet={r.pet} score={r.score} summary={r.summary} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}