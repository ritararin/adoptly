
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

let adopterProfileCache = {
  uid: null,
  timestamp: 0,
  data: null,
}

export function clearAdopterProfileCache() {
  adopterProfileCache = { uid: null, timestamp: 0, data: null }
}

export async function getAdopterProfile(uid, options = {}) {
  if (!uid) {
    throw new Error('You must be signed in to load your adopter profile.')
  }

  // Fast in-memory cache check (valid for 5 minutes unless explicitly refreshed)
  if (
    !options.forceRefresh &&
    adopterProfileCache.uid === uid &&
    adopterProfileCache.data &&
    Date.now() - adopterProfileCache.timestamp < 300000
  ) {
    return adopterProfileCache.data
  }

  const profileRef = doc(
    db,
    'users',
    uid,
    'adopterProfiles',
    'main'
  )

  const snapshot = await getDoc(profileRef)
  const data = snapshot.exists() ? snapshot.data() : null

  adopterProfileCache = {
    uid,
    timestamp: Date.now(),
    data,
  }

  return data
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

  clearAdopterProfileCache()
  clearRecommendationsCache()
}

// ---------- Pets (FR-03, FR-04) ----------

let availablePetsCache = {
  timestamp: 0,
  data: null,
}

export function clearPetsCache() {
  availablePetsCache = { timestamp: 0, data: null }
}

export async function listPets({ shelterId, onlyAvailable } = {}, options = {}) {
  // Fast in-memory cache for available pets across all shelters (valid for 3 minutes)
  if (
    !shelterId &&
    onlyAvailable &&
    !options?.forceRefresh &&
    availablePetsCache.data &&
    Date.now() - availablePetsCache.timestamp < 180000
  ) {
    return availablePetsCache.data
  }

  const clauses = []

  if (shelterId) {
    clauses.push(where('shelterId', '==', shelterId))
  }

  if (onlyAvailable) {
    clauses.push(where('adoptionStatus', '==', 'Available'))
  }

  const petsQuery = query(collection(db, 'pets'), ...clauses)
  const snapshot = await getDocs(petsQuery)

  const result = snapshot.docs.map(withId)

  if (!shelterId && onlyAvailable) {
    availablePetsCache = {
      timestamp: Date.now(),
      data: result,
    }
  }

  return result
}

export async function getPet(id) {
  if (!id) return null

  const snapshot = await getDoc(doc(db, 'pets', id))

  return snapshot.exists() ? withId(snapshot) : null
}

