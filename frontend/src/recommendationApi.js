import { getAuth } from 'firebase/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'

// Call once when the app loads or the user logs in, so the free service is awake later.
export function wakeUpRecommendationService() {
  fetch(`${API_URL}/health`).catch(() => {})
}

export async function getCompatibility(pet, adopter) {
  const user = getAuth().currentUser
  if (!user) throw new Error('Please log in first.')
  const token = await user.getIdToken()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90000) // allows for cold start
  try {
    const res = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pet, adopter }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Request failed (${res.status})`)
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function getBatchRecommendations(pets, adopter, topN = 10) {
  const user = getAuth().currentUser
  if (!user) throw new Error('Please log in first.')
  const token = await user.getIdToken()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90000) // allows for cold start
  try {
    const res = await fetch(`${API_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pets, adopter, top_n: topN }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Request failed (${res.status})`)
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

