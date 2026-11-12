import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getAdopterProfile,
  getRecommendations,
  listPets,
  getCachedRecommendations,
  clearRecommendationsCache,
} from '../lib/api'
import PetCard from '../components/PetCard'
import PetHoverPreview from '../components/PetHoverPreview'
import { generatePetSummary } from '../lib/petSummary'
import { getFactorSymbol, getFactorDescription } from '../lib/shapExplain'
import {
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Heart,
  AlertTriangle,
  Zap,
  Quote,
  HeartHandshake,
  TrendingUp,
  TrendingDown,
  Compass,
  RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function Matches() {
  const { user } = useAuth()

  // Instant cache hydration: if matches were already fetched/cached in memory, render immediately with zero loading flash
  const [state, setState] = useState(() => {
    const cached = user?.uid ? getCachedRecommendations(user.uid) : null
    if (cached?.recs?.length > 0) {
      return {
        loading: false,
        profile: cached.profile,
        recs: cached.recs,
        error: '',
      }
    }
    return {
      loading: true,
      profile: null,
      recs: [],
      error: '',
    }
  })

  const [refreshing, setRefreshing] = useState(false)

  // 'preferred' = filter for preferredSpecies first; 'all' = raw score order across all species
  const [filterMode, setFilterMode] = useState(() => {
    try {
      return sessionStorage.getItem('adoptly_matches_filter_mode') || 'preferred'
    } catch {
      return 'preferred'
    }
  })

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode)
    try {
      sessionStorage.setItem('adoptly_matches_filter_mode', mode)
    } catch {}
  }

  const handleManualRefresh = async () => {
    if (!user?.uid || refreshing) return
    setRefreshing(true)
    try {
      clearRecommendationsCache()
      const [profile, pets] = await Promise.all([
        getAdopterProfile(user.uid, { forceRefresh: true }),
        listPets({ onlyAvailable: true }, { forceRefresh: true }),
      ])
      if (profile) {
        const recommendations = await getRecommendations(user.uid, profile, { pets, forceRefresh: true })
        setState({
          loading: false,
          profile,
          recs: Array.isArray(recommendations) ? recommendations : [],
          error: '',
        })
      }
    } catch (err) {
      console.error('Failed to refresh matches:', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadMatches() {
      if (!user?.uid) {
        setState({
          loading: false,
          profile: null,
          recs: [],
          error: 'Please sign in to view your recommendations.',
        })
        return
      }

      // Check if we already have valid recommendations cached in memory
      const cached = getCachedRecommendations(user.uid)
      if (cached?.recs?.length > 0) {
        // Data is already loaded and presented immediately without any loading skeleton
        setState((prev) => {
          if (prev.recs?.length > 0 && !prev.loading) return prev
          return {
            loading: false,
            profile: cached.profile,
            recs: cached.recs,
            error: '',
          }
        })
        return
      }

      // Only display the loading skeleton if no recommendations are already available in view
      setState((prev) => ({
        ...prev,
        loading: prev.recs.length === 0,
        error: '',
      }))

      try {
        // Fetch adopter profile and available pets in parallel to save ~300ms network roundtrip
        const [profile, pets] = await Promise.all([
          getAdopterProfile(user.uid),
          listPets({ onlyAvailable: true }),
        ])

        if (cancelled) return

        if (!profile) {
          setState({
            loading: false,
            profile: null,
            recs: [],
            error: '',
          })
          return
        }

        const recommendations = await getRecommendations(user.uid, profile, { pets })

        if (cancelled) return

        setState({
          loading: false,
          profile,
          recs: Array.isArray(recommendations) ? recommendations : [],
          error: '',
        })
      } catch (error) {
        if (cancelled) return

        console.error('Unable to load matches:', error)

        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            prev.recs.length > 0
              ? ''
              : (error?.message || 'We could not load your recommendations. Please try again.'),
        }))
      }
    }

    loadMatches()

    return () => {
      cancelled = true
    }
  }, [user?.uid])

  // ---------- SKELETON LOADER ----------
  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft flex items-center gap-4">
          <Sparkles className="animate-pulse text-forest size-6 shrink-0" />
          <div>
            <p className="text-sm font-bold text-ink-head">Matching you with companions…</p>
            <p className="text-xs text-ink-muted">Evaluating compatibility based on your lifestyle profile and pet traits.</p>
          </div>
        </div>

        <div className="animate-pulse space-y-8">
          <div className="h-20 w-1/2 rounded-2xl bg-cream-deep" />

          <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
            <div className="h-[285px] rounded-[24px] bg-cream-deep" />
            <div className="h-[285px] rounded-[24px] bg-cream-deep" />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 rounded-[24px] bg-cream-deep"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ---------- ERROR ----------
  if (state.error) {
    return (
      <div
        role="alert"
        className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta-deep"
      >
        <p>{state.error}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    )
  }

  // ---------- PROFILE NOT COMPLETED ----------
  if (!state.profile) {
    return (
      <div className="mx-auto max-w-md rounded-[24px] border border-line bg-white p-8 text-center shadow-soft">
        <Sparkles className="mx-auto text-terracotta" size={22} />

        <h2 className="mt-4 h-serif text-xl">
          Complete your profile
        </h2>

        <p className="mt-2 text-sm text-ink-muted">
          Tell us about your lifestyle to see compatible pets.
        </p>

        <Link
          to="/profile"
          className="btn-primary mt-6 inline-flex items-center gap-2"
        >
          Complete profile <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  // ---------- PARTITION MATCHES BY USER SPECIES PREFERENCE ----------
  const hasPreference = Boolean(
    state.profile?.preferredSpecies &&
    state.profile.preferredSpecies.toLowerCase() !== 'no preference'
  )
  const preferredSpecies = hasPreference ? state.profile.preferredSpecies : null

  const preferredRecs = state.recs.filter(r => {
    if (!hasPreference) return true
    const sp = (r.pet?.species || '').toLowerCase()
    return sp === preferredSpecies.toLowerCase()
  })

  const nonPreferredRecs = state.recs.filter(r => {
    if (!hasPreference) return false
    const sp = (r.pet?.species || '').toLowerCase()
    return sp !== preferredSpecies.toLowerCase()
  })

  const topPreferred = preferredRecs[0]
  const topAlternative = nonPreferredRecs[0]
  const alternativeHasHigherScore = Boolean(
    topPreferred &&
    topAlternative &&
    Number(topAlternative.score ?? 0) > Number(topPreferred.score ?? 0)
  )

  const activeRecs = (filterMode === 'preferred' && preferredRecs.length > 0)
    ? preferredRecs
    : state.recs

  const [topMatch, ...otherMatches] = activeRecs

  // ---------- NO MATCHES ----------
  if (!topMatch?.pet) {
    return (
      <div>
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Your adoption journey</p>

            <h1 className="mt-2 h-serif text-[38px] leading-none sm:text-[46px]">
              Hi {user?.displayName?.split(' ')[0] || 'there'}
              <span className="text-terracotta">.</span>
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
              We could not find any available pets to recommend right now.
            </p>
          </div>

          <Link
            to="/profile"
            className="btn-primary flex w-fit items-center gap-2"
          >
            <SlidersHorizontal size={16} />
            Update preferences
          </Link>
        </div>

        <div className="rounded-[20px] border border-line bg-white p-8 text-center shadow-soft">
          <p className="text-sm text-ink-muted">
            There are no available pets to recommend right now. Please check
            again when shelters add pets.
          </p>

          <Link
            to="/pets"
            className="mt-4 inline-block text-sm font-bold text-forest hover:text-forest-dark"
          >
            Browse available pets
          </Link>
        </div>
      </div>
    )
  }

  const pet = topMatch.pet
  const score = Number(topMatch.score ?? 0)

  // Accept explanation data from either API field.
  const contributions =
    topMatch.contributions ?? topMatch.topFactors ?? []

  const heroSummary = (!topMatch.summary || topMatch.summary.includes('Based on your lifestyle profile'))
    ? generatePetSummary(pet, score, contributions, topMatch.flags)
    : topMatch.summary

  return (
    <div>
      {/* ---------- PAGE HEADER ---------- */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest-wash px-3 py-1 text-xs font-bold text-forest shadow-2xs">
            <Sparkles size={12} className="text-forest animate-pulse" />
            <span>AI-Assisted Pairings</span>
          </div>

          <h1 className="mt-3 h-serif text-[38px] leading-none sm:text-[46px]">
            Hi {user?.displayName?.split(' ')[0] || 'there'}
            <span className="text-forest">.</span>
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-6 text-ink-muted">
            {hasPreference && filterMode === 'preferred'
              ? `Showing your top ${preferredSpecies.toLowerCase()}${preferredRecs.length === 1 ? '' : 's'}${nonPreferredRecs.length > 0 ? ` (with ${nonPreferredRecs.length} other companion${nonPreferredRecs.length === 1 ? '' : 's'} available outside this filter)` : ''}.`
              : `We discovered ${state.recs.length} companion${state.recs.length === 1 ? '' : 's'} tailored to your home and daily rhythm.`
            }
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh recommendations"
            className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs font-bold text-ink-muted hover:text-forest hover:bg-forest-wash transition-colors shadow-2xs disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-forest' : ''} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>

          <Link
            to="/profile"
            className="btn-primary flex w-fit items-center gap-2 shadow-lift hover:-translate-y-0.5 transition-all shrink-0"
          >
            <SlidersHorizontal size={16} />
            Update preferences
          </Link>
        </div>
      </div>

      {/* ---------- SPECIES PREFERENCE EXPLANATION & FILTER BAR ---------- */}
      {hasPreference && state.recs.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-[24px] border border-line/90 bg-white p-5 shadow-soft transition-all">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-2xs ${
                  alternativeHasHigherScore
                    ? 'bg-amber-100/90 text-amber-800 border border-amber-200'
                    : 'bg-forest-wash text-forest border border-forest/15'
                }`}
              >
                {preferredSpecies.toLowerCase() === 'dog' ? '🐶' : preferredSpecies.toLowerCase() === 'cat' ? '🐱' : '🐾'}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-head">
                    {filterMode === 'preferred'
                      ? `Filtered by your preference: ${preferredSpecies}s`
                      : 'Exploring all companion species'}
                  </span>

                  {alternativeHasHigherScore && filterMode === 'preferred' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 animate-pulse">
                      <Sparkles size={11} className="text-amber-600" />
                      Higher Match in {topAlternative.pet?.species}s ({Math.round((topAlternative.score ?? 0) * 100)}%)
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-xs text-ink-muted leading-relaxed max-w-2xl">
                  {filterMode === 'preferred' ? (
                    alternativeHasHigherScore ? (
                      <>
                        Showing your top {preferredSpecies.toLowerCase()}s, led by <strong>{topPreferred?.pet?.name}</strong> ({Math.round((topPreferred?.score ?? 0) * 100)}%).{' '}
                        <span className="text-amber-950 font-medium">
                          Note: Our AI model identified that <strong>{topAlternative?.pet?.name}</strong> (a {topAlternative?.pet?.species?.toLowerCase()}) scored <strong>{Math.round((topAlternative?.score ?? 0) * 100)}% compatibility</strong>—higher than your top {preferredSpecies.toLowerCase()}.
                        </span>{' '}
                        This occurs because their daily care needs and temperament align exceptionally well with your living space ({state.profile.housingType || 'home'}) and routine.
                      </>
                    ) : (
                      <>
                        Showing {preferredSpecies.toLowerCase()}s according to your profile preference.
                        {nonPreferredRecs.length > 0 &&
                          ` There ${nonPreferredRecs.length === 1 ? 'is' : 'are'} also ${nonPreferredRecs.length} other companion${nonPreferredRecs.length === 1 ? '' : 's'} (${nonPreferredRecs.map(r => r.pet?.species).filter((v, i, a) => a.indexOf(v) === i).join(', ')}) with strong compatibility scores outside this filter.`}
                      </>
                    )
                  ) : (
                    <>
                      Currently displaying <strong>all companions</strong> ranked strictly by highest overall compatibility score regardless of species.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Filter Mode Toggle Buttons */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-cream-soft p-1 self-start lg:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleFilterModeChange('preferred')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  filterMode === 'preferred'
                    ? 'bg-white text-forest shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>{preferredSpecies.toLowerCase() === 'dog' ? '🐕' : '🐈'} {preferredSpecies}s Only</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    filterMode === 'preferred' ? 'bg-forest-wash text-forest' : 'bg-cream-deep text-ink-muted'
                  }`}
                >
                  {preferredRecs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterModeChange('all')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-forest shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Compass size={13} />
                <span>Explore All</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    filterMode === 'all' ? 'bg-forest-wash text-forest' : 'bg-cream-deep text-ink-muted'
                  }`}
                >
                  {state.recs.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MATCH RESULTS ---------- */}
      {state.recs.length === 0 ? (
        <div className="rounded-[24px] border border-line bg-white p-12 text-center shadow-soft">
          <p className="text-sm text-ink-muted">
            No recommendations are available yet. Check that pets have been
            added and marked as available.
          </p>

          <Link
            to="/pets"
            className="mt-4 inline-block btn-primary text-xs"
          >
            Browse pets
          </Link>
        </div>
      ) : (
        <>
          {/* ---------- TOP MATCH HERO ---------- */}
          <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            {/* Hero card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1b503f] via-[#164334] to-[#0f2e24] p-6 sm:p-8 text-cream shadow-lift border border-forest/20 flex flex-col justify-between"
            >
              {/* Decorative ambient glowing orbs */}
              <div className="absolute -left-16 -top-16 size-72 rounded-full bg-forest-glow/15 blur-3xl pointer-events-none" />
              <div className="absolute right-12 top-10 size-48 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 grid gap-6 sm:grid-cols-12 sm:items-center h-full">
                {/* Left Text Column: Padded, nicely aligned, flexible width */}
                <div className="flex flex-col justify-between h-full sm:col-span-7 space-y-4">
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold shadow-sm backdrop-blur-md">
                        <Sparkles size={11} className="text-gold animate-pulse" />
                        <span>
                          {hasPreference && filterMode === 'preferred'
                            ? `Top ${preferredSpecies} Match`
                            : 'Top Compatibility Match'}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200 backdrop-blur-md">
                        {Math.round(score * 100)}% Match
                      </span>
                    </div>

                    {/* Pet Name with Hover Preview & Click-to-View Profile Link */}
                    <PetHoverPreview pet={pet}>
                      <Link
                        to={`/pets/${pet.id || topMatch.petId}`}
                        state={{
                          score,
                          summary: heroSummary,
                        }}
                        className="group/herotitle block"
                      >
                        <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white cursor-pointer group-hover/herotitle:text-gold transition-colors">
                          Meet {pet.name || 'your potential companion'}.
                        </h2>
                      </Link>
                    </PetHoverPreview>

                    {/* Pet Subtitle (Breed · Age · Size) */}
                    <p className="mt-1 text-sm font-medium text-cream/85">
                      {[
                        pet.breed || pet.species,
                        pet.age != null ? `${pet.age} yr${Number(pet.age) === 1 ? '' : 's'}` : null,
                        pet.size,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>

                    {/* Trait pills */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {pet.temperament && (
                        <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                          {pet.temperament}
                        </span>
                      )}
                      <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs flex items-center gap-1">
                        <Zap size={11} className="text-gold" />
                        <span>Energy {pet.energyLevel || 3}/5</span>
                      </span>
                      {Number(pet.childFriendly) >= 4 && (
                        <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-xs flex items-center gap-1">
                          <HeartHandshake size={11} />
                          <span>Gentle with Kids</span>
                        </span>
                      )}
                    </div>

                    {/* Brief personality highlight quote */}
                    {heroSummary && (
                      <p className="mt-3.5 text-xs italic text-emerald-100/80 leading-relaxed line-clamp-2">
                        "{heroSummary}"
                      </p>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="pt-2">
                    <Link
                      to={`/pets/${pet.id || topMatch.petId}`}
                      state={{
                        score,
                        summary: heroSummary,
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-ink-head transition-all hover:scale-105 hover:bg-gold-soft shadow-md active:scale-95"
                    >
                      <span>View profile</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                {/* Right Image Column: Framed, Proportional Pet Photo with Click-to-View Profile Link */}
                <Link
                  to={`/pets/${pet.id || topMatch.petId}`}
                  state={{
                    score,
                    summary: heroSummary,
                  }}
                  title={`View ${pet.name || 'companion'}'s profile`}
                  className="sm:col-span-5 h-full min-h-[220px] sm:min-h-[280px] block cursor-pointer group/heroimg"
                >
                  {pet.photoUrl ? (
                    <div className="relative h-full min-h-[220px] sm:min-h-[280px] w-full overflow-hidden rounded-2xl border-2 border-white/20 bg-forest-dark shadow-xl transition-all duration-300 group-hover/heroimg:scale-[1.02] group-hover/heroimg:border-gold/50">
                      {/* Ambient blur backdrop */}
                      <img
                        src={pet.photoUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-40 pointer-events-none"
                      />
                      {/* Main sharp image with face-biased positioning and smooth hover zoom */}
                      <img
                        src={pet.photoUrl}
                        alt={pet.name || 'Recommended pet'}
                        className="relative h-full w-full object-cover object-[center_20%] transition-transform duration-700 group-hover/heroimg:scale-105"
                      />
                      {/* Subtle bottom vignette gradient for depth */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* Floating tag on photo */}
                      <div className="absolute bottom-2.5 left-2.5 z-10">
                        <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md border border-white/20">
                          {pet.breed || pet.species}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[220px] sm:min-h-[280px] w-full items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 text-6xl shadow-xl select-none transition-all duration-300 group-hover/heroimg:scale-[1.02]">
                      {pet.species === 'Cat' ? '🐱' : '🐶'}
                    </div>
                  )}
                </Link>
              </div>
            </motion.div>

            {/* Compatibility and explanation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col justify-between rounded-[28px] border border-line/90 bg-white p-7 shadow-soft sm:p-8"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-forest">
                      Compatibility Score
                    </p>

                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="font-serif text-5xl font-bold tracking-tight text-forest">
                        {Math.round(score * 100)}
                      </span>
                      <span className="text-2xl font-bold text-forest/70">%</span>
                    </div>
                  </div>

                  <div className="flex size-14 items-center justify-center rounded-2xl bg-forest-wash text-forest shadow-2xs">
                    <Heart size={22} fill="currentColor" className="text-forest animate-pulse" />
                  </div>
                </div>

                {/* Specific pet quote block */}
                <div className="mt-4 rounded-2xl border border-line-soft bg-cream-soft/85 p-3.5">
                  <div className="flex items-start gap-2">
                    <Quote size={13} className="text-forest/70 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed text-ink-muted italic font-medium">
                      {heroSummary}
                    </p>
                  </div>
                </div>

                {topMatch.flags && topMatch.flags.includes('child_friendliness_not_assessed') && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                    <span><strong>Notice:</strong> Child-friendliness not assessed by shelter. Default species estimate applied.</span>
                  </div>
                )}
              </div>

              {/* Key Compatibility Drivers (SHAP explainability without raw numbers) */}
              {Array.isArray(contributions) && contributions.length > 0 && (
                <div className="mt-6 space-y-3.5 border-t border-line-soft pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-forest">
                      Why This Match Works
                    </p>
                    <span className="text-[10px] font-semibold text-ink-whisper">Factor Alignment</span>
                  </div>

                  {contributions.slice(0, 3).map((factor, index) => {
                    const impact = Number(factor.impact ?? factor.contribution ?? factor.value ?? 0)
                    const isPositive = factor.effect === 'raises' || impact >= 0
                    const width = Math.min(Math.abs(impact) * 100 * 4, 100)
                    const displayName = factor.label || String(factor.feature || factor.name || 'Factor')
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/[_-]/g, ' ')
                    const { symbol, badgeText } = getFactorSymbol(impact, factor.effect)
                    const description = getFactorDescription(factor)

                    return (
                      <div
                        key={`${factor.feature || factor.name || 'factor'}-${index}`}
                        className="rounded-xl border border-line-soft bg-cream-soft/50 p-2.5 transition-colors hover:bg-cream-soft"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate capitalize text-ink-head font-bold text-xs">
                            {displayName}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                              isPositive
                                ? 'bg-emerald-100/80 text-emerald-800'
                                : 'bg-rose-100/80 text-rose-800'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp size={11} className="text-emerald-700" />
                            ) : (
                              <TrendingDown size={11} className="text-rose-600" />
                            )}
                            <span className="font-mono text-xs font-bold">{symbol}</span>
                            <span className="text-[10px] font-semibold hidden sm:inline">({badgeText})</span>
                          </span>
                        </div>

                        {/* Narrative explanation */}
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                          {description}
                        </p>

                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-cream-deep">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPositive ? 'bg-emerald-600' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(12, width)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex items-center justify-between text-[10px] text-ink-whisper pt-1">
                    <span><strong>+ / ++</strong> Factor boosts compatibility</span>
                    <span><strong>- / --</strong> Lifestyle consideration</span>
                  </div>
                </div>
              )}
            </motion.div>
          </section>

          {/* ---------- OTHER PRIMARY RECOMMENDATIONS ---------- */}
          {otherMatches.length > 0 && (
            <section className="mt-12">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="h-serif text-2xl">
                    {hasPreference && filterMode === 'preferred'
                      ? `More ${preferredSpecies} Recommendations`
                      : 'More Recommendations'}
                  </h2>

                  <p className="mt-1 text-xs text-ink-faint">
                    Ranked by predicted compatibility
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {otherMatches.map((recommendation, index) => (
                  <motion.div
                    key={recommendation.petId || recommendation.pet?.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.2 + index * 0.1,
                    }}
                  >
                    {recommendation.pet && (
                      <PetCard
                        pet={recommendation.pet}
                        score={recommendation.score}
                        summary={recommendation.summary}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ---------- HIGH-COMPATIBILITY PETS OUTSIDE PREFERENCE ---------- */}
          {filterMode === 'preferred' && nonPreferredRecs.length > 0 && (
            <section className="mt-14 border-t border-line-soft pt-10">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 mb-2">
                    <Sparkles size={12} className="text-amber-600" />
                    <span>Outside Your {preferredSpecies} Preference</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-ink-head">
                    Other High-Compatibility Companions
                  </h2>
                  <p className="mt-1 text-xs text-ink-muted max-w-xl">
                    Even though your profile preference is set to {preferredSpecies.toLowerCase()}s, these {nonPreferredRecs.map(r => r.pet?.species).filter((v, i, a) => a.indexOf(v) === i).join(' and ')}s scored high compatibility ({Math.round((nonPreferredRecs[0]?.score ?? 0) * 100)}%) based on your lifestyle traits and living environment.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="btn-outline text-xs px-4 py-2 shrink-0 self-start sm:self-auto"
                >
                  Explore All in Unified List
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {nonPreferredRecs.map((recommendation, index) => (
                  <motion.div
                    key={recommendation.petId || recommendation.pet?.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                    }}
                  >
                    {recommendation.pet && (
                      <PetCard
                        pet={recommendation.pet}
                        score={recommendation.score}
                        summary={recommendation.summary}
                      />
                    )}
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
