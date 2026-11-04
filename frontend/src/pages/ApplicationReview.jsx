import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApplication, updateApplication, updatePet, scheduleGoogleMeet, updateInterviewLink, getPet } from '../lib/api'
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
  getMailtoInviteUrl,
  formatInterviewBadge,
} from '../lib/calendar'
import ScoreGauge from '../components/ScoreGauge'
import MatchBreakdown from '../components/MatchBreakdown'
import StatusBadge from '../components/StatusBadge'
import PetHoverPreview from '../components/PetHoverPreview'
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Video,
  Loader2,
  ExternalLink,
  CalendarPlus,
  Download,
  Mail,
  Copy,
  Check,
  Clock,
  User,
  Home,
  Heart,
  FileText,
  Edit2,
  AlertCircle,
} from 'lucide-react'

export default function ApplicationReview() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()

  const [a, setA] = useState(null)
  const [pet, setPet] = useState(null)
  const [notes, setNotes] = useState('')
  const [iv, setIv] = useState({ date: '', time: '' })
  const [scheduling, setScheduling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingMeetLink, setEditingMeetLink] = useState(false)
  const [meetLinkInput, setMeetLinkInput] = useState('')
  const [savingMeetLink, setSavingMeetLink] = useState(false)

  const load = () =>
    getApplication(id).then(async d => {
      setA(d)
      setNotes(d?.decisionNotes || '')
      if (d?.petId) {
        const p = await getPet(d.petId).catch(() => null)
        if (p) setPet(p)
      }
    })

  useEffect(() => {
    load()
  }, [id])

  if (!a) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-forest">
        <Loader2 className="animate-spin text-forest" size={36} />
        <p className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          Loading application dossier…
        </p>
      </div>
    )
  }

  const decide = async (status, extra = {}, petStatus) => {
    await updateApplication(id, {
      status,
      decisionNotes: notes,
      decisionDate: new Date().toISOString(),
      ...extra,
    })
    if (petStatus && a.petId) {
      await updatePet(a.petId, { adoptionStatus: petStatus })
    }
    load()
  }

  const schedule = async () => {
    if (!iv.date || !iv.time) return
    setScheduling(true)

    try {
      const dateTime = new Date(`${iv.date}T${iv.time}`).toISOString()

      await scheduleGoogleMeet({
        applicationId: id,
        petName: a.petName,
        adopterEmail: a.adopterEmail || 'adopter@example.com',
        shelterEmail: user?.email || 'shelter@example.com',
        dateTime,
      })

      if (a.petId) {
        await updatePet(a.petId, { adoptionStatus: 'Pending' }).catch(err =>
          console.warn('Could not update pet status to Pending:', err)
        )
      }

      load()
    } catch (error) {
      console.error(error)
      alert('Failed to schedule interview: ' + error.message)
    } finally {
      setScheduling(false)
    }
  }

  const handleSaveMeetLink = async () => {
    setSavingMeetLink(true)
    try {
      await updateInterviewLink(id, meetLinkInput)
      setEditingMeetLink(false)
      await load()
    } catch (err) {
      console.error('Failed to update meet link:', err)
      alert('Failed to save link: ' + err.message)
    } finally {
      setSavingMeetLink(false)
    }
  }

  const handleCopyLink = (link) => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const p = a.adopterProfile || {}
  const meetLink = a.interviewLink || a.interview?.meetLink
  const interviewTime = a.interviewScheduledAt || a.interview?.date
  const { dateStr, relative } = formatInterviewBadge(interviewTime)

  const googleCalUrl = getGoogleCalendarUrl({
    title: `Adoptly Interview: ${a.petName}`,
    description: `Virtual verification interview for ${a.petName}.\n\nMeeting link: ${meetLink || 'TBD'}\nApplicant: ${a.adopterName || ''}`,
    location: meetLink || '',
    dateTime: interviewTime || new Date().toISOString(),
    durationMinutes: 30,
    attendees: [a.adopterEmail, user?.email].filter(Boolean),
  })

  const mailtoUrl = getMailtoInviteUrl({
    to: a.adopterEmail || '',
    cc: user?.email,
    petName: a.petName,
    dateTime: interviewTime || new Date().toISOString(),
    meetLink: meetLink || 'Link will be provided before session',
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-forest transition-colors hover:text-forest-dark"
      >
        <ArrowLeft size={14} /> Back to applications
      </button>

      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-line/80 bg-white p-6 shadow-soft">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-terracotta">
            Application Dossier
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-ink-head sm:text-3xl">
            {a.adopterName || 'Applicant'}{' '}
            <span className="font-normal text-ink-muted">for</span>{' '}
            <PetHoverPreview pet={pet || a.pet || { name: a.petName, id: a.petId }}>
              <span className="text-forest underline decoration-dotted decoration-forest/40 underline-offset-4 cursor-pointer hover:text-forest-dark">
                “{a.petName}”
              </span>
            </PetHoverPreview>
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Submitted on {a.submittedDate ? new Date(a.submittedDate.seconds ? a.submittedDate.seconds * 1000 : a.submittedDate).toLocaleDateString([], { dateStyle: 'medium' }) : 'Recently'}
          </p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Applicant Profile & Match Breakdown */}
        <div className="space-y-6 md:col-span-2">
          {/* Lifestyle & Match Score Card */}
          <div className="rounded-[24px] border border-line/80 bg-white p-6 shadow-soft">
            <h2 className="mb-4 font-serif text-lg font-bold text-ink-head">
              Applicant Lifestyle Profile
            </h2>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {a.score != null && (
                <div className="flex shrink-0 flex-col items-center">
                  <ScoreGauge score={a.score} size={92} />
                  <span className="mt-1 text-[10px] font-bold tracking-wide uppercase text-ink-muted">
                    Compatibility
                  </span>
                </div>
              )}
              <div className="grid flex-1 grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-cream-soft p-3">
                  <span className="block font-bold text-ink-muted uppercase tracking-wider text-[10px] mb-0.5">Housing</span>
                  <span className="font-semibold text-ink-head">{p.housingType || 'Not specified'}</span>
                </div>
                <div className="rounded-xl bg-cream-soft p-3">
                  <span className="block font-bold text-ink-muted uppercase tracking-wider text-[10px] mb-0.5">Household</span>
                  <span className="font-semibold text-ink-head">{p.household?.join(', ') || 'Adults only'}</span>
                </div>
                <div className="rounded-xl bg-cream-soft p-3">
                  <span className="block font-bold text-ink-muted uppercase tracking-wider text-[10px] mb-0.5">Activity &amp; Care</span>
                  <span className="font-semibold text-ink-head">{p.activityLevel || 'Moderate'} · {p.careTime || '3-4 hrs'}</span>
                </div>
                <div className="rounded-xl bg-cream-soft p-3">
                  <span className="block font-bold text-ink-muted uppercase tracking-wider text-[10px] mb-0.5">Experience</span>
                  <span className="font-semibold text-ink-head">{p.experience || 'Some experience'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Match Breakdown Card */}
          <div className="rounded-[24px] border border-line/80 bg-white p-6 shadow-soft">
            <h2 className="mb-4 font-serif text-lg font-bold text-ink-head">
              Feature Compatibility Breakdown
            </h2>
            <MatchBreakdown contributions={a.contributions} />
          </div>
        </div>

        {/* Right Column: Decision & Virtual Interview Scheduling */}
        <div className="space-y-6">
          <div className="rounded-[24px] border border-line/80 bg-white p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-lg font-bold text-ink-head">Review &amp; Actions</h2>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Internal Notes
              </label>
              <textarea
                className="w-full rounded-xl border border-line bg-cream-soft px-3.5 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15 h-24 resize-none"
                placeholder="Private shelter review notes (not visible to applicant)…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* If Pending Review: Schedule Form */}
            {a.status === 'Pending Review' && (
              <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-forest/20 bg-forest-wash/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-forest font-bold text-xs uppercase tracking-wider">
                    <Video size={14} />
                    <span>Schedule Virtual Verification</span>
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed">
                    Pick an interview date &amp; time. A Google Meet link and calendar sync invite will be generated instantly.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-ink-muted uppercase mb-1">Date</span>
                      <input
                        className="w-full rounded-xl border border-line bg-white px-2.5 py-2 text-xs font-semibold text-ink-head outline-none focus:border-forest"
                        type="date"
                        value={iv.date}
                        onChange={e => setIv({ ...iv, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-ink-muted uppercase mb-1">Time</span>
                      <input
                        className="w-full rounded-xl border border-line bg-white px-2.5 py-2 text-xs font-semibold text-ink-head outline-none focus:border-forest"
                        type="time"
                        value={iv.time}
                        onChange={e => setIv({ ...iv, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-cream shadow-sm transition-all hover:bg-forest-dark hover:shadow disabled:opacity-50"
                    disabled={!iv.date || !iv.time || scheduling}
                    onClick={schedule}
                  >
                    {scheduling ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Generating Live Google Meet…</span>
                      </>
                    ) : (
                      <>
                        <CalendarClock size={14} />
                        <span>Approve &amp; Schedule Interview</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50"
                  onClick={() => decide('Rejected')}
                >
                  <XCircle size={14} /> Reject Application
                </button>
              </div>
            )}

            {/* If Interview Scheduled: Calendar & Meet Hub */}
            {a.status === 'Interview Scheduled' && (
              <div className="space-y-4 pt-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <Clock size={13} /> Interview Scheduled
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {relative || 'Upcoming'}
                    </span>
                  </div>

                  <p className="font-serif text-base font-bold text-ink-head">{dateStr}</p>

                  {/* Meeting Link Section / Editor */}
                  {editingMeetLink ? (
                    <div className="rounded-xl border border-forest/30 bg-white p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-forest flex items-center gap-1">
                          <Edit2 size={12} /> Set Meeting Link
                        </span>
                        <a
                          href="https://meet.google.com/new"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-forest hover:underline"
                          title="Open Google Meet to create a live room"
                        >
                          <span>Create live room</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                      <input
                        type="url"
                        className="w-full rounded-lg border border-line bg-cream-soft px-2.5 py-1.5 text-xs font-semibold text-ink-head outline-none focus:border-forest"
                        placeholder="https://meet.google.com/xyz-wxyz-abc"
                        value={meetLinkInput}
                        onChange={e => setMeetLinkInput(e.target.value)}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingMeetLink(false)}
                          className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:bg-cream-soft"
                          disabled={savingMeetLink}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveMeetLink}
                          disabled={savingMeetLink || !meetLinkInput.trim()}
                          className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-1 text-[11px] font-bold text-cream hover:bg-forest-dark disabled:opacity-50"
                        >
                          {savingMeetLink ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          <span>Save Link</span>
                        </button>
                      </div>
                    </div>
                  ) : meetLink ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2 text-xs font-bold text-cream shadow-sm hover:bg-forest-dark transition-all"
                        >
                          <Video size={14} />
                          <span>Join Google Meet</span>
                          <ExternalLink size={12} className="opacity-75" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setMeetLinkInput(meetLink)
                            setEditingMeetLink(true)
                          }}
                          title="Change or fix Google Meet link"
                          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink-muted hover:border-forest hover:text-forest transition-all"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>

                      {/* 1-Click Calendar Tools */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <a
                          href={googleCalUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Add to Google Calendar"
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                        >
                          <CalendarPlus size={13} className="text-forest" />
                          <span>Google Cal</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => downloadIcsFile({
                            title: `Adoptly Interview: ${a.petName}`,
                            description: `Virtual interview for ${a.petName}.\nMeeting Link: ${meetLink}`,
                            location: meetLink,
                            dateTime: interviewTime,
                            durationMinutes: 30,
                            attendees: [a.adopterEmail, user?.email].filter(Boolean),
                            filename: `adoptly-interview-${a.petName?.toLowerCase() || 'pet'}.ics`,
                          })}
                          title="Download .ics for Apple / Outlook"
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                        >
                          <Download size={13} className="text-forest" />
                          <span>Export .ics</span>
                        </button>

                        <a
                          href={mailtoUrl}
                          title="Send Email Confirmation to Adopter"
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                        >
                          <Mail size={13} className="text-forest" />
                          <span>Email Invite</span>
                        </a>
                      </div>

                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(meetLink)}
                        className="flex w-full items-center justify-center gap-1.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-forest transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check size={12} className="text-forest" />
                            <span className="text-forest font-bold">Link copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Meet link</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-900 leading-snug">
                            <span className="font-bold">No Google Meet link set yet.</span>
                            <p className="mt-0.5 text-[11px] text-amber-800">
                              Create a live room on Google Meet and paste the link so the applicant can join.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href="https://meet.google.com/new"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-amber-800 transition"
                          >
                            <span>Create Meet Room</span>
                            <ExternalLink size={11} />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setMeetLinkInput('')
                              setEditingMeetLink(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-900 shadow-2xs hover:bg-amber-100/50 transition"
                          >
                            <Edit2 size={11} />
                            <span>Paste Link</span>
                          </button>
                        </div>
                      </div>

                      {/* 1-Click Calendar Tools */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <a
                          href={googleCalUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Add to Google Calendar"
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                        >
                          <CalendarPlus size={13} className="text-forest" />
                          <span>Google Cal</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => downloadIcsFile({
                            title: `Adoptly Interview: ${a.petName}`,
                            description: `Virtual interview for ${a.petName}.`,
                            location: '',
                            dateTime: interviewTime,
                            durationMinutes: 30,
                            attendees: [a.adopterEmail, user?.email].filter(Boolean),
                            filename: `adoptly-interview-${a.petName?.toLowerCase() || 'pet'}.ics`,
                          })}
                          title="Download .ics for Apple / Outlook"
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                        >
                          <Download size={13} className="text-forest" />
                          <span>Export .ics</span>
                        </button>

                        <a
                          href={mailtoUrl}
                          title="Send Email Confirmation to Adopter"
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white p-2 text-[10px] font-bold text-ink-head hover:border-forest hover:text-forest transition-all"
                        >
                          <Mail size={13} className="text-forest" />
                          <span>Email Invite</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Decision Buttons */}
                <button
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-xs font-bold text-cream shadow-sm hover:bg-forest-dark transition-all"
                  onClick={() => decide('Adoption Completed', {}, 'Adopted')}
                >
                  <CheckCircle2 size={14} /> Confirm Adoption (Finalize)
                </button>
                <button
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-all"
                  onClick={() => decide('Failed Adoption', {}, 'Available')}
                >
                  <XCircle size={14} /> Mark Failed (Return to Available)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
