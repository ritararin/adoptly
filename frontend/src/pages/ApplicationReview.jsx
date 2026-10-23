import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext' // <-- Import useAuth to get shelter email
import { getApplication, updateApplication, updatePet, scheduleGoogleMeet } from '../lib/api'
import ScoreGauge from '../components/ScoreGauge'
import MatchBreakdown from '../components/MatchBreakdown'
import StatusBadge from '../components/StatusBadge'
import { ArrowLeft, CalendarClock, CheckCircle2, XCircle, Video, Loader2, ExternalLink } from 'lucide-react'

export default function ApplicationReview() {
  const { id } = useParams(); const nav = useNavigate()
  const { user } = useAuth() // Get the logged-in shelter user
  
  const [a, setA] = useState(null)
  const [notes, setNotes] = useState('')
  const [iv, setIv] = useState({ date: '', time: '' }) // Removed meetLink
  const [scheduling, setScheduling] = useState(false)
  
  const load = () => getApplication(id).then(d => { setA(d); setNotes(d?.decisionNotes || '') })
  useEffect(() => { load() }, [id])
  
  if (!a) return <p className="text-sm text-ink-muted">Loading…</p>

  const decide = async (status, extra = {}, petStatus) => {
    await updateApplication(id, { status, decisionNotes: notes, decisionDate: new Date().toISOString(), ...extra })
    if (petStatus) await updatePet(a.petId, { adoptionStatus: petStatus })
    load()
  }

  // --- NEW: Schedule Interview via Cloud Function ---
  const schedule = async () => {
    if (!iv.date || !iv.time) return;
    setScheduling(true)
    
    try {
      // 1. Combine date and time into ISO format
      const dateTime = new Date(`${iv.date}T${iv.time}`).toISOString()
      
      // 2. Call the Cloud Function to generate the Meet link
      await scheduleGoogleMeet({
        applicationId: id,
        petName: a.petName,
        adopterEmail: a.adopterEmail || 'adopter@example.com', // Fallback if email is missing
        shelterEmail: user?.email || 'shelter@example.com',
        dateTime: dateTime
      })

      // 3. Mark the pet as Pending so no one else applies
      await updatePet(a.petId, { adoptionStatus: 'Pending' })
      
      // 4. Reload the application to show the new status and link
      // (The Cloud Function already updated the application status to "Interview Scheduled")
      load()
      
    } catch (error) {
      console.error(error)
      alert("Failed to schedule interview: " + error.message)
    } finally {
      setScheduling(false)
    }
  }

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
                  
                  {/* Removed the manual Meet Link input */}
                  <div className="flex gap-2">
                    <input className="input" type="date" value={iv.date} onChange={e => setIv({ ...iv, date: e.target.value })} />
                    <input className="input" type="time" value={iv.time} onChange={e => setIv({ ...iv, time: e.target.value })} />
                  </div>
                  
                  <button 
                    className="btn-primary w-full" 
                    disabled={!iv.date || !iv.time || scheduling} 
                    onClick={schedule}
                  >
                    {scheduling ? (
                      <><Loader2 size={15} className="animate-spin" /> Generating Link…</>
                    ) : (
                      <><CalendarClock size={15} /> Approve &amp; schedule</>
                    )}
                  </button>
                </div>
                <button className="btn-danger w-full" onClick={() => decide('Rejected')}>
                  <XCircle size={15} /> Reject application
                </button>
              </div>
            )}

            {a.status === 'Interview Scheduled' && (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-forest-tint p-3 text-xs text-forest">
                  <p className="font-bold mb-1">Interview Scheduled:</p>
                  <p>{a.interviewScheduledAt ? new Date(a.interviewScheduledAt).toLocaleString() : 'Date TBD'}</p>
                  
                  {/* Show the link generated by the Cloud Function */}
                  {a.interviewLink && (
                    <a 
                      href={a.interviewLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-bold hover:underline"
                    >
                      <Video size={12} /> Join Google Meet <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                
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