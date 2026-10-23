import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from 'firebase/firestore'
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { db, app } from './firebase' 
import { supabase } from './supabase' 
import { scorePair } from './scorer'

const withId = d => ({ id: d.id, ...d.data() })

// ---------- Adopter profile (FR-02) ----------
export async function getAdopterProfile(uid) {
  const s = await getDoc(doc(db, 'users', uid, 'adopterProfiles', 'main'))
  return s.exists() ? s.data() : null
}

export const saveAdopterProfile = (uid, data) =>
  setDoc(doc(db, 'users', uid, 'adopterProfiles', 'main'), { ...data, updatedAt: serverTimestamp() })

// ---------- Pets (FR-03, FR-04) ----------
export async function listPets({ shelterId, onlyAvailable } = {}) {
  const clauses = []
  if (shelterId) clauses.push(where('shelterId', '==', shelterId))
  if (onlyAvailable) clauses.push(where('adoptionStatus', '==', 'Available'))
  const snap = await getDocs(query(collection(db, 'pets'), ...clauses))
  return snap.docs.map(withId)
}

export async function getPet(id) {
  const s = await getDoc(doc(db, 'pets', id))
  return s.exists() ? withId(s) : null
}

export const createPet = (data) => addDoc(collection(db, 'pets'), { ...data, createdAt: serverTimestamp() })
export const updatePet = (id, data) => updateDoc(doc(db, 'pets', id), data)
export const deletePet = (id) => deleteDoc(doc(db, 'pets', id))

// ---------- Pet photo upload (FR-03) ----------
export async function uploadPetPhoto(shelterId, file) {
  if (!file) return null
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.')

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
    const filePath = `${shelterId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('pet-photos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from('pet-photos').getPublicUrl(filePath)
    return publicUrl
  } catch (error) {
    console.error("Supabase Upload Error:", error)
    throw new Error('Failed to upload image. Please try again.')
  }
}

// ============================================
// CLOUD FUNCTIONS INITIALIZATION
// ============================================
const functions = getFunctions(app, 'us-central1')

if (window.location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, "localhost", 5001);
  console.log("✅ Connected to Functions emulator");
}

// ---------- Recommendations (FR-05, FR-06) ----------
export async function getRecommendations(uid, profile) {
  if (import.meta.env.VITE_USE_MOCK_ML === 'true') {
    const pets = await listPets({ onlyAvailable: true })
    const results = pets.map(p => ({ petId: p.id, ...scorePair(profile, p) }))
    return results.map(r => ({ ...r, pet: pets.find(p => p.id === r.petId) })).sort((a, b) => b.score - a.score)
  }

  try {
    const generateFn = httpsCallable(functions, "generateRecommendations")
    const result = await generateFn()
    
    const pets = await listPets({ onlyAvailable: true })
    const byId = Object.fromEntries(pets.map(p => [p.id, p]))
    
    // ✅ FIX: Map 'compatibilityScore' to 'score' so the UI renders it
    return result.data.recommendations
      .map(r => ({ 
        ...r, 
        pet: byId[r.petId],
        score: r.compatibilityScore, 
        summary: "Based on your lifestyle profile, this pet is a strong match." 
      }))
      .filter(r => r.pet) 

  } catch (error) {
    console.error("Failed to fetch recommendations from Cloud Function:", error)
    throw error
  }
}

// ---------- Applications (FR-07) ----------
export const submitApplication = (data) =>
  addDoc(collection(db, 'adoptionApplications'), { ...data, status: 'Pending Review', submittedDate: serverTimestamp() })

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

export const updateApplication = (id, data) => updateDoc(doc(db, 'adoptionApplications', id), data)

// ---------- Admin (FR-08) ----------
export async function listUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(withId)
}

// ---------- Google Meet Integration ----------
export async function scheduleGoogleMeet({ applicationId, petName, adopterEmail, shelterEmail, dateTime }) {
  try {
    const scheduleFn = httpsCallable(functions, "scheduleInterview")
    const result = await scheduleFn({
      applicationId,
      petName,
      adopterEmail,
      shelterEmail,
      dateTime
    })
    return result.data 
  } catch (error) {
    console.error("Failed to schedule Meet:", error)
    throw error
  }
}