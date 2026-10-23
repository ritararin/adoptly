import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAdopterProfile, saveAdopterProfile } from '../lib/api'
import { HOUSING, HOUSEHOLD, ACTIVITY, CARE_HOURS, EXPERIENCE } from '../lib/options'
import Choice from '../components/Choice'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'

const EMPTY = {
  housingType: '',
  household: [],
  activityLevel: 'Moderate',
  careTime: '',
  experience: '',
  preferredSpecies: 'No preference',
}

// Maps for numeric encoding
const CARE_HOURS_MAP = { '<1hr': 1, '1-2hr': 2, '2-4hr': 3, '4+hr': 4 }
const HOUSING_MAP = { Studio: 1, Apartment: 2, House: 3, 'House (with Yard)': 4 }
const EXPERIENCE_MAP = { 'First time': 1, Some: 2, Experienced: 3 }
const ACTIVITY_MAP = { 'Very quiet': 1, Quiet: 2, Moderate: 3, Active: 4, 'Very active': 5 }

export default function Questionnaire() {
  const { user, loading: authLoading } = useAuth()
  const nav = useNavigate()
  const [p, setP] = useState(EMPTY)
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const set = k => v => setP(s => ({ ...s, [k]: v }))

  // Load existing profile
  useEffect(() => {
    if (!user?.uid) return
    getAdopterProfile(user.uid)
      .then(d => d && setP({ ...EMPTY, ...d }))
      .catch(e => console.error('Could not load profile:', e))
  }, [user?.uid])

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-ink-muted">Loading your profile…</p>
      </div>
    )
  }

  const valid = step === 1
    ? p.housingType && p.household.length
    : p.careTime && p.experience

  const save = async () => {
    setBusy(true)
    setErr('')
    try {
      // ✅ SANITIZED PAYLOAD: Ensures no 'undefined' values are sent to Firestore
      const payload = {
        // Display values
        housingType: p.housingType || 'Apartment',
        household: Array.isArray(p.household) ? p.household : [],
        activityLevel: p.activityLevel || 'Moderate',
        careTime: p.careTime || '2-4hr',
        experience: p.experience || 'First time',
        preferredSpecies: p.preferredSpecies || 'No preference',

        // Numeric encodings for ML model
        housingTypeEncoded: HOUSING_MAP[p.housingType] ?? 2,
        activityLevelNumeric: ACTIVITY_MAP[p.activityLevel] ?? 3,
        careHoursNumeric: CARE_HOURS_MAP[p.careTime] ?? 2,
        experienceLevel: EXPERIENCE_MAP[p.experience] ?? 1,
        hasChildrenUnder12: Array.isArray(p.household) && p.household.includes('Children'),
        hasOtherPets: Array.isArray(p.household) && p.household.includes('Other Pets'),
      }

      // Debug log to see exactly what is being sent
      console.log("Saving profile payload:", payload)

      await saveAdopterProfile(user.uid, payload)
      nav('/matches')
    } catch (x) {
      console.error('Save failed:', x.code, x.message)
      setErr(x.message || 'Could not save profile.')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="eyebrow">Adopter profile</p>
        <h1 className="mt-2 h-serif text-3xl">Tell us about your lifestyle</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Be honest — every pet has different needs.
        </p>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-deep">
          <div
            className="h-full rounded-full bg-forest transition-all"
            style={{ width: `${step * 50}%` }}
          />
        </div>
        <span className="text-[11px] font-bold text-ink-faint">Step {step} of 2</span>
      </div>

      <div className="rounded-[20px] border border-line bg-white p-7 shadow-soft sm:p-8">
        {step === 1 ? (
          <div className="space-y-7">
            <div>
              <h2 className="h-serif text-xl">Your home</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Understanding your living situation helps us match a pet that will thrive.
              </p>
            </div>
            <div>
              <label className="label">Housing type</label>
              <Choice options={HOUSING} value={p.housingType} onChange={set('housingType')} />
            </div>
            <div>
              <label className="label">Household (select all that apply)</label>
              <Choice multi options={HOUSEHOLD} value={p.household} onChange={set('household')} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="label mb-0">Household activity level</label>
                <span className="rounded-full bg-forest-tint px-2.5 py-0.5 text-[11px] font-bold text-forest">
                  {p.activityLevel}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                className="w-full accent-forest"
                value={ACTIVITY.indexOf(p.activityLevel)}
                onChange={e => set('activityLevel')(ACTIVITY[e.target.value])}
              />
              <div className="mt-1 flex justify-between text-[10px] text-ink-whisper">
                <span>Very quiet</span>
                <span>Very active</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-7">
            <div>
              <h2 className="h-serif text-xl">Your time &amp; experience</h2>
              <p className="mt-1 text-xs text-ink-muted">
                This helps us assess whether a pet's daily needs fit your routine.
              </p>
            </div>
            <div>
              <label className="label">Daily care time available</label>
              <Choice options={CARE_HOURS} value={p.careTime} onChange={set('careTime')} />
            </div>
            <div>
              <label className="label">Pet ownership experience</label>
              <Choice options={EXPERIENCE} value={p.experience} onChange={set('experience')} />
            </div>
            <div>
              <label className="label">Preferred species</label>
              <Choice
                options={['Dog', 'Cat', 'No preference']}
                value={p.preferredSpecies}
                onChange={set('preferredSpecies')}
              />
            </div>
          </div>
        )}

        {err && (
          <p className="mt-6 rounded-lg bg-terracotta/10 px-3 py-2 text-xs font-medium text-terracotta-deep">
            {err}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-line-soft pt-6">
          <button
            className="btn-outline"
            disabled={step === 1}
            onClick={() => setStep(1)}
          >
            <ArrowLeft size={15} /> Back
          </button>
          {step === 1 ? (
            <button
              className="btn-primary"
              disabled={!valid}
              onClick={() => setStep(2)}
            >
              Next step <ArrowRight size={15} />
            </button>
          ) : (
            <button
              className="btn-primary"
              disabled={!valid || busy}
              onClick={save}
            >
              {busy ? 'Saving…' : <><Save size={15} /> Save &amp; find matches</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}