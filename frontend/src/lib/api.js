import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'
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
// Uploads a File to Firebase Storage and returns a public download URL.
// The resulting URL is stored on the pet doc as `photoUrl` — same field the rest of
// the app already reads, so nothing downstream changes.
export async function uploadPetPhoto(shelterId, file) {
  if (!file) return null
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.')

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `pets/${shelterId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const snap = await uploadBytes(ref(storage, path), file, { contentType: file.type })
  return getDownloadURL(snap.ref)
}

// ---------- Recommendations (FR-05, FR-06) ----------
// Mock mode scores in-browser. Real mode POSTs to a Cloud Function which calls the Python ML service
// and must return: [{ petId, score, contributions:[{feature,label,impact,detail}], summary }]
export async function getRecommendations(uid, profile) {
  const pets = await listPets({ onlyAvailable: true })
  let results
  if (import.meta.env.VITE_USE_MOCK_ML === 'true') {
    results = pets.map(p => ({ petId: p.id, ...scorePair(profile, p) }))
  } else {
    const res = await fetch(import.meta.env.VITE_ML_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adopterId: uid, profile, petIds: pets.map(p => p.id) })
    })
    if (!res.ok) throw new Error('Recommendation service unavailable')
    results = await res.json()
  }
  const byId = Object.fromEntries(pets.map(p => [p.id, p]))
  return results.filter(r => byId[r.petId]).map(r => ({ ...r, pet: byId[r.petId] })).sort((a, b) => b.score - a.score)
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
