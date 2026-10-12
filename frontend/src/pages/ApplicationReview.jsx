import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getApplication, updateApplication, updatePet } from '../lib/api'
import ScoreGauge from '../components/ScoreGauge'
import MatchBreakdown from '../components/MatchBreakdown'
import StatusBadge from '../components/StatusBadge'
import { ArrowLeft, CalendarClock, CheckCircle2, XCircle, Video } from 'lucide-react'

export default function ApplicationReview() {
  const { id } = useParams(); const nav = useNavigate()
  const [a, setA] = useState(null); const [notes, setNotes] = useState('')
  const [iv, setIv] = useState({ meetLink: '', date: '', time: '' })
  const load = () => getApplication(id).then(d => { setA(d); setNotes(d?.decisionNotes || '') })
  useEffect(() => { load() }, [id])
  if (!a) return <p className="text-sm text-ink-muted">Loading…</p>

  const decide = async (status, extra = {}, petStatus) => {
    await updateApplication(id, { status, decisionNotes: notes, decisionDate: new Date().toISOString(), ...extra })
    if (petStatus) await updatePet(a.petId, { adoptionStatus: petStatus })
    load()
  }
  // Meet links: in production the Cloud Function on approval generates this via the Google Meet API (FR-07).
  const schedule = () => decide('Interview Scheduled', { interview: iv }, 'Pending')
  const p = a.adopterProfile || {}

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => nav(-1)} className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-forest-dark">
        <ArrowLeft size={14} /> Back to applications
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Application review</p>
          <h1 className="mt-2 h-serif text-3xl">Review: {a.adopterName} for “{a.petName}”</h1>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-[20px] border border-line bg-white p-6 shadow-soft">
            <div className="flex items-center gap-5">
              {a.score != null && <ScoreGauge score={a.score} size={88} />}
              <div className="text-sm">
                <div className="grid gap-1.5 text-ink-muted">
                  <p><span className="font-semibold text-ink-head">Housing:</span> {p.housingType}</p>
                  <p><span className="font-semibold text-ink-head">Household:</span> {p.household?.join(', ')}</p>
                  <p><span className="font-semibold text-ink-head">Activity:</span> {p.activityLevel} · <span className="font-semibold text-ink-head">Care time:</span> {p.careTime}</p>
                  <p><span className="font-semibold text-ink-head">Experience:</span> {p.experience}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-white p-6 shadow-soft">
            <h2 className="mb-5 h-serif text-lg">Match breakdown</h2>
            <MatchBreakdown contributions={a.contributions} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[20px] border border-line bg-white p-6 shadow-soft">
            <h2 className="mb-4 h-serif text-lg">Decision</h2>
            <textarea className="input h-24 resize-none" placeholder="Internal review notes (not visible to the applicant)"
              value={notes} onChange={e => setNotes(e.target.value)} />

            {a.status === 'Pending Review' && (
              <div className="mt-4 space-y-3">
                <div className="space-y-3 rounded-xl bg-cream-soft p-4">
                  <p className="label flex items-center gap-1.5"><Video size={12} /> Schedule virtual interview</p>
                  <input className="input" placeholder="https://meet.google.com/…" value={iv.meetLink}
                    onChange={e => setIv({ ...iv, meetLink: e.target.value })} />
                  <div className="flex gap-2">
                    <input className="input" type="date" value={iv.date} onChange={e => setIv({ ...iv, date: e.target.value })} />
                    <input className="input" type="time" value={iv.time} onChange={e => setIv({ ...iv, time: e.target.value })} />
                  </div>
                  <button className="btn-primary w-full" disabled={!iv.meetLink || !iv.date || !iv.time} onClick={schedule}>
                    <CalendarClock size={15} /> Approve &amp; schedule
                  </button>
                </div>
                <button className="btn-danger w-full" onClick={() => decide('Rejected')}>
                  <XCircle size={15} /> Reject application
                </button>
              </div>
            )}

            {a.status === 'Interview Scheduled' && (
              <div className="mt-4 space-y-3">
                <p className="rounded-lg bg-forest-tint px-3 py-2 text-xs text-forest">
                  Interview: {a.interview?.date} {a.interview?.time}
                </p>
                <button className="btn-primary w-full" onClick={() => decide('Adoption Completed', {}, 'Adopted')}>
                  <CheckCircle2 size={15} /> Confirm adoption
                </button>
                <button className="btn-danger w-full" onClick={() => decide('Failed Adoption', {}, 'Available')}>
                  <XCircle size={15} /> Mark failed (return to pool)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}