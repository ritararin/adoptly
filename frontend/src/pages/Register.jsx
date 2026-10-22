import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PawPrint, UserRound, Mail, Lock, ArrowRight } from 'lucide-react'
import GoogleSignInButton from '../components/GoogleSignInButton'

export default function Register() {
  const { register } = useAuth(); const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = async e => {
    e.preventDefault()
    if (f.password.length < 8) return setErr('Password must be at least 8 characters.')
    setBusy(true); setErr('')
    try { await register(f.name, f.email, f.password); nav('/') }
    catch (x) { setErr(x.code === 'auth/email-already-in-use' ? 'That email is already registered.' : 'Could not create account.') }
    finally { setBusy(false) }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[24px] border border-line bg-white p-8 shadow-soft">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-forest text-gold">
            <PawPrint size={22} fill="currentColor" />
          </span>
          <span className="mt-4 font-serif text-2xl font-semibold tracking-[-0.03em] text-forest">adoptly</span>
          <h1 className="mt-3 h-serif text-xl">Create your account</h1>
          <p className="mt-1 text-xs text-ink-muted">Join Adoptly and find your new best friend.</p>
        </div>

        {/* ---- Google Sign-Up ---- */}
        <GoogleSignInButton label="Sign up with Google" onSuccess={() => nav('/')} />

        {/* ---- Divider ---- */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-line"></div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-whisper">or</span>
          <div className="h-px flex-1 bg-line"></div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <div className="relative">
              <UserRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-whisper" />
              <input className="input pl-9" required value={f.name} onChange={set('name')} placeholder="Jane Doe" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-whisper" />
              <input className="input pl-9" type="email" required value={f.email} onChange={set('email')} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-whisper" />
              <input className="input pl-9" type="password" required value={f.password} onChange={set('password')} placeholder="At least 8 characters" />
            </div>
          </div>
          {err && <p className="rounded-lg bg-terracotta/10 px-3 py-2 text-xs font-medium text-terracotta-deep">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Creating…' : <>Register <ArrowRight size={15} /></>}
          </button>
          <p className="rounded-lg bg-forest-wash px-3 py-2 text-[11px] leading-4 text-ink-muted">
            Shelter staff are identified automatically by their verified email domain.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Already registered? <Link to="/login" className="font-bold text-forest hover:text-forest-dark">Login here</Link>
        </p>
      </form>
    </div>
  )
}