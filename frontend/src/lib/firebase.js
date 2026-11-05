import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from 'firebase/app-check'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Optional helper for Google sign-in
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return { user: result.user, error: null }
  } catch (error) {
    return { user: null, error: error.code || error.message }
  }
}

// ========================================================
// FIREBASE APP CHECK INITIALIZATION
// Protects Firestore, Storage, and backend services against abuse
// ========================================================
export let appCheck = null

if (typeof window !== 'undefined') {
  const recaptchaKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
    '6LfXcBEuAAAAACyDghPLCdE_f3IulEyAefi9ELhr'

  if (recaptchaKey) {
    try {
      // In development or when explicitly requested, enable App Check debug tokens
      // Check the browser console on localhost for "App Check debug token: <token>"
      if (import.meta.env.DEV || import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN) {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN =
          import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN === 'true'
            ? true
            : import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN ||
              (import.meta.env.DEV ? true : undefined)
      }

      // Support reCAPTCHA Enterprise (default for Google Cloud keys) or reCAPTCHA v3
      const provider =
        import.meta.env.VITE_RECAPTCHA_PROVIDER === 'v3'
          ? new ReCaptchaV3Provider(recaptchaKey)
          : new ReCaptchaEnterpriseProvider(recaptchaKey)

      appCheck = initializeAppCheck(app, {
        provider,
        isTokenAutoRefreshEnabled: true,
      })
    } catch (err) {
      console.warn('Firebase App Check initialization warning:', err)
    }
  }
}
