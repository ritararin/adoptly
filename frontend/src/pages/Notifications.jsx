import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listApplications, listPets, getAdopterProfile } from '../lib/api'
import {
  Bell,
  CheckCircle2,
  FileText,
  Video,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Info,
  Calendar,
  CheckCheck,
  ChevronRight,
  Clock,
  Loader2,
  Heart,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Notifications() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'interviews' | 'applications' | 'unread'
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`adoptly_read_notifs_${user?.uid}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const isShelter = user?.role === 'shelter'

  useEffect(() => {
    if (!user?.uid) return

    const loadNotifications = async () => {
      try {
        const notifs = []

        if (isShelter) {
          // ---------- SHELTER NOTIFICATIONS ----------
          const [apps, pets] = await Promise.all([
            listApplications({ shelterId: user.uid }).catch(() => []),
            listPets({ shelterId: user.uid }).catch(() => []),
          ])

          // 1. Pending applications needing review
          const pendingApps = apps.filter(a => a.status === 'Pending Review')
          pendingApps.forEach(a => {
            notifs.push({
              id: `app-pending-${a.id}`,
              category: 'applications',
              title: `New Application: ${a.adopterName || 'Applicant'}`,
              message: `Submitted an adoption application for “${a.petName}”. Review match breakdown and lifestyle compatibility.`,
              time: a.submittedDate ? new Date(a.submittedDate.seconds ? a.submittedDate.seconds * 1000 : a.submittedDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently',
              type: 'urgent',
              icon: FileText,
              iconColor: 'bg-amber-100 text-amber-800 border-amber-200',
              actionLabel: 'Review Application',
              onAction: () => nav(`/shelter/applications/${a.id}`),
            })
          })

          // 2. Scheduled virtual interviews
          const scheduledApps = apps.filter(
            a => a.status === 'Interview Scheduled' && (a.interviewScheduledAt || a.interview?.date)
          )
          scheduledApps.forEach(a => {
            const timeStr = new Date(a.interviewScheduledAt || a.interview?.date).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
            const meetLink = a.interviewLink || a.interview?.meetLink

            notifs.push({
              id: `interview-${a.id}`,
              category: 'interviews',
              title: `Interview Scheduled: ${a.petName}`,
              message: `Virtual verification with ${a.adopterName || 'applicant'} scheduled for ${timeStr}.`,
              time: 'Upcoming',
              type: 'interview',
              icon: Video,
              iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              actionLabel: 'Join Google Meet',
              meetLink,
              secondaryActionLabel: 'View Schedule',
              onSecondary: () => nav('/interviews'),
            })
          })

          // 3. Adopted pets milestones
          const adoptedPets = pets.filter(p => p.adoptionStatus === 'Adopted')
          if (adoptedPets.length > 0) {
            notifs.push({
              id: 'shelter-milestone-adopted',
              category: 'system',
              title: 'Adoption Milestone Reached',
              message: `Congratulations! Your shelter has successfully found forever homes for ${adoptedPets.length} pet${adoptedPets.length === 1 ? '' : 's'}.`,
              time: 'Milestone',
              type: 'success',
              icon: CheckCircle2,
              iconColor: 'bg-forest text-cream border-forest-dark',
              actionLabel: 'View Listings',
              onAction: () => nav('/shelter/listings'),
            })
          }

          // 4. Missing traits inspection
          const unratedPets = pets.filter(
            p => p.adoptionStatus === 'Available' && (!p.energyLevel || !p.childFriendly)
          )
          if (unratedPets.length > 0) {
            notifs.push({
              id: 'shelter-unrated-pets',
              category: 'system',
              title: 'Ratings Recommended for ML Matching',
              message: `${unratedPets.length} pet listing(s) are missing shelter ratings for energy level or child-friendliness. Complete them for accurate AI recommendations.`,
              time: 'Optimization',
              type: 'warning',
              icon: AlertTriangle,
              iconColor: 'bg-gold-soft text-gold-ink border-gold/40',
              actionLabel: 'Update Listings',
              onAction: () => nav('/shelter/listings'),
            })
          }
        } else {
          // ---------- ADOPTER NOTIFICATIONS ----------
          const [apps, profile] = await Promise.all([
            listApplications({ adopterId: user.uid }).catch(() => []),
            getAdopterProfile(user.uid).catch(() => null),
          ])

          // 1. Scheduled interviews for applicant
          const scheduledApps = apps.filter(
            a => a.status === 'Interview Scheduled' && (a.interviewScheduledAt || a.interview?.date)
          )
          scheduledApps.forEach(a => {
            const timeStr = new Date(a.interviewScheduledAt || a.interview?.date).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
            const meetLink = a.interviewLink || a.interview?.meetLink

            notifs.push({
              id: `adopter-interview-${a.id}`,
              category: 'interviews',
              title: `Interview Confirmed for ${a.petName}!`,
              message: `The shelter scheduled your virtual pre-adoption interview for ${timeStr}. Join via Google Meet.`,
              time: 'Scheduled',
              type: 'interview',
              icon: Video,
              iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              actionLabel: 'Join Google Meet',
              meetLink,
              secondaryActionLabel: 'View Details',
              onSecondary: () => nav('/my-applications'),
            })
          })

          // 2. Application status updates
          apps.forEach(a => {
            if (a.status === 'Adoption Completed') {
              notifs.push({
                id: `adopter-completed-${a.id}`,
                category: 'applications',
                title: `Adoption Approved for ${a.petName}!`,
                message: `Congratulations! Your adoption for ${a.petName} has been confirmed by the shelter.`,
                time: 'Approved',
                type: 'success',
                icon: Heart,
                iconColor: 'bg-forest text-cream border-forest-dark',
                actionLabel: 'View Applications',
                onAction: () => nav('/my-applications'),
              })
            } else if (a.status === 'Pending Review') {
              notifs.push({
                id: `adopter-pending-${a.id}`,
                category: 'applications',
                title: `Application Received: ${a.petName}`,
                message: 'Your application is currently being reviewed by shelter staff. You will be notified as soon as an interview is scheduled.',
                time: 'In Review',
                type: 'info',
                icon: Clock,
                iconColor: 'bg-cream-dim text-ink-muted border-line',
                actionLabel: 'Check Status',
                onAction: () => nav('/my-applications'),
              })
            }
          })

          // 3. Profile questionnaire check
          if (!profile || !profile.housingSpace) {
            notifs.push({
              id: 'adopter-profile-prompt',
              category: 'system',
              title: 'Complete Your Lifestyle Profile',
              message: 'Add your housing type, daily care availability, and activity level to unlock AI compatibility matching.',
              time: 'Action Required',
              type: 'urgent',
              icon: Sparkles,
              iconColor: 'bg-amber-100 text-amber-800 border-amber-200',
              actionLabel: 'Complete Profile',
              onAction: () => nav('/profile'),
            })
          } else {
            notifs.push({
              id: 'adopter-matches-ready',
              category: 'system',
              title: 'AI Matches Ready for You',
              message: 'Your lifestyle profile is active! View your ranked pet recommendations and SHAP feature breakdowns.',
              time: 'Discovery',
              type: 'info',
              icon: Sparkles,
              iconColor: 'bg-forest-wash text-forest border-forest/20',
              actionLabel: 'Explore Matches',
              onAction: () => nav('/matches'),
            })
          }
        }

        // Welcome / General info
        notifs.push({
          id: 'system-welcome',
          category: 'system',
          title: 'Welcome to Adoptly 2.0',
          message: 'Powered by a 100-tree Random Forest compatibility engine with strict child-safety guarantees and virtual Google Meet verification.',
          time: 'System',
          type: 'info',
          icon: Info,
          iconColor: 'bg-cream-soft text-ink-muted border-line',
        })

        setNotifications(notifs)
      } catch (error) {
        console.error('Failed to load notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user?.uid, isShelter])

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(allIds)
    try {
      localStorage.setItem(`adoptly_read_notifs_${user?.uid}`, JSON.stringify(allIds))
    } catch {}
  }

  const markSingleAsRead = (id) => {
    if (readIds.includes(id)) return
    const updated = [...readIds, id]
    setReadIds(updated)
    try {
      localStorage.setItem(`adoptly_read_notifs_${user?.uid}`, JSON.stringify(updated))
    } catch {}
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !readIds.includes(n.id)
    if (filter === 'interviews') return n.category === 'interviews'
    if (filter === 'applications') return n.category === 'applications'
    return true
  })

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-forest">
        <Loader2 className="animate-spin text-forest" size={36} />
        <p className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          Loading your notifications…
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest-wash/80 px-3 py-1 text-xs font-bold text-forest shadow-2xs backdrop-blur-xs">
            <Bell size={13} className="text-forest animate-pulse" />
            <span>Activity Center</span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-head sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-ink-muted max-w-xl">
            Real-time updates on pre-adoption interviews, application reviews, and compatibility alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-forest hover:bg-forest-wash hover:border-forest/30 transition-all shadow-2xs sm:self-auto"
          >
            <CheckCheck size={14} />
            <span>Mark all as read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Updates', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          {
            id: 'interviews',
            label: 'Interviews',
            count: notifications.filter(n => n.category === 'interviews').length,
          },
          {
            id: 'applications',
            label: 'Applications',
            count: notifications.filter(n => n.category === 'applications').length,
          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              filter === tab.id
                ? 'bg-forest text-cream shadow-sm'
                : 'border border-line bg-white text-ink-muted hover:text-forest hover:border-forest/30'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  filter === tab.id
                    ? 'bg-cream/20 text-cream'
                    : 'bg-cream-dim text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification Stream */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-[24px] border border-line bg-white p-12 text-center shadow-soft">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-forest-wash text-forest mb-4">
            <CheckCheck size={28} />
          </div>
          <h3 className="font-serif text-xl font-bold text-ink-head">You are all caught up!</h3>
          <p className="mt-1 text-xs text-ink-muted">
            No notifications matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notif, index) => {
              const isRead = readIds.includes(notif.id)

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => markSingleAsRead(notif.id)}
                  className={`group relative flex flex-col justify-between gap-4 rounded-[22px] border p-5 shadow-soft transition-all sm:flex-row sm:items-center ${
                    isRead
                      ? 'border-line/70 bg-white/70 opacity-80'
                      : 'border-forest/25 bg-white shadow-lift'
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-2xs ${notif.iconColor}`}
                    >
                      <notif.icon size={20} />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base font-bold text-ink-head">
                          {notif.title}
                        </h4>
                        {!isRead && (
                          <span className="size-2 shrink-0 rounded-full bg-forest animate-pulse" />
                        )}
                        <span className="rounded-full bg-cream-dim px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed max-w-2xl">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Action Suite */}
                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                    {notif.meetLink && (
                      <a
                        href={notif.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-2 text-xs font-bold text-cream shadow-sm hover:bg-forest-dark transition-all"
                      >
                        <Video size={13} />
                        <span>Join Meet</span>
                        <ExternalLink size={11} className="opacity-75" />
                      </a>
                    )}

                    {notif.onAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markSingleAsRead(notif.id)
                          notif.onAction()
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                      >
                        <span>{notif.actionLabel}</span>
                        <ChevronRight size={13} />
                      </button>
                    )}

                    {notif.onSecondary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markSingleAsRead(notif.id)
                          notif.onSecondary()
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-line bg-cream-soft px-3 py-2 text-xs font-bold text-ink-muted hover:text-forest transition-all"
                      >
                        <span>{notif.secondaryActionLabel}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
