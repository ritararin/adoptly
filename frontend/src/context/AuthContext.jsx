import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// FR-01: role is derived from the email domain, never chosen by the user.
export function roleFromEmail(email) {
  const e = email.toLowerCase()
  const admins = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (admins.includes(e)) return 'admin'
  const domains = (import.meta.env.VITE_SHELTER_DOMAINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return domains.includes(e.split('@')[1]) ? 'shelter' : 'adopter'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, async fb => {
    if (!fb) { setUser(null); setLoading(false); return }
    const snap = await getDoc(doc(db, 'users', fb.uid))
    setUser(snap.exists() ? { uid: fb.uid, ...snap.data() } : null)
    setLoading(false)
  }), [])

  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    const profile = { name, email, role: roleFromEmail(email), createdAt: serverTimestamp() }
    await setDoc(doc(db, 'users', cred.user.uid), profile)
    setUser({ uid: cred.user.uid, ...profile })
  }
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)

  return <AuthContext.Provider value={{ user, loading, register, login, logout }}>{children}</AuthContext.Provider>
}
