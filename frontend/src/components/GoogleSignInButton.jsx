// frontend/src/components/GoogleSignInButton.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../lib/firebase'
export default function GoogleSignInButton({ onSuccess, label = 'Continue with Google' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const handleClick = async () => {
    setLoading(true)
    setError('')
    const { user, error: errCode } = await signInWithGoogle()

    if (errCode) {
      if (errCode === 'auth/popup-closed-by-user') setError('Sign-in cancelled.')
      else if (errCode === 'auth/popup-blocked') setError('Popup blocked — please allow popups.')
      else setError('Google sign-in failed. Try again.')
      setLoading(false)
      return
    }

    if (onSuccess) onSuccess(user)
    else nav('/')
    setLoading(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-forest-wash disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.32z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        {loading ? 'Signing in…' : label}
      </button>
      {error && <p className="mt-2 rounded-lg bg-terracotta/10 px-3 py-2 text-xs font-medium text-terracotta-deep">{error}</p>}
    </div>
  )
}