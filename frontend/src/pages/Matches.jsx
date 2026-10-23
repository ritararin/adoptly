import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAdopterProfile, getRecommendations } from '../lib/api'
import PetCard from '../components/PetCard'
import { ArrowRight, Sparkles, SlidersHorizontal, Heart, Activity, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

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

  // --- SKELETON LOADER ---
  if (state.loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-20 w-1/2 rounded-2xl bg-cream-deep" />
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className="h-[285px] rounded-[24px] bg-cream-deep" />
        <div className="h-[285px] rounded-[24px] bg-cream-deep" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-[24px] bg-cream-deep" />)}
      </div>
    </div>
  )

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
          {/* --- TOP MATCH HERO SECTION --- */}
          <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
            
            {/* Hero Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="relative min-h-[320px] overflow-hidden rounded-[24px] bg-gradient-to-br from-forest to-forest-dark p-7 shadow-lift sm:p-9 text-cream"
            >
              <div className="relative z-10 max-w-[320px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cream backdrop-blur-md">
                  <Sparkles size={12} /> Top match
                </span>
                <h2 className="mt-5 font-serif text-[32px] leading-[1.05] tracking-[-0.04em] sm:text-[38px]">
                  Meet {top.pet.name}.
                </h2>
                <p className="mt-3 text-sm leading-5 text-cream/80">
                  {top.pet.breed} · {top.pet.age} yr{top.pet.age === 1 ? '' : 's'} · {top.pet.size}
                </p>
                <Link to={`/pets/${top.pet.id}`} state={{ score: top.score, summary: top.summary }}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cream px-5 py-2.5 text-sm font-bold text-forest transition hover:bg-white hover:scale-105">
                  View profile <ArrowRight size={15} />
                </Link>
              </div>
              {top.pet.photoUrl && (
                <img src={top.pet.photoUrl} alt={top.pet.name}
                  className="absolute bottom-0 right-[-40px] h-[95%] w-[55%] rounded-l-3xl object-cover object-left-top sm:right-[-15px] sm:w-[50%]" 
                />
              )}
              {/* Decorative gradient glow */}
              <div className="absolute -left-20 -top-20 size-64 rounded-full bg-terracotta/20 blur-3xl" />
            </motion.div>

            {/* Compatibility & SHAP Breakdown */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-[24px] border border-line bg-white p-7 shadow-soft sm:p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-terracotta-dark">Compatibility</p>
                    <p className="mt-2 font-serif text-5xl tracking-[-0.06em] text-terracotta-deep">
                      {Math.round(top.score * 100)}<span className="text-2xl">%</span>
                    </p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-full border-[5px] border-terracotta/20 text-terracotta">
                    <Heart size={18} fill="currentColor" />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-5 text-ink-muted">{top.summary}</p>
              </div>

              {/* Visual SHAP Bars */}
              {top.contributions && (
                <div className="mt-6 border-t border-line-soft pt-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">Why this match?</p>
                  {top.contributions.slice(0, 3).map((f, i) => {
                    const isPositive = f.impact >= 0;
                    return (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-24 truncate text-ink-muted capitalize">{f.feature}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-cream-deep overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isPositive ? 'bg-forest-mid' : 'bg-terracotta'}`} 
                            style={{ width: `${Math.min(Math.abs(f.impact) * 100 * 4, 100)}%` }} 
                          />
                        </div>
                        <span className={`w-10 text-right font-bold ${isPositive ? 'text-forest' : 'text-terracotta'}`}>
                          {isPositive ? '+' : ''}{Math.round(f.impact * 100)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </section>

          {/* --- REST OF THE MATCHES --- */}
          {rest.length > 0 && (
            <section className="mt-12">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="h-serif text-2xl">More recommendations</h2>
                  <p className="mt-1 text-xs text-ink-faint">Ranked by predicted compatibility</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {rest.map((r, index) => (
                  <motion.div
                    key={r.petId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + (index * 0.1) }}
                  >
                    <PetCard pet={r.pet} score={r.score} summary={r.summary} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}