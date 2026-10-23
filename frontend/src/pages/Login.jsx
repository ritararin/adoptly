import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PawPrint, Mail, Lock, ArrowRight } from 'lucide-react'
import GoogleSignInButton from '../components/GoogleSignInButton'

export default function Login() {
  const { login } = useAuth(); const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await login(f.email, f.password); nav('/') } catch { setErr('Invalid email or password.') } finally { setBusy(false) }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[24px] border border-line bg-white p-8 shadow-soft">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-forest text-gold">
            <PawPrint size={22} fill="currentColor" />
          </span>
          <span className="mt-4 font-serif text-2xl font-semibold tracking-[-0.03em] text-forest">adoptly</span>
          <h1 className="mt-3 h-serif text-xl">Welcome back</h1>
          <p className="mt-1 text-xs text-ink-muted">Log in to continue finding your perfect match.</p>
        </div>

        {/* ---- Google Sign-In ---- */}
        <GoogleSignInButton onSuccess={() => nav('/')} />

        {/* ---- Divider ---- */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-line"></div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-whisper">or</span>
          <div className="h-px flex-1 bg-line"></div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-whisper" />
              <input className="input pl-9" type="email" required value={f.email}
                onChange={e => setF({ ...f, email: e.target.value })} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-whisper" />
              <input className="input pl-9" type="password" required value={f.password}
                onChange={e => setF({ ...f, password: e.target.value })} placeholder="••••••••" />
            </div>
          </div>
          {err && <p className="rounded-lg bg-terracotta/10 px-3 py-2 text-xs font-medium text-terracotta-deep">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Logging in…' : <>Login <ArrowRight size={15} /></>}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          No account? <Link to="/register" className="font-bold text-forest hover:text-forest-dark">Register here</Link>
        </p>
      </form>
    </div>
  )
}