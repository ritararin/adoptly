// Browser-side rubric scorer. Mirrors the rubric used to LABEL training data (Section 3.2.1),
// so the UI works end-to-end before the Python ML service is deployed.
// Returns the same payload shape the real service should return:
// { score: 0-1, contributions: [{ feature, label, impact, detail }], summary }
import { ACTIVITY, CARE_HOURS, ENERGY, HOUSING, EXPERIENCE } from './options'

const idx = (list, v) => Math.max(0, list.indexOf(v))

export function scorePair(a, p) {
  const c = []
  const add = (feature, label, impact, detail) => c.push({ feature, label, impact: +impact.toFixed(3), detail })

  // Activity vs pet energy (0..4 -> 0..2)
  const act = idx(ACTIVITY, a.activityLevel) / 2
  const en = idx(ENERGY, p.energyLevel)
  add('activity', 'Activity level', 0.3 * (1 - Math.abs(act - en) / 2) - 0.15,
    `Your activity (${a.activityLevel}) vs ${p.energyLevel.toLowerCase()} energy`)

  // Home size
  const small = ['Studio', 'Apartment'].includes(a.housingType)
  const need = p.size === 'Large' ? 2 : p.size === 'Medium' ? 1 : 0
  const homeFit = small ? (need === 2 ? -0.2 : need === 1 ? 0 : 0.12) : (need === 2 && !a.housingType.includes('yard') ? 0 : 0.14)
  add('housing', 'Home environment', homeFit, `${a.housingType} for a ${p.size.toLowerCase()} ${p.species.toLowerCase()}`)

  // Care time
  const hrs = idx(CARE_HOURS, a.careTime)
  const needHrs = p.energyLevel === 'High' ? 3 : p.energyLevel === 'Moderate' ? 2 : 1
  add('careTime', 'Daily care time', hrs >= needHrs ? 0.14 : -0.06 * (needHrs - hrs), `${a.careTime} available per day`)

  // Experience vs special needs
  const exp = idx(EXPERIENCE, a.experience)
  const hard = p.temperament === 'Shy' || (p.healthStatus && p.healthStatus !== 'Healthy')
  add('experience', 'Ownership experience', hard ? (exp === 0 ? -0.12 : 0.08) : 0.05, `${a.experience} owner`)

  // Other pets / children
  const kids = a.household?.includes('Children (<12)')
  add('household', 'Household', kids && ['Shy', 'Independent'].includes(p.temperament) ? -0.1 : 0.04,
    kids ? 'Young children at home' : 'Household composition')

  // Preference
  const pref = !a.preferredSpecies || a.preferredSpecies === 'No preference' || a.preferredSpecies === p.species
  add('preference', 'Species preference', pref ? 0.08 : -0.2, pref ? 'Matches your preference' : 'Not your preferred species')

  const score = Math.min(0.99, Math.max(0.05, 0.5 + c.reduce((s, x) => s + x.impact, 0)))
  const top = [...c].sort((x, y) => Math.abs(y.impact) - Math.abs(x.impact))
  const pos = top.filter(x => x.impact > 0).slice(0, 2).map(x => x.label.toLowerCase())
  const neg = top.filter(x => x.impact < 0)[0]
  const summary = `${p.name} is a ${Math.round(score * 100)}% match.` +
    (pos.length ? ` Strongest factors: ${pos.join(' and ')}.` : '') +
    (neg ? ` Watch out for: ${neg.label.toLowerCase()}.` : '')
  return { score: +score.toFixed(3), contributions: top, summary }
}
