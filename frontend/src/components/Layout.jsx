import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, UserRound, ClipboardList, PawPrint, ShieldCheck, LogOut } from 'lucide-react'

const NAV = {
  adopter: [
    { to: '/matches',          label: 'Match Dashboard', icon: LayoutDashboard },
    { to: '/profile',          label: 'My Profile',      icon: UserRound },
    { to: '/my-applications',  label: 'My Applications', icon: ClipboardList }
  ],
  shelter: [
    { to: '/shelter/listings',     label: 'Shelter Admin', icon: PawPrint },
    { to: '/shelter/applications', label: 'Review Tasks',  icon: ClipboardList }
  ],
  admin: [
    { to: '/admin', label: 'Administration', icon: ShieldCheck }
  ]
}

export default function Layout() {
  const { user, logout } = useAuth()
  const initials = (user.name || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-line bg-cream-soft px-5 py-7 md:flex">
        <div className="flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-forest text-gold">
            <PawPrint size={20} fill="currentColor" />
          </span>
          <span className="font-serif text-[22px] font-semibold tracking-[-0.04em] text-forest">adoptly</span>
        </div>

        <p className="mt-12 px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">Workspace</p>
        <nav className="flex flex-1 flex-col gap-2">
          {NAV[user.role].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${
                  isActive ? 'bg-forest-tint text-forest' : 'text-ink-muted hover:bg-cream-dim'
                }`}>
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-terracotta text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
              <p className="text-[10px] capitalize text-ink-faint">{user.role}</p>
            </div>
          </div>
          <button onClick={logout}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold text-ink-muted hover:bg-cream-dim">
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center border-b border-line bg-cream-soft px-5 sm:px-8 lg:px-12">
          <div className="hidden items-center gap-2 text-xs text-ink-faint sm:flex">
            <span>{today}</span>
            <span className="mx-1 text-line">/</span>
            <span className="font-medium text-ink-muted">Nairobi, Kenya</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-11">
          <Outlet />
        </main>
      </div>
    </div>
  )
}