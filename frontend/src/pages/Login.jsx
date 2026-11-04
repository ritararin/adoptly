import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  PawPrint,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

export default function Login() {
  const { login, loginWithGoogle, resetPassword } = useAuth()
  const nav = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    setMsg('')

    const cleanEmail = form.email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setErr('Please enter a valid email address (e.g. name@example.com).')
      setBusy(false)
      return
    }

    try {
      await login(cleanEmail, form.password)
      nav('/')
    } catch (error) {
      console.error('Login failed:', error)

      const messages = {
        'auth/user-not-found':
          'This email does not exist in our system. Please check your spelling or register for a new account.',
        'auth/invalid-credential':
          'Incorrect email or password, or this account does not exist. Please check your credentials or register.',
        'auth/wrong-password':
          'Incorrect password. Please try again or reset your password.',
        'auth/email-not-verified':
          'Your email is not verified yet. We sent a verification link to your inbox. Please click the link to verify, then log in again.',
        'auth/invalid-email':
          'Please enter a valid email address.',
        'auth/user-disabled':
          'This account has been disabled. Please contact support.',
        'auth/too-many-requests':
          'Too many failed attempts. Please wait a few moments and try again.',
        'auth/network-request-failed':
          'Network error. Please check your internet connection.',
      }

      setErr(
        messages[error.code] ||
        'Login failed. Please check your credentials and try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setBusy(true)
    setErr('')
    setMsg('')

    try {
      await loginWithGoogle()
      nav('/')
    } catch (error) {
      console.error('Google sign-in failed:', error)

      const messages = {
        'auth/popup-blocked':
          'Your browser blocked the Google sign-in popup. Allow popups and try again.',
        'auth/popup-closed-by-user':
          'Google sign-in was cancelled.',
        'auth/unauthorized-domain':
          'This website domain is not authorized in Firebase Authentication.',
        'auth/operation-not-allowed':
          'Google sign-in is not enabled in Firebase.',
        'auth/account-exists-with-different-credential':
          'An account already exists with this email using another sign-in method. Log in using that method.',
        'auth/email-not-verified':
          'Google could not confirm that this email is verified.',
      }

      setErr(
        messages[error.code] ||
        'Google sign-in failed. Please try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async e => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    setMsg('')

    try {
      await resetPassword(form.email)
      setMsg('If the account is eligible, a password reset email will be sent. Check your inbox and spam folder.')
    } catch (error) {
      console.error('Password reset failed:', error)

      setErr(
        error.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : 'Could not send the reset email. Check the address and try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf8f4] p-4 sm:p-6">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] size-[600px] rounded-full bg-forest/[0.07] blur-[140px]" />
        <div className="absolute top-[35%] -right-[10%] size-[550px] rounded-full bg-amber-500/[0.05] blur-[150px]" />
        <div className="absolute -bottom-[20%] left-[20%] size-[600px] rounded-full bg-emerald-600/[0.06] blur-[140px]" />
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-line/80 bg-white/95 p-7 sm:p-9 shadow-2xl backdrop-blur-md transition-all">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-forest to-forest-dark text-gold shadow-md shadow-forest/20">
            <PawPrint size={24} fill="currentColor" />
          </span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-serif text-2xl font-bold tracking-tight text-forest">
              adoptly
            </span>
            <span className="size-1.5 rounded-full bg-gold" />
          </div>

          <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-ink-head">
            {isResetting ? 'Reset your password' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            {isResetting
              ? 'Enter your account email to receive a recovery link'
              : 'Sign in to access your matches, applications, and saved pets'}
          </p>
        </div>

        {/* Google Sign-in Option */}
        {!isResetting && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-2xs transition-all hover:border-forest/40 hover:bg-forest-wash/40 hover:shadow-xs active:scale-[0.99] disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.32z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-whisper">
                or sign in with email
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={isResetting ? handleReset : submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input
                className="input pl-10 pr-4 py-2.5 w-full rounded-xl border border-line bg-cream-soft/40 focus:bg-white focus:border-forest focus:ring-4 focus:ring-forest/10 transition-all text-sm font-medium text-ink"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {!isResetting && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-ink-muted">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetting(true)
                    setErr('')
                    setMsg('')
                  }}
                  className="text-xs font-bold text-forest hover:text-forest-dark hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                <input
                  className="input pl-10 pr-10 py-2.5 w-full rounded-xl border border-line bg-cream-soft/40 focus:bg-white focus:border-forest focus:ring-4 focus:ring-forest/10 transition-all text-sm font-medium text-ink"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {err && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-800 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{err}</span>
            </div>
          )}

          {/* Success Alert */}
          {msg && (
            <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-medium text-emerald-900 leading-relaxed animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              <span>{msg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-2.5 text-sm font-bold tracking-wide rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Processing…</span>
              </>
            ) : isResetting ? (
              'Send Recovery Link'
            ) : (
              'Sign In to Adoptly'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        {isResetting ? (
          <button
            type="button"
            onClick={() => {
              setIsResetting(false)
              setErr('')
              setMsg('')
            }}
            className="mt-6 flex w-full items-center justify-center gap-1.5 text-xs font-bold text-forest hover:text-forest-dark transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </button>
        ) : (
          <p className="mt-6 text-center text-xs text-ink-muted">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="font-bold text-forest hover:text-forest-dark hover:underline"
            >
              Create an account
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
