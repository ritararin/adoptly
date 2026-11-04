/**
 * Generates engaging, authentic, pet-specific summaries for Adoptly cards.
 * Replaces generic boilerplate with personalized insights based on the pet's
 * unique breed, temperament, energy level, child-safety, shelter notes, and adopter fit.
 */

export function generatePetSummary(pet, score, topFactors = [], flags = []) {
  if (!pet || !pet.name) {
    return 'A wonderful companion waiting to meet their forever family.'
  }

  const name = typeof pet.name === 'string' ? pet.name.trim() : 'This pet'
  const breed = typeof pet.breed === 'string' ? pet.breed.trim() : ''
  const species = typeof pet.species === 'string' ? pet.species.toLowerCase() : 'dog'
  const breedOrSpecies = breed && breed.toLowerCase() !== 'mixed' && breed.toLowerCase() !== 'unknown'
    ? breed
    : `${species === 'cat' ? 'feline' : 'canine'} friend`

  const temp = typeof pet.temperament === 'string' ? pet.temperament.toLowerCase() : 'friendly'
  const scoreNum = score != null ? (score > 1 ? Math.round(score) : Math.round(score * 100)) : 75

  // Energy descriptors
  const energyLevels = {
    1: 'a peaceful, low-key rhythm',
    2: 'a calm, gentle daily pace',
    3: 'a balanced mix of play and cuddle time',
    4: 'an active, spirited adventure drive',
    5: 'boundless athletic energy',
  }
  const energyDesc = energyLevels[pet.energyLevel] || 'a lovely daily rhythm'

  // Age phrase
  const ageNum = Number(pet.age)
  const agePhrase = !isNaN(ageNum) && ageNum > 0
    ? (ageNum < 1 ? 'young' : ageNum >= 7 ? 'wise senior' : `${ageNum}-year-old`)
    : ''

  // Shelter specific care requirements / personality notes
  const shelterNote = typeof pet.careRequirements === 'string' ? pet.careRequirements.trim() : ''
  if (shelterNote && shelterNote.length > 8 && !shelterNote.toLowerCase().includes('none')) {
    const cleanNote = shelterNote.replace(/[.]+$/, '')
    if (scoreNum >= 80) {
      return `${name} is a ${temp} ${breedOrSpecies} with ${energyDesc}. Shelter note: ${cleanNote}.`
    }
    return `${name} (${agePhrase ? `${agePhrase} ` : ''}${temp} ${breedOrSpecies}) is a great candidate. Shelter note: ${cleanNote}.`
  }

  // Child suitability notice if flagged
  if (flags?.includes('child_friendliness_not_assessed') || flags?.includes('not_recommended_for_children')) {
    return `${name} is a ${temp} ${breedOrSpecies} known for ${energyDesc}. Best suited for quiet or adult households.`
  }

  if (pet.childFriendly >= 4) {
    if (scoreNum >= 82) {
      return `${name} is an exceptional fit! A ${temp} ${breedOrSpecies} known to be gentle with children and thriving on ${energyDesc}.`
    }
    return `${name} is a ${temp}, family-friendly ${breedOrSpecies} who thrives on ${energyDesc}.`
  }

  // Top ML feature driver if present
  const positiveFactor = topFactors?.find(f => f.effect === 'raises' || f.contribution > 0)
  const factorLabel = positiveFactor?.label?.toLowerCase()

  if (scoreNum >= 85) {
    if (factorLabel) {
      return `${name} is an ideal companion! Their ${temp} nature and ${energyDesc} fit your ${factorLabel} seamlessly.`
    }
    return `${name} is an outstanding match! A ${temp} ${breedOrSpecies} ready to bring endless affection to your home.`
  }

  if (scoreNum >= 72) {
    if (factorLabel) {
      return `Great pairing! ${name} is a ${temp} ${breedOrSpecies} whose lifestyle pairs wonderfully with your ${factorLabel}.`
    }
    return `Great pairing! ${name} is a ${temp} ${breedOrSpecies} with ${energyDesc} that matches your lifestyle.`
  }

  if (scoreNum >= 55) {
    return `${name} is a sweet, ${temp} ${breedOrSpecies} looking for a loving home that appreciates ${energyDesc}.`
  }

  return `${name} is a unique ${temp} ${breedOrSpecies} seeking a dedicated and caring environment.`
}

