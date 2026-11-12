import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listApplications, listPets, updateApplication } from '../lib/api'
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
  formatInterviewBadge,
} from '../lib/calendar'
import StatusBadge from '../components/StatusBadge'
import PetHoverPreview from '../components/PetHoverPreview'
import {
  CalendarClock,
  PawPrint,
  Video,
  ExternalLink,
  CalendarPlus,
  Download,
  Copy,
  Check,
  Clock,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MyApplications() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const load = async () => {
    if (!user?.uid) return
    try {
      const [appsData, petsData] = await Promise.all([
        listApplications({ adopterId: user.uid }),
        listPets({ onlyAvailable: false }),
      ])
      const petsMap = Object.fromEntries(petsData.map(p => [p.id, p]))

      const getAppTimestamp = (a) => {
        if (a.submittedDate?.toMillis) return a.submittedDate.toMillis()
        if (a.submittedDate?.seconds) return a.submittedDate.seconds * 1000
        if (a.submittedDate) {
          const t = new Date(a.submittedDate).getTime()
          if (!isNaN(t)) return t
        }
        if (a.createdAt?.toMillis) return a.createdAt.toMillis()
        if (a.createdAt?.seconds) return a.createdAt.seconds * 1000
        if (a.createdAt) {
          const t = new Date(a.createdAt).getTime()
          if (!isNaN(t)) return t
        }
        return 0
      }

      const formatSubmittedDate = (dateVal) => {
        if (!dateVal) return ''
        try {
          let d
          if (dateVal.toDate) d = dateVal.toDate()
          else if (dateVal.seconds) d = new Date(dateVal.seconds * 1000)
          else d = new Date(dateVal)
          if (isNaN(d.getTime())) return ''
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        } catch {
          return ''
        }
      }

      const enriched = appsData.map(a => {
        const matchedPet = petsMap[a.petId] || {}
        const pet = a.pet || matchedPet || {
          name: a.petName,
          id: a.petId,
          breed: a.petBreed,
          photoUrl: a.petPhotoUrl,
          species: a.petSpecies,
        }

        const shelterLocation =
          a.shelterLocation ||
          pet.shelterLocation ||
          pet.location ||
          matchedPet.shelterLocation ||
          matchedPet.location ||
          (a.shelterEmail?.includes('strathmore') || pet.shelterEmail?.includes('strathmore')
            ? 'Nairobi - Strathmore Hub'
            : 'Nairobi - Central Shelter')

        const shelterName =
          a.shelterName ||
          pet.shelterName ||
          matchedPet.shelterName ||
          (a.shelterEmail?.includes('strathmore') || pet.shelterEmail?.includes('strathmore')
            ? 'Strathmore Animal Sanctuary'
            : 'Adoptly Rescue Center')

        const dateStr = formatSubmittedDate(a.submittedDate || a.createdAt)

        return {
          ...a,
          shelterLocation,
          shelterName,
          submittedDateStr: dateStr,
          timestamp: getAppTimestamp(a),
          pet: {
            ...matchedPet,
            ...pet,
            location: shelterLocation,
            shelterLocation,
            shelterName,
          },
        }
      })

      // Sort descending by most recent adoption attempt first
      enriched.sort((a, b) => b.timestamp - a.timestamp)
      setApps(enriched)
    } catch (e) {
      console.warn('Could not enrich applications with pets:', e)
      const appsData = await listApplications({ adopterId: user.uid })
      setApps(appsData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.uid])

  const cancel = async (id) => {
    await updateApplication(id, { status: 'Cancelled' })
    load()
  }

  const handleCopyLink = (appId, link) => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopiedId(appId)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const hasMore = apps.length > 5
  const displayedApps = (!hasMore || isExpanded) ? apps : apps.slice(0, 5)

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-forest">
        <Loader2 className="animate-spin text-forest" size={36} />
        <p className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          Loading your applications…
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest-wash/80 px-3 py-1 text-xs font-bold text-forest shadow-2xs backdrop-blur-xs">
          <Sparkles size={13} className="text-forest animate-pulse" />
          <span>Adopter Journey</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-head sm:text-4xl">
          My Applications
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Track the status of every pet you have applied for, access your virtual verification interviews,
          and add appointments to your personal calendar.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-white p-12 text-center shadow-soft">
          <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-forest-wash text-forest shadow-sm">
            <PawPrint size={36} />
          </div>
          <h3 className="mt-6 font-serif text-2xl font-bold text-ink-head">
            No applications yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted leading-relaxed">
            Browse through our available pets in the Match Dashboard to discover compatible companions and submit an application.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Activity & Expansion Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/80 bg-white px-5 py-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
              <Clock size={15} className="text-forest" />
              <span>
                {hasMore && !isExpanded ? (
                  <>
                    Showcasing <strong className="text-ink-head">5 most recent</strong> of{' '}
                    <strong className="text-ink-head">{apps.length}</strong> adoption attempts
                  </>
                ) : (
                  <>
                    Showing all <strong className="text-ink-head">{apps.length}</strong> adoption attempt{apps.length === 1 ? '' : 's'}
                  </>
                )}
              </span>
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-forest/20 bg-forest-wash px-3.5 py-1.5 text-xs font-bold text-forest hover:bg-forest hover:text-white transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                {isExpanded ? (
                  <>
                    <span>Show 5 most recent</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>View all {apps.length} attempts</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* List of Applications */}
          <AnimatePresence>
            {displayedApps.map((a, index) => {
              const meetLink = a.interviewLink || a.interview?.meetLink
              const interviewTime = a.interviewScheduledAt || a.interview?.date
              const { dateStr, relative } = formatInterviewBadge(interviewTime)

              const googleCalUrl = getGoogleCalendarUrl({
                title: `Adoptly Interview: ${a.petName}`,
                description: `Pre-adoption virtual verification interview for ${a.petName}.\n\nMeeting link: ${meetLink || 'TBD'}\nShelter: ${a.shelterName || 'Shelter'} (${a.shelterLocation || 'Location TBD'})`,
                location: meetLink || a.shelterLocation || '',
                dateTime: interviewTime || new Date().toISOString(),
                durationMinutes: 30,
                attendees: [user?.email, a.shelterEmail].filter(Boolean),
              })

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-[24px] border border-line/80 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-lift hover:border-forest/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <PetHoverPreview pet={a.pet}>
                          <Link
                            to={`/pets/${a.petId || a.pet?.id}`}
                            title={`View ${a.petName}'s profile`}
                            className="group/petlink block"
                          >
                            <h3 className="font-serif text-xl font-bold text-ink-head group-hover/petlink:text-forest hover:text-forest transition-colors cursor-pointer underline decoration-dotted decoration-forest/40 underline-offset-4">
                              {a.petName}
                            </h3>
                          </Link>
                        </PetHoverPreview>
                        <StatusBadge status={a.status} size="xs" />
                      </div>

                      {/* Shelter Name & Location Specification Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-md border border-line bg-cream-soft px-2.5 py-0.5 font-semibold text-ink-head">
                          <Building2 size={12} className="text-forest" />
                          <span>{a.shelterName}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-forest/20 bg-forest-wash px-2.5 py-0.5 font-bold text-forest">
                          <MapPin size={12} className="text-forest" />
                          <span>{a.shelterLocation}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cream-dim px-3 py-1 text-xs font-bold text-ink-muted">
                        Match Score: <strong className="text-forest">{a.score != null ? `${Math.round(a.score * 100)}%` : '—'}</strong>
                      </span>
                      {a.status === 'Pending Review' && (
                        <button
                          onClick={() => cancel(a.id)}
                          className="rounded-xl border border-line px-3 py-1 text-xs font-semibold text-ink-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* If Interview Scheduled: Prominent Calendar & Meet Hub */}
                  {a.status === 'Interview Scheduled' && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                          <Video size={14} /> Virtual Pre-Adoption Interview
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px]">
                          {relative || 'Upcoming'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-serif text-base font-bold text-ink-head">
                            {dateStr}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {meetLink
                              ? `30-minute video verification with ${a.shelterName} (${a.shelterLocation})`
                              : `Meeting confirmed. ${a.shelterName} coordinator will post the live Google Meet link shortly.`}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {meetLink ? (
                            <>
                              <a
                                href={meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-bold text-cream shadow-sm hover:bg-forest-dark transition-all"
                              >
                                <Video size={14} />
                                <span>Join Google Meet</span>
                                <ExternalLink size={12} className="opacity-80" />
                              </a>

                              <button
                                type="button"
                                onClick={() => handleCopyLink(a.id, meetLink)}
                                className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-2.5 py-2 text-xs font-semibold text-ink-muted hover:text-forest transition-all cursor-pointer"
                                title="Copy Meet link"
                              >
                                {copiedId === a.id ? (
                                  <Check size={13} className="text-forest" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                              Link pending shelter setup
                            </span>
                          )}

                          <a
                            href={googleCalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                            title="Add to Google Calendar"
                          >
                            <CalendarPlus size={13} className="text-forest" />
                            <span>Google Cal</span>
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              downloadIcsFile({
                                title: `Adoptly Interview: ${a.petName}`,
                                description: `Virtual verification interview for ${a.petName} with ${a.shelterName}.${meetLink ? `\nMeeting Link: ${meetLink}` : ''}\nLocation: ${a.shelterLocation || 'Online'}`,
                                location: meetLink || a.shelterLocation || '',
                                dateTime: interviewTime,
                                durationMinutes: 30,
                                attendees: [user?.email, a.shelterEmail].filter(Boolean),
                                filename: `adoptly-interview-${a.petName?.toLowerCase() || 'pet'}.ics`,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-ink-head hover:border-forest hover:text-forest transition-all cursor-pointer"
                            title="Download .ics for Apple / Outlook"
                          >
                            <Download size={13} className="text-forest" />
                            <span>.ics</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer status, date & notes */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-whisper">
                    <div className="flex flex-wrap items-center gap-3">
                      {a.submittedDateStr && (
                        <span className="inline-flex items-center gap-1 text-ink-muted">
                          <CalendarClock size={12} className="text-forest" />
                          <span>Submitted: <strong>{a.submittedDateStr}</strong></span>
                        </span>
                      )}
                      <span>
                        {a.decisionNotes
                          ? `Shelter notes: "${a.decisionNotes}"`
                          : a.status === 'Pending Review'
                          ? 'Under review by shelter staff.'
                          : ''}
                      </span>
                    </div>
                    <span>Application ID: {a.id?.slice(0, 8)}</span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Bottom Expand / Collapse Button if > 5 items */}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-6 py-3 text-xs font-bold text-ink-head shadow-soft hover:border-forest/40 hover:text-forest hover:shadow-lift transition-all cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={16} className="text-forest" />
                    <span>Collapse to 5 most recent adoption attempts</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} className="text-forest" />
                    <span>Expand to view all {apps.length} adoption attempts (+{apps.length - 5} more)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
