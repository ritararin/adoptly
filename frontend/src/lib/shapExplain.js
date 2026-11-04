/**
 * Explainability helper for ML/SHAP feature contributions.
 * Translates raw numerical SHAP values into intuitive symbols (+, ++, -, --)
 * and human-friendly narratives explaining why a factor raises or lowers compatibility.
 */

export function getFactorSymbol(impact, effect) {
  const isPositive = effect === 'raises' || (Number(impact) || 0) >= 0
  const abs = Math.abs(Number(impact) || 0)

  if (isPositive) {
    if (abs >= 0.2 || abs >= 20) {
      return {
        symbol: '++',
        badgeText: 'Strong Fit',
        tier: 'high-positive',
        isPositive: true,
      }
    }
    return {
      symbol: '+',
      badgeText: 'Good Fit',
      tier: 'positive',
      isPositive: true,
    }
  } else {
    if (abs >= 0.2 || abs >= 20) {
      return {
        symbol: '--',
        badgeText: 'Key Trade-Off',
        tier: 'high-negative',
        isPositive: false,
      }
    }
    return {
      symbol: '-',
      badgeText: 'Consideration',
      tier: 'negative',
      isPositive: false,
    }
  }
}

const FEATURE_EXPLANATIONS = {
  activityLevel: {
    positive: 'Your active lifestyle aligns smoothly with this pet’s daily exercise and energy needs.',
    negative: 'This pet’s energy level may require more daily exercise than your current activity routine.',
  },
  activity: {
    positive: 'Your active lifestyle aligns smoothly with this pet’s daily exercise and energy needs.',
    negative: 'This pet’s energy level may require more daily exercise than your current activity routine.',
  },
  careHoursNumeric: {
    positive: 'You have plenty of dedicated daily hours to feed, bond, exercise, and care for this pet.',
    negative: 'This pet thrives on more direct daily attention and companionship than your stated schedule.',
  },
  careTime: {
    positive: 'You have plenty of dedicated daily hours to feed, bond, exercise, and care for this pet.',
    negative: 'This pet thrives on more direct daily attention and companionship than your stated schedule.',
  },
  'Avg total daily time hours': {
    positive: 'Your daily care time easily accommodates this companion’s daily feeding and routine needs.',
    negative: 'Requires a higher daily time commitment than your stated availability.',
  },
  housingSpace: {
    positive: 'Your living environment provides comfortable room for a pet of this size and movement style.',
    negative: 'Your home environment may feel snug given this pet’s physical size or space needs.',
  },
  housing: {
    positive: 'Your living environment provides comfortable room for a pet of this size and movement style.',
    negative: 'Your home environment may feel snug given this pet’s physical size or space needs.',
  },
  hasChildrenUnder12: {
    positive: 'This pet has a gentle, patient nature well-suited for households with young children.',
    negative: 'This pet thrives best in a quiet, mature environment and can be sensitive around young kids.',
  },
  child_friendly: {
    positive: 'This pet has a gentle, patient nature well-suited for households with young children.',
    negative: 'This pet thrives best in a quiet, mature environment and can be sensitive around young kids.',
  },
  household: {
    positive: 'Your household composition and dynamic are an excellent match for this companion.',
    negative: 'Take care introducing this pet into your home environment to ensure mutual comfort.',
  },
  hasOtherPets: {
    positive: 'Known to be friendly, social, and easygoing around other animals in the home.',
    negative: 'Prefers being the only companion or needs slow, structured socialization.',
  },
  dog_friendly: {
    positive: 'Social and welcoming around other animals in the home.',
    negative: 'Best suited as the sole pet in the household.',
  },
  experienceLevel: {
    positive: 'Your pet-raising experience matches the handling and training needs of this companion.',
    negative: 'Has unique handling or training needs that benefit from an experienced pet parent.',
  },
  experience: {
    positive: 'Your pet-raising experience matches the handling and training needs of this companion.',
    negative: 'Has unique handling or training needs that benefit from an experienced pet parent.',
  },
  groomingTolerance: {
    positive: 'This pet’s coat and hygiene maintenance fits comfortably within your grooming preferences.',
    negative: 'Requires more regular brushing and coat maintenance than your baseline preference.',
  },
  grooming: {
    positive: 'This pet’s coat and hygiene maintenance fits comfortably within your grooming preferences.',
    negative: 'Requires more regular brushing and coat maintenance than your baseline preference.',
  },
  pet_fur_code: {
    positive: 'Coat type and shedding profile match your maintenance expectations.',
    negative: 'Coat care and shedding may require more frequent upkeep.',
  },
  'Avg grooming hours monthly': {
    positive: 'Monthly grooming requirements fit easily into your regular schedule.',
    negative: 'Requires regular monthly grooming sessions or professional upkeep.',
  },
  energy_level: {
    positive: 'The pet’s natural energy tempo creates a balanced household dynamic.',
    negative: 'The pet’s high vitality requires extra playtime and active outlets.',
  },
  'Avg exercise minutes daily': {
    positive: 'Exercise demands fit neatly into your planned daily walks and recreation.',
    negative: 'Requires more vigorous daily exercise than your typical walking routine.',
  },
  adaptability: {
    positive: 'Adapts easily to neighborhood noises, new visitors, and shifting daily schedules.',
    negative: 'Thrives best in a quiet, predictable environment with minimal sudden changes.',
  },
  urban_friendly: {
    positive: 'Comfortable with apartment living, elevators, and bustling neighborhood sights.',
    negative: 'May feel stressed by dense city noise and prefers calmer residential surroundings.',
  },
  affection_level: {
    positive: 'Affectionate and deeply loving; matches your desire for close companionship.',
    negative: 'More independent in nature and enjoys personal quiet space.',
  },
  social_needs: {
    positive: 'Social needs align nicely with your household presence.',
    negative: 'Dislikes being left alone for extended periods and prefers frequent company.',
  },
  vocalisation: {
    positive: 'Has a quiet disposition suitable for shared spaces and noise-sensitive apartments.',
    negative: 'Communicates vocally and may not be ideal for noise-restricted living.',
  },
  Type: {
    positive: 'Matches your preferred companion species.',
    negative: 'Differs from your stated companion species preference.',
  },
  preference: {
    positive: 'Matches your preferred companion species.',
    negative: 'Differs from your stated companion species preference.',
  },
}

