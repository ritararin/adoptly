// Browser-side rubric scorer. Mirrors the rubric used to LABEL training data (Section 3.2.1),
// so the UI works end-to-end before the Python ML service is deployed.
// Returns the same payload shape the real service should return:
// { score: 0-1, contributions: [{ feature, label, impact, detail }], summary }
import { ACTIVITY, CARE_HOURS, ENERGY, HOUSING, EXPERIENCE } from './options'
import { generatePetSummary } from './petSummary'

const idx = (list, v) => Math.max(0, list.indexOf(v))

const ENERGY_NUM_MAP = {
  1: 'Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'High',
}

export function scorePair(a = {}, p = {}) {
  const adopter = a || {}
  const pet = p || {}
  const c = []
  const add = (feature, label, impact, detail) => c.push({ feature, label, impact: +impact.toFixed(3), detail })

  // Normalize pet energy level (whether stored as 1-5 number or string 'Low'/'Moderate'/'High')
  const energyLabel = typeof pet.energyLevel === 'number'
    ? (ENERGY_NUM_MAP[pet.energyLevel] || 'Moderate')
    : (typeof pet.energyLevel === 'string' && pet.energyLevel ? pet.energyLevel : 'Moderate')

  // Activity vs pet energy (0..4 -> 0..2)
  const actLevel = adopter.activityLevel || 'Moderate'
  const act = idx(ACTIVITY, actLevel) / 2
  const en = idx(ENERGY, energyLabel)
  add('activity', 'Activity level', 0.3 * (1 - Math.abs(act - en) / 2) - 0.15,
    `Your activity (${actLevel}) vs ${energyLabel.toLowerCase()} energy`)

  // Home size
  const housingType = adopter.housingType || 'Apartment'
  const small = ['Studio', 'Apartment'].includes(housingType)
  const sizeStr = typeof pet.size === 'string' && pet.size ? pet.size : 'Medium'
  const speciesStr = typeof pet.species === 'string' && pet.species ? pet.species : 'pet'
  const need = sizeStr === 'Large' ? 2 : sizeStr === 'Medium' ? 1 : 0
  const homeFit = small ? (need === 2 ? -0.2 : need === 1 ? 0 : 0.12) : (need === 2 && !housingType.includes('yard') ? 0 : 0.14)
  add('housing', 'Home environment', homeFit, `${housingType} for a ${sizeStr.toLowerCase()} ${speciesStr.toLowerCase()}`)

  // Care time
  const careTime = adopter.careTime || '3-4 hours'
  const hrs = idx(CARE_HOURS, careTime)
  const needHrs = energyLabel === 'High' ? 3 : energyLabel === 'Moderate' ? 2 : 1
  add('careTime', 'Daily care time', hrs >= needHrs ? 0.14 : -0.06 * (needHrs - hrs), `${careTime} available per day`)

  // Experience vs special needs
  const expStr = adopter.experience || 'Some'
  const exp = idx(EXPERIENCE, expStr)
  const hard = pet.temperament === 'Shy' || (pet.healthStatus && pet.healthStatus !== 'Healthy')
  add('experience', 'Ownership experience', hard ? (exp === 0 ? -0.12 : 0.08) : 0.05, `${expStr} owner`)

  // Other pets / children
  const household = Array.isArray(adopter.household) ? adopter.household : []
  const kids = household.includes('Children (<12)')
  add('household', 'Household', kids && ['Shy', 'Independent'].includes(pet.temperament) ? -0.1 : 0.04,
    kids ? 'Young children at home' : 'Household composition')

  // Preference
  const pref = !adopter.preferredSpecies || adopter.preferredSpecies === 'No preference' || adopter.preferredSpecies === pet.species
  add('preference', 'Species preference', pref ? 0.08 : -0.2, pref ? 'Matches your preference' : 'Not your preferred species')

  const score = Math.min(0.99, Math.max(0.05, 0.5 + c.reduce((s, x) => s + x.impact, 0)))
  const top = [...c].sort((x, y) => Math.abs(y.impact) - Math.abs(x.impact))
  const summary = generatePetSummary(pet, score, top, [])
  return { score: +score.toFixed(3), contributions: top, summary }
}
