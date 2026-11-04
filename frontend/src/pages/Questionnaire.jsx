import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAdopterProfile, saveAdopterProfile } from '../lib/api'
import {
  Building2,
  Home,
  Trees,
  User,
  Users,
  Baby,
  Heart,
  Dog,
  Cat,
  Sparkles,
  Award,
  Clock,
  Activity,
  Scissors,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Unified Home & Space options: Eliminates duplicate questions
const HOUSING_OPTIONS = [
  {
    type: 'Apartment',
    space: 1,
    title: 'Apartment or Studio',
    subtitle: 'Cozy indoor living space',
    detail: 'Best suited for companions with low-to-moderate indoor space needs.',
    icon: Building2,
  },
  {
    type: 'House (no yard)',
    space: 2,
    title: 'Condo or Townhouse',
    subtitle: 'Medium multi-room home',
    detail: 'Roomy interior with regular neighborhood walks and outdoor access.',
    icon: Home,
  },
  {
    type: 'House (with yard)',
    space: 3,
    title: 'House with Private Yard',
    subtitle: 'Spacious home with enclosed yard',
    detail: 'Ideal for energetic pets, fetch enthusiasts, and active roamers.',
    icon: Trees,
  },
]

const HOUSEHOLD_OPTIONS = [
  { id: 'Live alone', label: 'Live alone', desc: 'Sole caregiver', icon: User },
  { id: 'Partner', label: 'Partner / Family', desc: 'Shared household', icon: Users },
  { id: 'Children (<12)', label: 'Children under 12', desc: 'Active family setting', icon: Baby },
  { id: 'Elderly', label: 'Seniors / Elderly', desc: 'Gentle, peaceful home', icon: Heart },
  { id: 'Other pets', label: 'Other Pets at Home', desc: 'Multi-pet environment', icon: Dog },
]

const CARE_TIME_OPTIONS = [
  { id: '1-2 hours', hours: 2, label: '1–2 hours / day', desc: 'Gentle, low-maintenance daily care' },
  { id: '3-4 hours', hours: 4, label: '3–4 hours / day', desc: 'Balanced walks, play & feeding' },
  { id: '5-6 hours', hours: 6, label: '5–6 hours / day', desc: 'Extensive playtime, training & attention' },
  { id: '7-8 hours', hours: 8, label: '7+ hours / day', desc: 'Work from home or full-time availability' },
]

const EXPERIENCE_OPTIONS = [
  {
    id: 'First time',
    level: 1,
    label: 'First-Time Pet Parent',
    desc: 'Seeking an easygoing companion with predictable care needs.',
    icon: Sparkles,
  },
  {
    id: 'Some',
    level: 2,
    label: 'Some Experience',
    desc: 'Familiar with feeding, exercising, routines, and basic training.',
    icon: Heart,
  },
  {
    id: 'Experienced',
    level: 3,
    label: 'Experienced Handler',
    desc: 'Skilled with training, medical routines, or spirited breeds.',
    icon: Award,
  },
]

const SPECIES_OPTIONS = [
  { id: 'Dog', label: 'Dogs', icon: Dog, emoji: '🐶', desc: 'Loyal canine companion' },
  { id: 'Cat', label: 'Cats', icon: Cat, emoji: '🐱', desc: 'Affectionate feline friend' },
  { id: 'No preference', label: 'Open to Either', icon: Heart, emoji: '🐾', desc: 'Show me the best matches' },
]

const ACTIVITY_LEVELS = [
  { label: 'Very quiet', desc: 'Relaxed, serene, low-key indoor rhythm' },
  { label: 'Quiet', desc: 'Peaceful home with gentle daily strolls' },
  { label: 'Moderate', desc: 'Balanced mix of playtime and relaxation' },
  { label: 'Active', desc: 'Regular runs, outdoor exploration, and active play' },
  { label: 'Very active', desc: 'High-octane athletic routines & daily adventures' },
]

const GROOMING_LEVELS = [
  { label: 'Minimal (Level 1)', desc: 'Short coat, quick occasional brush' },
  { label: 'Low (Level 2)', desc: 'Low shedding, simple monthly upkeep' },
  { label: 'Moderate (Level 3)', desc: 'Regular weekly brushing and baths' },
  { label: 'High (Level 4)', desc: 'Frequent brushing and shedding management' },
  { label: 'Daily Care (Level 5)', desc: 'Daily brushing, professional grooming ok' },
]

const CARE_HOURS_MAP = {
  '<1hr': 1, '1-2hr': 2, '2-4hr': 4, '4+hr': 6,
  '1-2 hours': 2, '3-4 hours': 4, '5-6 hours': 6, '7-8 hours': 8,
}
const HOUSING_MAP = {
  Studio: 1,
  Apartment: 1,
  'House (no yard)': 2,
  'House (with yard)': 3,
  House: 3,
}
const EXPERIENCE_MAP = { 'First time': 1, Some: 2, Experienced: 3 }
const ACTIVITY_MAP = { 'Very quiet': 1, Quiet: 2, Moderate: 3, Active: 4, 'Very active': 5 }

const EMPTY = {
  housingType: 'Apartment',
  housingSpace: 1,
  household: ['Live alone'],
  activityLevel: 'Moderate',
  careTime: '3-4 hours',
  experience: 'Some',
  groomingTolerance: 3,
  preferredSpecies: 'No preference',
}

export default function Questionnaire() {
  const { user, loading: authLoading } = useAuth()
  const nav = useNavigate()
  const [p, setP] = useState(EMPTY)
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const set = k => v => setP(s => ({ ...s, [k]: v }))

  const toggleHousehold = id => {
    const list = p.household || []
    if (list.includes(id)) {
      setP(s => ({ ...s, household: list.filter(x => x !== id) }))
    } else {
      setP(s => ({ ...s, household: [...list, id] }))
    }
  }

  // Load existing profile if available
  useEffect(() => {
    if (!user?.uid) return
    getAdopterProfile(user.uid)
      .then(d => {
        if (!d) return
        const space = Number(d.housingSpace) || HOUSING_MAP[d.housingType] || 2
        setP({
          ...EMPTY,
          ...d,
          housingSpace: space,
          housingType: d.housingType || (space === 3 ? 'House (with yard)' : space === 2 ? 'House (no yard)' : 'Apartment'),
          household: Array.isArray(d.household) && d.household.length > 0 ? d.household : ['Live alone'],
          groomingTolerance: Number(d.groomingTolerance) || 3,
        })
      })
      .catch(e => console.error('Could not load profile:', e))
  }, [user?.uid])

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-2xl p-12 text-center text-ink-muted">
        <Sparkles className="mx-auto mb-2 text-forest animate-pulse" size={28} />
        <p className="text-xs font-semibold uppercase tracking-wider">Loading your adopter profile…</p>
      </div>
    )
  }

  const valid = step === 1
    ? Boolean(p.housingType && p.household?.length > 0)
    : Boolean(p.careTime && p.experience)

  const save = async () => {
    setBusy(true)
    setErr('')
    try {
      const hasChildren = Array.isArray(p.household) && (p.household.includes('Children') || p.household.includes('Children (<12)'))
      const hasPets = Array.isArray(p.household) && (p.household.includes('Other Pets') || p.household.includes('Other pets'))
      const housingSpaceVal = Number(p.housingSpace) || HOUSING_MAP[p.housingType] || 2
      const careHoursVal = CARE_HOURS_MAP[p.careTime] || 4
      const expVal = EXPERIENCE_MAP[p.experience] || 2
      const actVal = ACTIVITY_MAP[p.activityLevel] || 3
      const groomVal = Number(p.groomingTolerance) || 3

      const payload = {
        housingType: p.housingType || 'Apartment',
        household: Array.isArray(p.household) ? p.household : [],
        activityLevelText: typeof p.activityLevel === 'string' ? p.activityLevel : 'Moderate',
        careTime: p.careTime || '3-4 hours',
        experience: p.experience || 'Some',
        groomingTolerance: groomVal,
        preferredSpecies: p.preferredSpecies || 'No preference',

        // Numeric encodings for ML compatibility model
        housingSpace: housingSpaceVal,
        housingTypeEncoded: housingSpaceVal,
        activityLevel: actVal,
        activityLevelNumeric: actVal,
        careHoursNumeric: careHoursVal,
        experienceLevel: expVal,
        hasChildrenUnder12: hasChildren ? 1 : 0,
        hasOtherPets: hasPets ? 1 : 0,
      }

      await saveAdopterProfile(user.uid, payload)
      nav('/matches')
    } catch (x) {
      console.error('Save failed:', x)
      setErr(x.message || 'Could not save profile.')
      setBusy(false)
    }
  }

  const activityIdx = Math.max(0, ACTIVITY_LEVELS.findIndex(a => a.label === p.activityLevel))

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      {/* Header Banner */}
      <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest-wash px-3 py-1 text-xs font-bold text-forest shadow-2xs">
            <Sparkles size={12} className="text-forest animate-pulse" />
            <span>Lifestyle Compatibility Assessment</span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-head sm:text-4xl">
            Tell us about your lifestyle
          </h1>
          <p className="mt-2 text-sm text-ink-muted max-w-xl leading-relaxed">
            Every companion has distinct energy, space, and care requirements. Your answers power our ML matching rubric to connect you with pets you will truly thrive with.
          </p>
        </div>

        {/* Step Counter Pill */}
        <div className="self-center sm:self-auto flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2 shadow-2xs">
          <span className="flex size-6 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-white">
            {step}
          </span>
          <span className="text-xs font-semibold text-ink-muted">of 2 steps</span>
        </div>
      </div>

      {/* Modern Stepper Tabs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
            step === 1
              ? 'border-forest/40 bg-white shadow-soft ring-2 ring-forest/10'
              : 'border-line/70 bg-white/70 hover:bg-white'
          }`}
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
              step === 1 ? 'bg-forest text-gold shadow-sm' : 'bg-cream-dim text-ink-muted'
            }`}
          >
            <Home size={18} />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-whisper">
              Step 01
            </span>
            <p className="font-serif text-sm font-bold text-ink-head truncate">
              Home &amp; Environment
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (valid) setStep(2)
          }}
          disabled={!valid && step === 1}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
            step === 2
              ? 'border-forest/40 bg-white shadow-soft ring-2 ring-forest/10'
              : 'border-line/70 bg-white/70 hover:bg-white disabled:opacity-50 disabled:pointer-events-none'
          }`}
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
              step === 2 ? 'bg-forest text-gold shadow-sm' : 'bg-cream-dim text-ink-muted'
            }`}
          >
            <Activity size={18} />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-whisper">
              Step 02
            </span>
            <p className="font-serif text-sm font-bold text-ink-head truncate">
              Routine &amp; Experience
            </p>
          </div>
        </button>
      </div>

      {/* Main Interactive Form Card */}
      <div className="rounded-[28px] border border-line/90 bg-white p-6 sm:p-9 shadow-soft transition-all">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Question 1: Unified Home & Living Space (Replaces repetitive inputs) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-forest-wash text-forest">
                    <Home size={15} />
                  </span>
                  <div>
                    <h2 className="font-serif text-base font-bold text-ink-head">
                      Home &amp; Living Space
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Select the option that best describes your home size and outdoor access.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 pt-1">
                  {HOUSING_OPTIONS.map(opt => {
                    const isSelected = p.housingType === opt.type && Number(p.housingSpace) === opt.space
                    const Icon = opt.icon

                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          setP(s => ({
                            ...s,
                            housingType: opt.type,
                            housingSpace: opt.space,
                          }))
                        }}
                        className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'border-forest bg-forest-wash/80 shadow-md ring-2 ring-forest/15'
                            : 'border-line/80 bg-white hover:border-forest/40 hover:bg-cream-soft/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`flex size-10 items-center justify-center rounded-xl transition-colors ${
                              isSelected
                                ? 'bg-forest text-gold shadow-sm'
                                : 'bg-cream-dim text-ink-muted group-hover:bg-forest-wash group-hover:text-forest'
                            }`}
                          >
                            <Icon size={20} />
                          </div>
                          <div
                            className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-forest bg-forest text-white'
                                : 'border-line'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="font-serif text-sm font-bold text-ink-head">
                            {opt.title}
                          </p>
                          <p className="text-[11px] font-semibold text-forest mt-0.5">
                            {opt.subtitle}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                            {opt.detail}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question 2: Household Dynamic */}
              <div className="space-y-3 border-t border-line-soft pt-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-forest-wash text-forest">
                    <Users size={15} />
                  </span>
                  <div>
                    <h2 className="font-serif text-base font-bold text-ink-head">
                      Household Composition
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Select all that apply to help us assess safety around young kids or other pets.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                  {HOUSEHOLD_OPTIONS.map(item => {
                    const isSelected = p.household?.includes(item.id)
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleHousehold(item.id)}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'border-forest bg-forest-wash/80 shadow-2xs ring-2 ring-forest/10'
                            : 'border-line/80 bg-white hover:border-forest/30 hover:bg-cream-soft/60'
                        }`}
                      >
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            isSelected
                              ? 'bg-forest text-gold'
                              : 'bg-cream-dim text-ink-muted'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-ink-head">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {item.desc}
                          </p>
                        </div>
                        <div
                          className={`size-4 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-forest bg-forest text-white'
                              : 'border-line'
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question 3: Activity Level Slider */}
              <div className="space-y-3 border-t border-line-soft pt-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-forest-wash text-forest">
                      <Activity size={15} />
                    </span>
                    <div>
                      <h2 className="font-serif text-base font-bold text-ink-head">
                        Household Activity Level
                      </h2>
                      <p className="text-xs text-ink-muted">
                        How active or energetic is your regular household routine?
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-forest px-3 py-1 text-xs font-bold text-gold shadow-2xs">
                    {p.activityLevel}
                  </span>
                </div>

                <div className="rounded-2xl border border-line-soft bg-cream-soft/60 p-4 space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    className="w-full accent-forest h-2 cursor-pointer"
                    value={activityIdx}
                    onChange={e => set('activityLevel')(ACTIVITY_LEVELS[Number(e.target.value)].label)}
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-ink-muted">
                    <span>🛋️ Very quiet</span>
                    <span>🚶 Moderate</span>
                    <span>⚡ Very active</span>
                  </div>
                  <p className="text-xs text-forest font-medium text-center bg-white/80 py-1.5 px-3 rounded-xl border border-forest/10">
                    {ACTIVITY_LEVELS[activityIdx]?.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Question 4: Daily Care Time */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-forest-wash text-forest">
                    <Clock size={15} />
                  </span>
                  <div>
                    <h2 className="font-serif text-base font-bold text-ink-head">
                      Daily Care Availability
                    </h2>
                    <p className="text-xs text-ink-muted">
                      How many hours per day can you dedicate to walking, feeding, and direct interaction?
                    </p>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                  {CARE_TIME_OPTIONS.map(opt => {
                    const isSelected = p.careTime === opt.id

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => set('careTime')(opt.id)}
                        className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'border-forest bg-forest-wash/80 shadow-2xs ring-2 ring-forest/10'
                            : 'border-line/80 bg-white hover:border-forest/30 hover:bg-cream-soft/60'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-ink-head">
                            {opt.label}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            {opt.desc}
                          </p>
                        </div>
                        <div
                          className={`size-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-forest bg-forest text-white'
                              : 'border-line'
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question 5: Pet Experience Level */}
              <div className="space-y-3 border-t border-line-soft pt-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-forest-wash text-forest">
                    <Award size={15} />
                  </span>
                  <div>
                    <h2 className="font-serif text-base font-bold text-ink-head">
                      Pet Ownership Experience
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Helps us recommend companions whose training needs match your background.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 pt-1">
                  {EXPERIENCE_OPTIONS.map(exp => {
                    const isSelected = p.experience === exp.id
                    const Icon = exp.icon

                    return (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => set('experience')(exp.id)}
                        className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'border-forest bg-forest-wash/80 shadow-2xs ring-2 ring-forest/10'
                            : 'border-line/80 bg-white hover:border-forest/30 hover:bg-cream-soft/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`flex size-8 items-center justify-center rounded-lg ${
                              isSelected ? 'bg-forest text-gold' : 'bg-cream-dim text-ink-muted'
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div
                            className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? 'border-forest bg-forest text-white' : 'border-line'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-bold text-ink-head">
                            {exp.label}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                            {exp.desc}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question 6: Grooming & Shedding Tolerance Slider */}
              <div className="space-y-3 border-t border-line-soft pt-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-forest-wash text-forest">
                      <Scissors size={15} />
                    </span>
                    <div>
                      <h2 className="font-serif text-base font-bold text-ink-head">
                        Grooming &amp; Shedding Tolerance
                      </h2>
                      <p className="text-xs text-ink-muted">
                        How comfortable are you with coat brushing and regular grooming?
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-forest-tint px-3 py-1 text-xs font-bold text-forest">
                    Level {p.groomingTolerance || 3} of 5
                  </span>
                </div>

                <div className="rounded-2xl border border-line-soft bg-cream-soft/60 p-4 space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    className="w-full accent-forest h-2 cursor-pointer"
                    value={p.groomingTolerance || 3}
                    onChange={e => set('groomingTolerance')(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-ink-muted">
                    <span>1 - Minimal brushing</span>
                    <span>3 - Weekly brushing</span>
                    <span>5 - Daily coat care OK</span>
                  </div>
                  <p className="text-xs text-forest font-medium text-center bg-white/80 py-1.5 px-3 rounded-xl border border-forest/10">
                    {GROOMING_LEVELS[(p.groomingTolerance || 3) - 1]?.desc}
                  </p>
                </div>
              </div>

              {/* Question 7: Preferred Species Selection */}
              <div className="space-y-3 border-t border-line-soft pt-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-forest-wash text-forest">
                    <Heart size={15} />
                  </span>
                  <div>
                    <h2 className="font-serif text-base font-bold text-ink-head">
                      Preferred Companion Species
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Choose which animals you would like to explore.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 pt-1">
                  {SPECIES_OPTIONS.map(sp => {
                    const isSelected = p.preferredSpecies === sp.id

                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => set('preferredSpecies')(sp.id)}
                        className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'border-forest bg-forest-wash/80 shadow-2xs ring-2 ring-forest/10'
                            : 'border-line/80 bg-white hover:border-forest/30 hover:bg-cream-soft/60'
                        }`}
                      >
                        <span className="text-2xl select-none">{sp.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-ink-head">
                            {sp.label}
                          </p>
                          <p className="text-[11px] text-ink-muted truncate">
                            {sp.desc}
                          </p>
                        </div>
                        <div
                          className={`size-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? 'border-forest bg-forest text-white' : 'border-line'
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Notification */}
        {err && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
            {err}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-line-soft pt-6">
          <button
            type="button"
            className="btn-outline"
            disabled={step === 1}
            onClick={() => setStep(1)}
          >
            <ArrowLeft size={15} /> Back
          </button>

          {step === 1 ? (
            <button
              type="button"
              className="btn-primary"
              disabled={!valid}
              onClick={() => {
                if (valid) {
                  setStep(2)
                  window.scrollTo({ top: 100, behavior: 'smooth' })
                }
              }}
            >
              <span>Next: Routine &amp; Care</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={!valid || busy}
              onClick={save}
            >
              {busy ? (
                'Saving Profile…'
              ) : (
                <>
                  <Save size={15} />
                  <span>Save &amp; View Matching Pets</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
