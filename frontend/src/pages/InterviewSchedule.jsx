import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listApplications, updateApplication, updatePet } from '../lib/api'
import { Calendar, Video, ExternalLink, Loader2, Clock, User, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InterviewSchedule() {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null) // Track which card is loading

  const fetchInterviews = async () => {
    try {
      const filters = user.role === 'shelter' 
        ? { shelterId: user.uid } 
        : { adopterId: user.uid }
      
      const apps = await listApplications(filters)
      
      // Only keep ones that have an interview scheduled
      const scheduled = apps.filter(a => a.status === 'Interview Scheduled' && a.interviewScheduledAt)
      
      scheduled.sort((a, b) => new Date(a.interviewScheduledAt) - new Date(b.interviewScheduledAt))
      setInterviews(scheduled)
    } catch (error) {
      console.error("Failed to load interviews:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.uid) return
    fetchInterviews()
  }, [user])

  // Handle finishing the interview
  const finishInterview = async (appId, petId, isSuccess) => {
    setUpdatingId(appId)
    try {
      const newAppStatus = isSuccess ? 'Adoption Completed' : 'Failed Adoption'
      const newPetStatus = isSuccess ? 'Adopted' : 'Available'

      // 1. Update the application
      await updateApplication(appId, { 
        status: newAppStatus,
        decisionDate: new Date().toISOString()
      })
      
      // 2. Update the pet's status
      await updatePet(petId, { adoptionStatus: newPetStatus })

      // 3. Refresh the list (the card will disappear)
      fetchInterviews()
    } catch (error) {
      console.error("Failed to update interview:", error)
      alert("Could not update the interview status.")
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-forest"><Loader2 className="animate-spin" size={32} /></div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="eyebrow text-terracotta">Virtual Verification</p>
        <h1 className="mt-2 h-serif text-3xl">Interview Schedule</h1>
        <p className="mt-2 text-sm text-ink-muted">Manage your upcoming pre-adoption interviews via Google Meet.</p>
      </div>

      {interviews.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-line bg-white p-12 text-center shadow-soft"
        >
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-forest-wash mb-6">
            <Calendar size={36} className="text-forest" />
          </div>
          <h3 className="text-xl font-serif font-bold text-forest">No active interviews</h3>
          <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto">
            When an application is approved and a time is set, the Google Meet link will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {interviews.map((app, index) => (
            <motion.div 
              key={app.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative flex flex-col overflow-hidden rounded-[24px] border border-line bg-white p-6 shadow-soft transition-all hover:shadow-lift hover:border-forest/30"
            >
              <div className="absolute -right-10 -top-10 size-32 rounded-full bg-forest-wash/50 blur-2xl transition-all group-hover:bg-gold-soft/40" />

              <div className="relative z-10 flex items-center justify-between border-b border-line-soft pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-forest text-gold shadow-sm">
                    <Video size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink-head text-lg">{app.petName}</h3>
                    <p className="text-xs text-ink-whisper font-medium">Applicant: {app.adopterName || 'Unknown'}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10 space-y-3 mb-6 bg-cream-soft/50 p-4 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted flex items-center gap-1.5"><Clock size={14} /> Date & Time:</span>
                  <span className="font-bold text-ink-head">
                    {new Date(app.interviewScheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted flex items-center gap-1.5"><User size={14} /> Status:</span>
                  <span className="font-bold text-forest">Ready</span>
                </div>
              </div>

              <div className="mt-auto space-y-2 relative z-10">
                {app.interviewLink && (
                  <a 
                    href={app.interviewLink} target="_blank" rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-cream transition-all hover:bg-forest-dark hover:-translate-y-0.5"
                  >
                    <Video size={16} /> Join Google Meet <ExternalLink size={14} />
                  </a>
                )}

                {/* ✅ NEW: Show these buttons only to shelters */}
                {user.role === 'shelter' && (
                  <div className="flex gap-2 pt-2 border-t border-line-soft">
                    <button 
                      onClick={() => finishInterview(app.id, app.petId, true)}
                      disabled={updatingId === app.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-50 px-2 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                    >
                      {updatingId === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Adopted
                    </button>
                    <button 
                      onClick={() => finishInterview(app.id, app.petId, false)}
                      disabled={updatingId === app.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-2 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                    >
                      {updatingId === app.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}