// Shared option lists used by the questionnaire and pet form (categorical selectors, per NFR Usability).
export const HOUSING = ['Studio', 'Apartment', 'House (no yard)', 'House (with yard)']
export const HOUSING_SPACES = ['1 (Small: Studio/Apt)', '2 (Medium: Townhouse/Condo)', '3 (Large: House with Yard)']
export const HOUSEHOLD = ['Live alone', 'Partner', 'Children (<12)', 'Elderly', 'Other pets']
export const ACTIVITY = ['Very quiet', 'Quiet', 'Moderate', 'Active', 'Very active']
export const CARE_HOURS = ['1-2 hours', '3-4 hours', '5-6 hours', '7-8 hours']
export const EXPERIENCE = ['First time', 'Some', 'Experienced']
export const GROOMING_TOLERANCE = ['1 (Minimal)', '2 (Low)', '3 (Moderate)', '4 (High)', '5 (Daily brush ok)']
export const SPECIES = ['Dog', 'Cat']
export const SIZES = ['Small', 'Medium', 'Large']
export const TEMPERAMENTS = ['Calm', 'Friendly', 'Playful', 'Independent', 'Shy']
export const ENERGY = ['Low', 'Moderate', 'High']
export const APP_STATUS = ['Pending Review', 'Interview Scheduled', 'Rejected', 'Adoption Completed', 'Failed Adoption', 'Cancelled']

export function deriveSizeFromWeight(weightKg) {
  const w = Number(weightKg)
  if (isNaN(w) || w <= 0) return 'Medium'
  if (w < 10) return 'Small'
  if (w <= 25) return 'Medium'
  return 'Large'
}

export function formatAgeMonthsHelper(months) {
  const m = Number(months)
  if (isNaN(m) || m <= 0) return ''
  if (m < 12) {
    return `${m} mo${m === 1 ? '' : 's'} (Puppy / Kitten)`
  }
  const yrs = Math.floor(m / 12)
  const rem = m % 12
  const stage = yrs >= 8 ? 'Senior' : (yrs <= 2 ? 'Young Adult' : 'Adult')
  if (rem === 0) {
    return `${yrs} yr${yrs === 1 ? '' : 's'} (${stage})`
  }
  return `${yrs} yr${yrs === 1 ? '' : 's'}, ${rem} mo${rem === 1 ? '' : 's'} (${stage})`
}

export function formatPetAge(pet) {
  if (!pet) return ''
  const months = pet.ageMonths != null
    ? Number(pet.ageMonths)
    : (pet.age != null && Number(pet.age) > 0 ? Math.round(Number(pet.age) * 12) : null)

  if (months == null || isNaN(months) || months <= 0) {
    if (pet.age != null) return `${pet.age} yr${Number(pet.age) === 1 ? '' : 's'}`
    return ''
  }

  if (months < 12) {
    return `${months} mo${months === 1 ? '' : 's'}`
  }
  const yrs = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) {
    return `${yrs} yr${yrs === 1 ? '' : 's'}`
  }
  return `${yrs} yr${yrs === 1 ? '' : 's'}, ${rem} mo${rem === 1 ? '' : 's'}`
}

export function formatPetWeight(pet) {
  if (!pet) return ''
  if (pet.weightKg != null && Number(pet.weightKg) > 0) {
    return `${Number(pet.weightKg)} kg`
  }
  if (pet.weight != null && Number(pet.weight) > 0) {
    return `${Number(pet.weight)} kg`
  }
  return pet.size || ''
}
