import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listApplications, listPets, updateApplication, updatePet, updateInterviewLink } from '../lib/api'
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
  getMailtoInviteUrl,
  formatInterviewBadge,
} from '../lib/calendar'
import StatusBadge from '../components/StatusBadge'
import PetHoverPreview from '../components/PetHoverPreview'
import {
  Calendar,
  Video,
  ExternalLink,
  Loader2,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Mail,
  Download,
  CalendarPlus,
  Sparkles,
  Edit2,
  AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InterviewSchedule() {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [editingAppId, setEditingAppId] = useState(null)
  const [editingLinkValue, setEditingLinkValue] = useState('')
  const [savingLinkId, setSavingLinkId] = useState(null)

  const isShelter = user?.role === 'shelter'

  const fetchInterviews = async () => {
    try {
      const filters = isShelter ? { shelterId: user.uid } : { adopterId: user.uid }
      const [apps, allPets] = await Promise.all([
        listApplications(filters),
        listPets({ onlyAvailable: false }).catch(() => [])
      ])
      const petsMap = Object.fromEntries(allPets.map(p => [p.id, p]))

      // Keep applications that have an interview scheduled
      const scheduled = apps.filter(
        a => a.status === 'Interview Scheduled' && (a.interviewScheduledAt || a.interview?.date)
      ).map(a => ({
        ...a,
        pet: a.pet || petsMap[a.petId] || { name: a.petName, id: a.petId }
      }))

      scheduled.sort((a, b) => {
        const timeA = new Date(a.interviewScheduledAt || a.interview?.date).getTime()
        const timeB = new Date(b.interviewScheduledAt || b.interview?.date).getTime()
        return timeA - timeB
      })

      setInterviews(scheduled)
    } catch (error) {
      console.error('Failed to load interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.uid) return
    fetchInterviews()
  }, [user])

  const finishInterview = async (appId, petId, isSuccess) => {
    setUpdatingId(appId)
    try {
      const newAppStatus = isSuccess ? 'Adoption Completed' : 'Failed Adoption'
      const newPetStatus = isSuccess ? 'Adopted' : 'Available'

      await updateApplication(appId, {
        status: newAppStatus,
        decisionDate: new Date().toISOString(),
      })

      if (petId) {
        await updatePet(petId, { adoptionStatus: newPetStatus })
      }

      fetchInterviews()
    } catch (error) {
      console.error('Failed to update interview:', error)
      alert('Could not update the interview status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSaveInterviewLink = async (appId) => {
    setSavingLinkId(appId)
    try {
      await updateInterviewLink(appId, editingLinkValue)
      setEditingAppId(null)
      await fetchInterviews()
    } catch (err) {
      console.error('Failed to update interview link:', err)
      alert('Could not save meeting link: ' + err.message)
    } finally {
      setSavingLinkId(null)
    }
  }

  const handleCopyLink = (appId, link) => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopiedId(appId)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleDownloadIcs = (app) => {
    const dateTime = app.interviewScheduledAt || new Date().toISOString()
    const attendees = [app.adopterEmail, user?.email].filter(Boolean)
    downloadIcsFile({
      title: `Adoptly Interview: ${app.petName}`,
      description: `Pre-adoption virtual interview for ${app.petName}.\nMeeting Link: ${app.interviewLink || 'TBD'}`,
      location: app.interviewLink || '',
      dateTime,
      durationMinutes: 30,
      attendees,
      filename: `adoptly-interview-${app.petName?.toLowerCase() || 'pet'}.ics`,
    })
  }

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-forest">
        <Loader2 className="animate-spin text-forest" size={36} />
        <p className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          Loading verification schedule…
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header section with refined typography and accent pill */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest-wash/80 px-3 py-1 text-xs font-bold text-forest shadow-2xs backdrop-blur-xs">
            <Sparkles size={13} className="text-forest animate-pulse" />
            <span>Virtual Verification Hub</span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-head sm:text-4xl">
            Interview Schedule
          </h1>
          <p className="mt-2 text-sm text-ink-muted max-w-2xl">
            Live video screening sessions via Google Meet. Seamlessly sync events to Google Calendar,
            export universal calendar invites, or dispatch email confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-ink-head shadow-2xs">
            <Calendar size={14} className="text-forest" />
            <span>{interviews.length} {interviews.length === 1 ? 'Interview' : 'Interviews'} Active</span>
          </span>
        </div>
      </div>

      {interviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[28px] border border-line bg-white p-12 text-center shadow-soft sm:p-16"
        >
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-forest-wash/40 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 size-64 rounded-full bg-gold-soft/30 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto flex size-20 items-center justify-center rounded-2xl bg-forest-wash text-forest shadow-sm">
            <Calendar size={36} />
          </div>
          <h3 className="relative z-10 mt-6 font-serif text-2xl font-bold text-ink-head">
            No active interviews scheduled
          </h3>
          <p className="relative z-10 mx-auto mt-2 max-w-md text-sm text-ink-muted leading-relaxed">
            {isShelter
              ? 'When you approve an application and pick an interview slot, the Google Meet conference and calendar synchronization tools will appear right here.'
              : 'Once a shelter approves your adoption application and schedules a video interview, your Google Meet link and calendar invitation will appear here.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {interviews.map((app, index) => {
              const dateTime = app.interviewScheduledAt || app.interview?.date
              const { dateStr, relative } = formatInterviewBadge(dateTime)
              const meetLink = app.interviewLink || app.interview?.meetLink

              const googleCalUrl = getGoogleCalendarUrl({
                title: `Adoptly Interview: ${app.petName}`,
                description: `Pre-adoption virtual verification interview for ${app.petName}.\n\nMeeting link: ${meetLink || 'TBD'}\nApplicant: ${app.adopterName || ''}`,
                location: meetLink || '',
                dateTime: dateTime || new Date().toISOString(),
                durationMinutes: 30,
                attendees: [app.adopterEmail, user?.email].filter(Boolean),
              })

              const mailtoUrl = getMailtoInviteUrl({
                to: isShelter ? app.adopterEmail : user?.email,
                cc: isShelter ? user?.email : undefined,
                petName: app.petName,
                dateTime: dateTime || new Date().toISOString(),
                meetLink: meetLink || 'Link will be provided before the session',
              })

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.08 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-line/80 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-forest/30 hover:shadow-lift"
                >
                  {/* Ambient accent highlight */}
                  <div className="absolute -right-12 -top-12 size-36 rounded-full bg-forest-wash/50 blur-2xl transition-all group-hover:bg-forest-wash/80 pointer-events-none" />

                  {/* Top Bar: Relative Timing & Status */}
                  <div className="relative z-10 mb-4 flex items-center justify-between border-b border-line-soft pb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-dim px-2.5 py-1 text-[11px] font-bold text-ink-head">
                      <Clock size={12} className="text-forest" />
                      <span>{relative || 'Upcoming'}</span>
                    </span>
                    <StatusBadge status={app.status || 'Interview Scheduled'} size="xs" />
                  </div>

                  {/* Body: Pet & Participant Info */}
                  <div className="relative z-10 mb-5 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-gold shadow-sm">
                        <Video size={22} />
                      </div>
                      <div className="min-w-0">
                        <PetHoverPreview pet={app.pet}>
                          <h3 className="truncate font-serif text-xl font-bold text-ink-head hover:text-forest transition-colors cursor-pointer underline decoration-dotted decoration-forest/40 underline-offset-4">
                            {app.petName}
                          </h3>
                        </PetHoverPreview>
                        <p className="truncate text-xs font-medium text-ink-muted mt-0.5">
                          Applicant: <strong className="text-ink-head">{app.adopterName || 'Adopter'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Schedule Time Box */}
                    <div className="rounded-xl border border-line-soft bg-cream-soft/70 p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted flex items-center gap-1.5">
                          <Clock size={13} className="text-forest" />
                          <span>Date &amp; Time</span>
                        </span>
                        <span className="font-bold text-ink-head">{dateStr}</span>
                      </div>
                      {app.adopterEmail && (
                        <div className="flex items-center justify-between truncate text-[11px]">
                          <span className="text-ink-muted">Email:</span>
                          <span className="truncate font-medium text-ink-muted max-w-[170px]">
                            {app.adopterEmail}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Suite: Join Meeting, Add to Calendar, Send Invite */}
                  <div className="relative z-10 mt-auto space-y-2.5 pt-2">
                    {isShelter && editingAppId === app.id ? (
                      <div className="rounded-xl border border-forest/30 bg-cream-soft p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-forest flex items-center gap-1">
                            <Edit2 size={12} /> Set Meet Link
                          </span>
                          <a
                            href="https://meet.google.com/new"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-forest hover:underline"
                            title="Open Google Meet to create a live room"
                          >
                            <span>Create Live Room</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                        <input
                          type="url"
                          className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-head outline-none focus:border-forest"
                          placeholder="https://meet.google.com/xyz-wxyz-abc"
                          value={editingLinkValue}
                          onChange={e => setEditingLinkValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingAppId(null)}
                            className="rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:bg-cream-dim"
                            disabled={savingLinkId === app.id}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveInterviewLink(app.id)}
                            disabled={savingLinkId === app.id || !editingLinkValue.trim()}
                            className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-1 text-[11px] font-bold text-cream hover:bg-forest-dark disabled:opacity-50"
                          >
                            {savingLinkId === app.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            <span>Save Link</span>
                          </button>
                        </div>
                      </div>
                    ) : meetLink ? (
                      <div className="space-y-2">
                        {/* Primary Meet CTA + Edit Option */}
                        <div className="flex items-center gap-2">
                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-cream shadow-sm transition-all hover:bg-forest-dark hover:shadow active:scale-[0.99]"
                          >
                            <Video size={16} />
                            <span>Join Google Meet</span>
                            <ExternalLink size={13} className="opacity-80" />
                          </a>
                          {isShelter && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLinkValue(meetLink)
                                setEditingAppId(app.id)
                              }}
                              title="Edit / Replace Meet link"
                              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink-muted hover:border-forest hover:text-forest transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Calendar & Invite Multi-Tool Row */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {/* 1. Add to Google Calendar */}
                          <a
                            href={googleCalUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Add event to Google Calendar with attendee invites"
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head transition-all hover:border-forest/40 hover:bg-forest-wash hover:text-forest"
                          >
                            <CalendarPlus size={14} className="text-forest" />
                            <span>Google Cal</span>
                          </a>

                          {/* 2. Download Universal .ics */}
                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(app)}
                            title="Download .ics file for Apple Calendar or Outlook"
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head transition-all hover:border-forest/40 hover:bg-forest-wash hover:text-forest"
                          >
                            <Download size={14} className="text-forest" />
                            <span>Export .ics</span>
                          </button>

                          {/* 3. Send Invite via Email */}
                          <a
                            href={mailtoUrl}
                            title="Send meeting confirmation email with pre-filled agenda"
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head transition-all hover:border-forest/40 hover:bg-forest-wash hover:text-forest"
                          >
                            <Mail size={14} className="text-forest" />
                            <span>Email Invite</span>
                          </a>
                        </div>

                        {/* Quick Copy Link Bar */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(app.id, meetLink)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[11px] font-semibold text-ink-muted hover:text-forest transition-colors"
                        >
                          {copiedId === app.id ? (
                            <>
                              <Check size={12} className="text-forest" />
                              <span className="text-forest font-bold">Link copied to clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy Meet Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {isShelter ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 space-y-2 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                              <AlertCircle size={13} className="text-amber-600" />
                              <span>No Google Meet link set yet</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a
                                href="https://meet.google.com/new"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-700 py-1.5 text-[10px] font-bold text-white shadow-2xs hover:bg-amber-800 transition"
                              >
                                <span>Create Room</span>
                                <ExternalLink size={10} />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLinkValue('')
                                  setEditingAppId(app.id)
                                }}
                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-white py-1.5 text-[10px] font-bold text-amber-900 shadow-2xs hover:bg-amber-100/50 transition"
                              >
                                <Edit2 size={11} />
                                <span>Set Link</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-xs text-ink-muted italic py-1">
                            Meeting link will be provided prior to the session.
                          </p>
                        )}

                        {/* Calendar sync row still available */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <a
                            href={googleCalUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Add event to Google Calendar"
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head transition-all hover:border-forest/40 hover:bg-forest-wash hover:text-forest"
                          >
                            <CalendarPlus size={14} className="text-forest" />
                            <span>Google Cal</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(app)}
                            title="Download .ics file"
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head transition-all hover:border-forest/40 hover:bg-forest-wash hover:text-forest"
                          >
                            <Download size={14} className="text-forest" />
                            <span>Export .ics</span>
                          </button>

                          <a
                            href={mailtoUrl}
                            title="Send email confirmation"
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head transition-all hover:border-forest/40 hover:bg-forest-wash hover:text-forest"
                          >
                            <Mail size={14} className="text-forest" />
                            <span>Email Invite</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Shelter Decision Suite */}
                    {isShelter && (
                      <div className="flex gap-2 border-t border-line-soft pt-3">
                        <button
                          type="button"
                          onClick={() => finishInterview(app.id, app.petId, true)}
                          disabled={updatingId === app.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {updatingId === app.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          <span>Confirm Adoption</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => finishInterview(app.id, app.petId, false)}
                          disabled={updatingId === app.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
                        >
                          {updatingId === app.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <XCircle size={14} />
                          )}
                          <span>Decline</span>
                        </button>
                      </div>
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