export async function createPet(data) {
  clearPetsCache()
  clearRecommendationsCache()
  return addDoc(collection(db, 'pets'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updatePet(id, data) {
  clearPetsCache()
  clearRecommendationsCache()
  return updateDoc(doc(db, 'pets', id), data)
}

export async function deletePet(id) {
  clearPetsCache()
  clearRecommendationsCache()
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

let recommendationsCache = {
  key: null,
  uid: null,
  timestamp: 0,
  data: null,
  profile: null,
}

export function getCachedRecommendations(uid) {
  if (
    recommendationsCache.data &&
    recommendationsCache.uid === uid &&
    Date.now() - recommendationsCache.timestamp < 300000 // 5 minutes validity
  ) {
    return {
      recs: recommendationsCache.data,
      profile: recommendationsCache.profile,
    }
  }
  return null
}

export function clearRecommendationsCache() {
  recommendationsCache = { key: null, uid: null, timestamp: 0, data: null, profile: null }
}

export async function getRecommendations(uid, profile, options = {}) {
  if (!uid) {
    throw new Error('You must be signed in to get recommendations.')
  }

  if (!profile) {
    throw new Error('Complete your adopter profile first.')
  }

  // Fast in-memory cache check (valid for 5 minutes unless explicitly refreshed)
  const cacheKey = `${uid}_${profile?.updatedAt?.seconds || profile?.updatedAt || JSON.stringify(profile)}`
  if (
    !options.forceRefresh &&
    recommendationsCache.key === cacheKey &&
    recommendationsCache.data &&
    Date.now() - recommendationsCache.timestamp < 300000
  ) {
    // Keep profile reference updated
    recommendationsCache.profile = profile
    return recommendationsCache.data
  }

  // Use preloaded pets if provided by caller (parallelized fetch), otherwise load from Firestore
  const pets = options.pets || await listPets({ onlyAvailable: true })
  if (pets.length === 0) {
    return []
  }

  // Optional local browser mock mode
  if (import.meta.env.VITE_USE_MOCK_ML === 'true') {
    const scored = pets
      .map((pet) => ({
        petId: pet.id,
        pet,
        ...scorePair(profile, pet),
      }))
      .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    recommendationsCache = {
      key: cacheKey,
      uid,
      timestamp: Date.now(),
      data: scored,
      profile,
    }
    return scored
  }

  try {
    const apiResult = await getBatchRecommendations(pets, profile)
    const recs = apiResult?.recommendations || []
    const petsById = Object.fromEntries(pets.map((p) => [p.id, p]))

    const formatted = recs
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

    // Store in cache for instantaneous subsequent page loads
    recommendationsCache = {
      key: cacheKey,
      uid,
      timestamp: Date.now(),
      data: formatted,
      profile,
    }
    return formatted
  } catch (error) {
    console.warn('ML recommendations endpoint failed, falling back to local rubric:', error)
    const fallback = pets
      .map((pet) => ({
        petId: pet.id,
        pet,
        ...scorePair(profile, pet),
      }))
      .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    recommendationsCache = {
      key: cacheKey,
      uid,
      timestamp: Date.now(),
      data: fallback,
      profile,
    }
    return fallback
  }
}

// ---------- Pet Adoption Queue Tracking (FIFO) ----------

export async function getPetQueueEntries(petId) {
  if (!petId) return []
  try {
    const snap = await getDocs(collection(db, 'petQueues', petId, 'entries'))
    return snap.docs.map(withId)
  } catch (err) {
    console.warn(`Could not fetch pet queue entries for pet ${petId}:`, err)
    return []
  }
}

export async function recordPetQueueEntry(petId, appId, entryData) {
  if (!petId || !appId) return
  try {
    const entryRef = doc(db, 'petQueues', petId, 'entries', appId)
    await setDoc(
      entryRef,
      {
        appId,
        petId,
        ...entryData,
      },
      { merge: true }
    )
  } catch (err) {
    console.warn(`Could not record pet queue entry for pet ${petId}, app ${appId}:`, err)
  }
}

export async function updatePetQueueEntry(petId, appId, updateData) {
  if (!petId || !appId) return
  try {
    const entryRef = doc(db, 'petQueues', petId, 'entries', appId)
    await setDoc(entryRef, updateData, { merge: true })
  } catch (err) {
    console.warn(`Could not update pet queue entry for pet ${petId}, app ${appId}:`, err)
  }
}

// ---------- Applications (FR-07) ----------

export async function submitApplication(data) {
  const petId = data.petId
  let queueRank = 1
  let queueTotal = 1

  // 1. Determine active queue length for this pet to stamp initial rank
  if (petId) {
    try {
      const existingEntries = await getPetQueueEntries(petId)
      const active = existingEntries.filter(
        (e) => e.status === 'Pending Review' || e.status === 'Interview Scheduled'
      )
      queueRank = active.length + 1
      queueTotal = queueRank
    } catch (err) {
      console.warn('Could not inspect active queue length on submit:', err)
    }
  }

  // 2. Create the application document
  const appRef = await addDoc(collection(db, 'adoptionApplications'), {
    ...data,
    status: 'Pending Review',
    submittedDate: serverTimestamp(),
    queueRank,
    queueTotal,
    storedQueueRank: queueRank,
    storedQueueTotal: queueTotal,
  })

  // 3. Record the queue entry in petQueues/{petId}/entries/{appId}
  if (petId) {
    try {
      await recordPetQueueEntry(petId, appRef.id, {
        appId: appRef.id,
        petId,
        adopterId: data.adopterId,
        status: 'Pending Review',
        submittedDate: serverTimestamp(),
        submittedAt: Date.now(),
        queueRank,
        queueTotal,
      })
    } catch (err) {
      console.warn('Could not record pet queue entry in petQueues:', err)
    }
  }

  return appRef
}

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

export async function updateApplication(id, data) {
  await updateDoc(doc(db, 'adoptionApplications', id), data)

  // Synchronize status and queue ranking to petQueues/{petId}/entries/{id}
  if (data.status || data.queueRank || data.queueTotal) {
    try {
      let petId = data.petId
      if (!petId) {
        const snap = await getDoc(doc(db, 'adoptionApplications', id))
        if (snap.exists()) {
          petId = snap.data()?.petId
        }
      }
      if (petId) {
        const queuePatch = {}
        if (data.status) queuePatch.status = data.status
        if (data.queueRank) queuePatch.queueRank = data.queueRank
        if (data.queueTotal) queuePatch.queueTotal = data.queueTotal
        await updatePetQueueEntry(petId, id, queuePatch)
      }
    } catch (err) {
      console.warn('Non-blocking sync to petQueues failed in updateApplication:', err)
    }
  }
}

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

