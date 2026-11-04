
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

import { getAuth } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db, app } from './firebase'
import { supabase } from './supabase'
import { scorePair } from './scorer'
import { generatePetSummary } from './petSummary'
import { getBatchRecommendations } from '../recommendationApi'
import { getGoogleCalendarUrl } from './calendar'

const withId = (documentSnapshot) => ({
  id: documentSnapshot.id,
  ...documentSnapshot.data(),
})

// ---------- Adopter profile (FR-02) ----------

export async function getAdopterProfile(uid) {
  if (!uid) {
    throw new Error('You must be signed in to load your adopter profile.')
  }

  const profileRef = doc(
    db,
    'users',
    uid,
    'adopterProfiles',
    'main'
  )

  const snapshot = await getDoc(profileRef)

  return snapshot.exists() ? snapshot.data() : null
}

export async function saveAdopterProfile(uid, data) {
  if (!uid) {
    throw new Error('You must be signed in to save your adopter profile.')
  }

  const profileRef = doc(
    db,
    'users',
    uid,
    'adopterProfiles',
    'main'
  )

  await setDoc(
    profileRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// ---------- Pets (FR-03, FR-04) ----------

export async function listPets({ shelterId, onlyAvailable } = {}) {
  const clauses = []

  if (shelterId) {
    clauses.push(where('shelterId', '==', shelterId))
  }

  if (onlyAvailable) {
    clauses.push(where('adoptionStatus', '==', 'Available'))
  }

  const petsQuery = query(collection(db, 'pets'), ...clauses)
  const snapshot = await getDocs(petsQuery)

  return snapshot.docs.map(withId)
}

export async function getPet(id) {
  if (!id) return null

  const snapshot = await getDoc(doc(db, 'pets', id))

  return snapshot.exists() ? withId(snapshot) : null
}

export async function createPet(data) {
  return addDoc(collection(db, 'pets'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updatePet(id, data) {
  return updateDoc(doc(db, 'pets', id), data)
}

export async function deletePet(id) {
  return deleteDoc(doc(db, 'pets', id))
}

// ---------- Pet photo upload via Supabase ----------

export async function uploadPetPhoto(shelterId, file) {
  if (!file) return null

  if (!shelterId) {
    throw new Error('A shelter ID is required to upload a pet photo.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5 MB.')
  }

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const randomSuffix = Math.random().toString(36).slice(2, 8)
    const fileName = `${Date.now()}-${randomSuffix}.${fileExt}`
    const filePath = `${shelterId}/${fileName}`

    const { error } = await supabase.storage
      .from('pet-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from('pet-photos').getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Supabase pet-photo upload failed:', error)

    throw new Error(
      error?.message || 'Failed to upload the pet photo. Please try again.'
    )
  }
}

// ---------- Cloud Functions initialization ----------

// Uses the deployed Firebase Cloud Function in us-central1.
// Do not connect to the Functions emulator in real-Firebase mode.
const functions = getFunctions(app, 'us-central1')

// ---------- Recommendations (FR-05, FR-06) ----------

export async function getRecommendations(uid, profile) {
  if (!uid) {
    throw new Error('You must be signed in to get recommendations.')
  }

  if (!profile) {
    throw new Error('Complete your adopter profile first.')
  }

  const pets = await listPets({ onlyAvailable: true })
  if (pets.length === 0) {
    return []
  }

  // Optional local browser mock mode
  if (import.meta.env.VITE_USE_MOCK_ML === 'true') {
    return pets
      .map((pet) => ({
        petId: pet.id,
        pet,
        ...scorePair(profile, pet),
      }))
      .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
  }

  try {
    const apiResult = await getBatchRecommendations(pets, profile)
    const recs = apiResult?.recommendations || []
    const petsById = Object.fromEntries(pets.map((p) => [p.id, p]))

    return recs
      .map((rec) => {
        const pet = petsById[rec.id]
        const topFactors = rec.explanation?.top_factors || []
        return {
          petId: rec.id,
          pet,
          score: rec.compatibility_score ?? (rec.score ? rec.score / 100 : 0),
          percentageScore: rec.score,
          flags: rec.flags || [],
          topFactors,
          contributions: topFactors.map((tf) => ({
            feature: tf.feature,
            label: tf.label,
            detail: `${tf.effect === 'raises' ? 'Raises' : 'Lowers'} score (${tf.contribution > 0 ? '+' : ''}${tf.contribution})`,
            impact: tf.contribution,
            effect: tf.effect,
          })),
          summary: generatePetSummary(
            pet,
            rec.compatibility_score ?? (rec.score ? rec.score / 100 : 0),
            topFactors,
            rec.flags
          ),
          disclaimer: apiResult?.disclaimer,
        }
      })
      .filter((rec) => rec.pet)
  } catch (error) {
    console.warn('ML recommendations endpoint failed, falling back to local rubric:', error)
    return pets
      .map((pet) => ({
        petId: pet.id,
        pet,
        ...scorePair(profile, pet),
      }))
      .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
  }
}

// ---------- Applications (FR-07) ----------
export const submitApplication = (data) =>
  addDoc(collection(db, 'adoptionApplications'), {
    ...data,
    status: 'Pending Review',
    submittedDate: serverTimestamp(),
  })

export async function listApplications({ adopterId, shelterId } = {}) {
  const clauses = []
  if (adopterId) clauses.push(where('adopterId', '==', adopterId))
  if (shelterId) clauses.push(where('shelterId', '==', shelterId))
  const snap = await getDocs(query(collection(db, 'adoptionApplications'), ...clauses))
  return snap.docs.map(withId)
}

export async function getApplication(id) {
  const s = await getDoc(doc(db, 'adoptionApplications', id))
  return s.exists() ? withId(s) : null
}

export const updateApplication = (id, data) =>
  updateDoc(doc(db, 'adoptionApplications', id), data)

// ---------- Admin (FR-08) ----------
export async function listUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(withId)
}

// ============================================
// GOOGLE MEET SCHEDULING (CALLS BACKEND API / CALENDAR API WITH VALID CONFERENCE)
// ============================================
export async function scheduleGoogleMeet({
  applicationId,
  petName,
  adopterEmail,
  shelterEmail,
  dateTime,
}) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'
  const user = getAuth().currentUser
  const token = user ? await user.getIdToken().catch(() => null) : null

  let meetLink = ''
  let calendarLink = ''

  // 1. Primary: Call the Adoptly backend to generate an authentic Google Meet conference
  try {
    const res = await fetch(`${API_URL}/schedule-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        applicationId,
        petName,
        adopterEmail,
        shelterEmail,
        dateTime,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.meetLink) {
        meetLink = data.meetLink
        calendarLink = data.calendarLink || ''
      }
    } else {
      const err = await res.json().catch(() => ({}))
      console.warn('Backend /schedule-interview error:', err)
    }
  } catch (err) {
    console.warn('Backend /schedule-interview unreachable:', err)
  }

  // 2. Fallback: Firebase Cloud Function (if deployed)
  if (!meetLink) {
    try {
      const scheduleFn = httpsCallable(functions, 'scheduleInterview')
      const result = await scheduleFn({
        applicationId,
        petName,
        adopterEmail,
        shelterEmail,
        dateTime,
      })
      if (result?.data?.meetLink) {
        meetLink = result.data.meetLink
      }
    } catch (cfErr) {
      console.warn('Cloud Function scheduleInterview unavailable:', cfErr)
    }
  }

  if (!meetLink) {
    throw new Error('Unable to generate a valid Google Meet link. Please ensure your backend server (python app.py) is running on port 8080.')
  }

  // Generate Google Calendar 1-click URL with attendee guests
  const calendarEventUrl = getGoogleCalendarUrl({
    title: `Adoptly Interview: ${petName || 'Pet Adoption'}`,
    description: `Virtual verification interview for ${petName || 'pet adoption'}.\nMeeting link: ${meetLink}`,
    location: meetLink,
    dateTime,
    durationMinutes: 30,
    attendees: [adopterEmail, shelterEmail].filter(Boolean),
  })

  // Directly update the application in Firestore
  await updateApplication(applicationId, {
    interviewLink: meetLink,
    interviewScheduledAt: dateTime,
    status: 'Interview Scheduled',
    calendarEventUrl: calendarLink || calendarEventUrl,
    updatedAt: serverTimestamp(),
  })

  return {
    success: true,
    meetLink,
    calendarEventUrl: calendarLink || calendarEventUrl,
  }
}

export async function updateInterviewLink(applicationId, meetLink) {
  let cleanMeetLink = meetLink ? String(meetLink).trim() : ''
  if (cleanMeetLink && !cleanMeetLink.startsWith('http://') && !cleanMeetLink.startsWith('https://')) {
    cleanMeetLink = `https://${cleanMeetLink}`
  }
  await updateApplication(applicationId, {
    interviewLink: cleanMeetLink,
    updatedAt: serverTimestamp(),
  })
  return cleanMeetLink
}