export function getFactorDescription(factor) {
  if (!factor) return ''

  const featKey = factor.feature || factor.name || ''
  const isPositive = factor.effect === 'raises' || (Number(factor.impact ?? factor.contribution ?? factor.value) || 0) >= 0

  // Lookup in predefined mapping
  if (FEATURE_EXPLANATIONS[featKey]) {
    return isPositive
      ? FEATURE_EXPLANATIONS[featKey].positive
      : FEATURE_EXPLANATIONS[featKey].negative
  }

  // Normalize by feature label if key wasn't found directly
  const labelLower = (factor.label || '').toLowerCase()
  for (const [k, expl] of Object.entries(FEATURE_EXPLANATIONS)) {
    if (labelLower.includes(k.toLowerCase())) {
      return isPositive ? expl.positive : expl.negative
    }
  }

  // If factor already has a clean detail from rubric (and doesn't contain raw math)
  if (factor.detail && !factor.detail.includes('(+') && !factor.detail.includes('(-')) {
    return factor.detail
  }

  // Fallback
  return isPositive
    ? `Strongly supports compatibility based on your stated preferences.`
    : `A lifestyle factor to keep in mind when establishing your daily routine.`
}

export function getOverallCompatibilityVerdict(score) {
  const pct = score != null ? (score > 1 ? Math.round(score) : Math.round(score * 100)) : 75

  if (pct >= 85) {
    return {
      title: 'Highly Compatible Match',
      description: 'Your daily schedule, living space, and activity level align exceptionally well with this pet’s temperament and exercise needs.',
      badgeColor: 'emerald',
    }
  }
  if (pct >= 70) {
    return {
      title: 'Strong Compatible Match',
      description: 'A wonderful overall match with great common ground. Review the consideration factors below to ensure an effortless transition.',
      badgeColor: 'forest',
    }
  }
  if (pct >= 50) {
    return {
      title: 'Moderate Compatibility',
      description: 'A promising connection with a few lifestyle trade-offs. Extra flexibility around care time or exercise will help this companion thrive.',
      badgeColor: 'amber',
    }
  }
  return {
    title: 'Requires Dedicated Adjustment',
    description: 'This companion has specific space, exercise, or household requirements that may differ notably from your current routine.',
    badgeColor: 'rose',
  }
}

