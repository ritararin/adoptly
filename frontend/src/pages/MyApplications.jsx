import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MyApplications() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  const load = async () => {
    if (!user?.uid) return
    try {
      const [appsData, petsData] = await Promise.all([
        listApplications({ adopterId: user.uid }),
        listPets({ onlyAvailable: false }),
      ])
      const petsMap = Object.fromEntries(petsData.map(p => [p.id, p]))
      const enriched = appsData.map(a => ({
        ...a,
        pet: a.pet || petsMap[a.petId] || {
          name: a.petName,
          id: a.petId,
          breed: a.petBreed,
          photoUrl: a.petPhotoUrl,
          species: a.petSpecies,
        },
      }))
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
          <AnimatePresence>
            {apps.map((a, index) => {
              const meetLink = a.interviewLink || a.interview?.meetLink
              const interviewTime = a.interviewScheduledAt || a.interview?.date
              const { dateStr, relative } = formatInterviewBadge(interviewTime)

              const googleCalUrl = getGoogleCalendarUrl({
                title: `Adoptly Interview: ${a.petName}`,
                description: `Pre-adoption virtual verification interview for ${a.petName}.\n\nMeeting link: ${meetLink || 'TBD'}`,
                location: meetLink || '',
                dateTime: interviewTime || new Date().toISOString(),
                durationMinutes: 30,
                attendees: [user?.email, a.shelterEmail].filter(Boolean),
              })

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-[24px] border border-line/80 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-lift hover:border-forest/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-4">
                    <div className="flex items-center gap-3">
                      <PetHoverPreview pet={a.pet}>
                        <h3 className="font-serif text-xl font-bold text-ink-head hover:text-forest transition-colors cursor-pointer underline decoration-dotted decoration-forest/40 underline-offset-4">
                          {a.petName}
                        </h3>
                      </PetHoverPreview>
                      <StatusBadge status={a.status} size="xs" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cream-dim px-3 py-1 text-xs font-bold text-ink-muted">
                        Match Score: <strong className="text-forest">{a.score != null ? `${Math.round(a.score * 100)}%` : '—'}</strong>
                      </span>
                      {a.status === 'Pending Review' && (
                        <button
                          onClick={() => cancel(a.id)}
                          className="rounded-xl border border-line px-3 py-1 text-xs font-semibold text-ink-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors"
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
                              ? '30-minute video verification with shelter staff'
                              : 'Meeting confirmed. Shelter coordinator will post the live Google Meet link shortly.'}
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
                                className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-2.5 py-2 text-xs font-semibold text-ink-muted hover:text-forest transition-all"
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
                                description: `Virtual verification interview for ${a.petName}.${meetLink ? `\nMeeting Link: ${meetLink}` : ''}`,
                                location: meetLink || '',
                                dateTime: interviewTime,
                                durationMinutes: 30,
                                attendees: [user?.email, a.shelterEmail].filter(Boolean),
                                filename: `adoptly-interview-${a.petName?.toLowerCase() || 'pet'}.ics`,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                            title="Download .ics for Apple / Outlook"
                          >
                            <Download size={13} className="text-forest" />
                            <span>.ics</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer status / feedback */}
                  <div className="mt-4 flex items-center justify-between text-xs text-ink-whisper">
                    <span>
                      {a.decisionNotes
                        ? `Shelter notes: "${a.decisionNotes}"`
                        : a.status === 'Pending Review'
                        ? 'Under review by shelter staff.'
                        : ''}
                    </span>
                    <span>Application ID: {a.id?.slice(0, 8)}</span>
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
