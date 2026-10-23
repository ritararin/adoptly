import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  connectAuthEmulator 
} from 'firebase/auth'
import { 
  getFirestore, 
  connectFirestoreEmulator 
} from 'firebase/firestore'
import { 
  getStorage, 
  connectStorageEmulator 
} from 'firebase/storage'

export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// ✅ ALWAYS connect to emulators on localhost
if (window.location.hostname === 'localhost') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, 'localhost', 8081)
    connectStorageEmulator(storage, 'localhost', 9199)   
    console.log('✅ Connected to Auth + Firestore + Storage emulators')
  } catch (err) {
    // Ignore "already connected" errors during HMR
    if (!String(err).includes('already')) {
      console.error('Emulator connection error:', err)
    }
  }
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return { user: result.user, error: null }
  } catch (error) {
    console.error('Google sign-in error:', error.code, error.message)
    return { user: null, error: error.code }
  }
}