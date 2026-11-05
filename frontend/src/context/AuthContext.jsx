
import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

// FR-01: derive the initial role from configured email domains or explicit emails.
export function roleFromEmail(email) {
  if (!email) return 'adopter'

  const normalizedEmail = email.trim().toLowerCase()

  const admins = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

  if (admins.includes(normalizedEmail)) return 'admin'

  const defaultShelters = 'ritararin@gmail.com,rita.palmeris@strathmore.edu'
  const shelters = `${defaultShelters},${import.meta.env.VITE_SHELTER_DOMAINS || ''}`
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

  const isShelter = shelters.some(entry => {
    // If the entry contains '@', check for exact email match (or exact email without leading @)
    if (entry.includes('@')) {
      const cleanEntry = entry.replace(/^@/, '')
      return normalizedEmail === cleanEntry || normalizedEmail === entry
    }
    // If the entry is a domain (e.g. 'shelter.org' or '@shelter.org')
    const domain = entry.replace(/^@/, '')
    return normalizedEmail.endsWith(`@${domain}`) || normalizedEmail.split('@')[1] === domain
  })

  return isShelter ? 'shelter' : 'adopter'
}

// Create a profile only after Firebase has authenticated the account
// and, for email/password accounts, verified its email.
async function ensureUserProfile(fbUser) {
  if (!fbUser.email) {
    throw new Error('auth/missing-email')
  }

  const userRef = doc(db, 'users', fbUser.uid)
  const snapshot = await getDoc(userRef)
  const expectedRole = roleFromEmail(fbUser.email)

  if (snapshot.exists()) {
    const existing = snapshot.data()

    // If the configured role has changed (e.g. email was added to VITE_SHELTER_DOMAINS or VITE_ADMIN_EMAILS),
    // sync it to Firestore and the local user state so they receive shelter/admin access.
    if (existing.role !== expectedRole) {
      try {
        await setDoc(userRef, { role: expectedRole }, { merge: true })
        existing.role = expectedRole
      } catch (err) {
        console.warn('Could not auto-sync role to Firestore:', err)
        existing.role = expectedRole
      }
    }

    return {
      uid: fbUser.uid,
      ...existing,
      email: fbUser.email,
      emailVerified: fbUser.emailVerified,
    }
  }

  const profile = {
    name: fbUser.displayName || 'New User',
    email: fbUser.email,
    role: expectedRole,
    emailVerified: fbUser.emailVerified,
    createdAt: serverTimestamp(),
  }

  await setDoc(userRef, profile)

  return {
    uid: fbUser.uid,
    ...profile,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      try {
        if (!fbUser) {
          setUser(null)
          return
        }

        // Email/password users must verify before accessing Adoptly.
        // Google accounts are accepted when Firebase marks their email verified.
        await reload(fbUser)

        if (!fbUser.emailVerified) {
          setUser(null)
          return
        }

        const profile = await ensureUserProfile(fbUser)
        setUser(profile)
      } catch (error) {
        console.error('Could not load authenticated user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const register = async (name, email, password) => {
    const normalizedEmail = email.trim().toLowerCase()

    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    )

    try {
      await updateProfile(credential.user, {
        displayName: name.trim(),
      })

      await sendEmailVerification(credential.user)

      // Do not create an application profile or grant access yet.
      // The user must verify their email and sign in again.
      await signOut(auth)

      return { email: normalizedEmail }
    } catch (error) {
      // Keep the account signed out if sending the verification email fails.
      await signOut(auth).catch(() => {})
      throw error
    }
  }

  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase()

    const credential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    )

    try {
      await reload(credential.user)

      if (!credential.user.emailVerified) {
        // Allow the user to receive another verification email.
        await sendEmailVerification(credential.user).catch(error => {
          console.error('Could not resend verification email:', error)
        })

        await signOut(auth)

        const error = new Error('Please verify your email before logging in.')
        error.code = 'auth/email-not-verified'
        throw error
      }

      await ensureUserProfile(credential.user)
      return credential
    } catch (error) {
      if (error.code !== 'auth/email-not-verified') {
        await signOut(auth).catch(() => {})
      }
      throw error
    }
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    const credential = await signInWithPopup(auth, provider)

    try {
      await reload(credential.user)

      if (!credential.user.emailVerified) {
        await signOut(auth)
        const error = new Error(
          'Google did not confirm this email address as verified.'
        )
        error.code = 'auth/email-not-verified'
        throw error
      }

      await ensureUserProfile(credential.user)
      return credential
    } catch (error) {
      await signOut(auth).catch(() => {})
      throw error
    }
  }

  const resetPassword = email =>
    sendPasswordResetEmail(auth, email.trim().toLowerCase())

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        resetPassword,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
