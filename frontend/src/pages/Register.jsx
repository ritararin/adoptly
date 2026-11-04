import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  PawPrint,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-line' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' }
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' }
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-emerald-500' }
  return { score: 4, label: 'Strong', color: 'bg-emerald-600' }
}

export default function Register() {
  const { register, loginWithGoogle } = useAuth()
  const nav = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const passwordStrength = getPasswordStrength(form.password)

  const submit = async e => {
    e.preventDefault()
    setErr('')
    setMsg('')

    if (form.name.trim().length < 2) {
      setErr('Please enter your full name.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) {
      setErr('Please enter a valid email address (e.g. name@example.com).')
      return
    }

    if (form.password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }

    setBusy(true)

    try {
      const result = await register(
        form.name,
        form.email,
        form.password
      )

      setMsg(
        `We sent a verification link to ${result.email}. ` +
        'Open that email, click the link to confirm your account, then log in. ' +
        'Be sure to check your spam folder if you do not see it.'
      )

      setForm({ name: '', email: '', password: '' })
    } catch (error) {
      console.error('Registration failed:', error)

      const messages = {
        'auth/email-already-in-use':
          'An account already exists with this email. Try logging in instead.',
        'auth/invalid-email':
          'Please enter a valid email address.',
        'auth/weak-password':
          'Please choose a stronger password with at least 8 characters.',
        'auth/operation-not-allowed':
          'Email/password registration is not enabled in Firebase.',
        'auth/too-many-requests':
          'Too many attempts. Please try again later.',
        'auth/network-request-failed':
          'Network error. Please check your internet connection.',
      }

      setErr(
        messages[error.code] ||
        'Could not create your account or send the verification email. Please try again.'
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
      console.error('Google registration failed:', error)

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
          'An account already exists with this email. Please log in using that method.',
        'auth/email-not-verified':
          'Google could not confirm that this email address is verified.',
      }

      setErr(
        messages[error.code] ||
        'Google sign-up failed. Please try again.'
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
            Create your account
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Discover companions suited to your daily routine, home space, and family
          </p>
        </div>

        {/* Google Sign-in Option */}
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
            or register with email
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Full name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input
                className="input pl-10 pr-4 py-2.5 w-full rounded-xl border border-line bg-cream-soft/40 focus:bg-white focus:border-forest focus:ring-4 focus:ring-forest/10 transition-all text-sm font-medium text-ink"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                required
                minLength={2}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input
                className="input pl-10 pr-10 py-2.5 w-full rounded-xl border border-line bg-cream-soft/40 focus:bg-white focus:border-forest focus:ring-4 focus:ring-forest/10 transition-all text-sm font-medium text-ink"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
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

            {/* Real-time Password Strength Meter */}
            {form.password && (
              <div className="mt-2 space-y-1.5 animate-in fade-in">
                <div className="flex gap-1.5 h-1">
                  {[1, 2, 3, 4].map(idx => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        idx <= passwordStrength.score ? passwordStrength.color : 'bg-line'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-muted">Password strength</span>
                  <span className={`font-semibold ${
                    passwordStrength.score <= 1 ? 'text-rose-600' :
                    passwordStrength.score === 2 ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

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
                <span>Creating your account…</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-forest hover:text-forest-dark hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
