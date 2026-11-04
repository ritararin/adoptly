import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUnreadNotifications } from '../lib/useUnreadNotifications'
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Bell,
  PawPrint,
  User,
  FileText,
  LogOut,
  ClipboardList,
  ShieldCheck,
  Heart,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { hasUnread, unreadCount } = useUnreadNotifications(user)

  // Persist collapsed state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('adoptly_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('adoptly_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  const isShelter = user?.role === 'shelter'

  // 1. ADOPTER MENU
  const adopterNav = [
    {
      title: 'Discovery',
      items: [
        { label: 'Match Dashboard', path: '/matches', icon: LayoutDashboard },
        { label: 'My Lifestyle Profile', path: '/profile', icon: User },
      ],
    },
    {
      title: 'Adoption Pipeline',
      items: [
        { label: 'My Applications', path: '/my-applications', icon: FileText },
        { label: 'Interview Schedule', path: '/interviews', icon: Calendar },
      ],
    },
    {
      title: 'Activity',
      items: [
        { label: 'Notifications', path: '/notifications', icon: Bell, isNotification: true },
      ],
    },
  ]

  // 2. SHELTER MENU
  const shelterNav = [
    {
      title: 'Shelter Workspace',
      items: [
        { label: 'Pet Listings', path: '/shelter/listings', icon: PawPrint },
        { label: 'Review Applications', path: '/shelter/applications', icon: ClipboardList },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Verification',
      items: [
        { label: 'Interview Schedule', path: '/interviews', icon: Calendar },
        { label: 'Notifications', path: '/notifications', icon: Bell, isNotification: true },
      ],
    },
  ]

  const navGroups = isShelter ? shelterNav : adopterNav
  const userInitial = (user?.name || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-line/80 bg-white/95 py-6 shrink-0 backdrop-blur-md transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20 px-2' : 'w-64 px-4'
      }`}
    >
      {/* Brand Header & Toggle */}
      <div className={`mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
        <Link to="/" className="flex items-center gap-3 group" title="Adoptly Home">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forest to-forest-dark text-gold shadow-md shadow-forest/20 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-forest/30">
            <PawPrint size={20} fill="currentColor" />
          </div>
          {!isCollapsed && (
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold tracking-tight text-forest block leading-none">
                adoptly
              </span>
              <span className="size-1.5 rounded-full bg-gold" />
            </div>
          )}
        </Link>

        {/* Retractable Sidebar Toggle Button */}
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            title="Collapse sidebar"
            className="flex size-7 items-center justify-center rounded-lg border border-line text-ink-muted hover:bg-cream-soft hover:text-forest transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Retractable Toggle Button when Collapsed */}
      {isCollapsed && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={toggleCollapse}
            title="Expand sidebar"
            className="flex size-8 items-center justify-center rounded-xl border border-line bg-cream-soft text-ink-muted hover:bg-forest-wash hover:text-forest transition-colors shadow-2xs"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-6 overflow-y-auto pr-0.5">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            {!isCollapsed && (
              <p className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-whisper">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map(item => {
                const isActive = location.pathname === item.path
                const showNotifDot = item.isNotification && hasUnread

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      className="block relative group"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav"
                          className="absolute inset-0 rounded-xl bg-forest-wash/90 border border-forest/10"
                          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                        />
                      )}
                      <div
                        className={`relative flex items-center rounded-xl py-2.5 text-xs font-bold transition-all ${
                          isCollapsed
                            ? 'justify-center px-0'
                            : 'gap-3 px-3'
                        } ${
                          isActive
                            ? 'text-forest font-bold shadow-2xs'
                            : 'text-ink-muted hover:text-forest-dark hover:bg-cream-soft'
                        }`}
                      >
                        <div className="relative shrink-0 flex items-center justify-center">
                          <item.icon
                            size={18}
                            className={isActive ? 'text-forest' : 'text-ink-faint'}
                          />
                          {/* Unread Dot for Collapsed Mode */}
                          {isCollapsed && showNotifDot && (
                            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                          )}
                        </div>

                        {!isCollapsed && (
                          <>
                            <span className="truncate">{item.label}</span>

                            {/* Unread Indicator for Expanded Mode */}
                            {showNotifDot && (
                              <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {unreadCount > 0 && <span>{unreadCount}</span>}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile & Logout Bottom Bar */}
      <div className="mt-auto border-t border-line-soft pt-4">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              title={`${user?.name || user?.email || 'User'} (${isShelter ? 'Shelter' : 'Adopter'})`}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-forest text-cream font-bold text-xs shadow-2xs"
            >
              {userInitial}
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="flex size-8 items-center justify-center rounded-xl text-ink-whisper hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-line-soft bg-cream-soft/60 p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-forest text-cream font-bold text-xs shadow-2xs">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink-head leading-tight">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {isShelter ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded-md">
                      <ShieldCheck size={10} /> Shelter
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest bg-forest-tint px-1.5 py-0.2 rounded-md">
                      <Heart size={10} /> Adopter
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Log out"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl text-ink-whisper hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
