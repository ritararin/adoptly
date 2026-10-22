import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listApplications } from '../lib/api'
import { Calendar, Video, ExternalLink, Loader2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InterviewSchedule() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Guard: Wait for auth to load before fetching
    if (!user?.uid) return;
    
    const fetchApps = async () => {
      try {
        const filters = user.role === 'shelter' 
          ? { shelterId: user.uid } 
          : { adopterId: user.uid }
        
        const data = await listApplications(filters)
        // Filter for applications that have an interview scheduled
        setApps(data.filter(a => a.status === 'Interview Scheduled' || a.interviewLink))
      } catch (error) {
        console.error("Failed to load interviews:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchApps()
  }, [user])

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-forest">
      <Loader2 className="animate-spin" size={32} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="eyebrow text-terracotta">Virtual Verification</p>
        <h1 className="mt-2 h-serif text-3xl">Interview Schedule</h1>
        <p className="mt-2 text-sm text-ink-muted">Manage your upcoming pre-adoption interviews via Google Meet.</p>
      </div>

      {apps.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-line bg-white p-12 text-center shadow-soft"
        >
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-forest-wash mb-6">
            <Calendar size={36} className="text-forest" />
          </div>
          <h3 className="text-xl font-serif font-bold text-forest">No interviews scheduled</h3>
          <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto">
            When an application is approved and a time is set, the Google Meet link will automatically appear here.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app, index) => (
            <motion.div 
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-[24px] border border-line bg-white p-6 shadow-soft transition-all hover:shadow-lift hover:border-forest/30"
            >
              {/* Decorative glowing background blob */}
              <div className="absolute -right-10 -top-10 size-32 rounded-full bg-forest-wash/50 blur-2xl transition-all group-hover:bg-gold-soft/40" />

              <div className="relative z-10 flex items-center justify-between border-b border-line-soft pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-forest text-gold shadow-sm">
                    <Video size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink-head text-lg">{app.petName || 'Pet Interview'}</h3>
                    <p className="text-xs text-ink-whisper font-medium">ID: #{app.id.slice(0, 8)}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10 space-y-3 mb-6 bg-cream-soft/50 p-4 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted flex items-center gap-1.5"><Clock size={14} /> Date & Time:</span>
                  <span className="font-bold text-ink-head">
                    {app.interviewScheduledAt 
                      ? new Date(app.interviewScheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) 
                      : 'TBD'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Status:</span>
                  <span className="font-bold text-forest">Ready</span>
                </div>
              </div>

              {app.interviewLink ? (
                <a 
                  href={app.interviewLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="relative z-10 flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-bold text-cream transition-all hover:bg-forest-dark hover:-translate-y-0.5"
                >
                  <Video size={18} /> Join Google Meet <ExternalLink size={14} />
                </a>
              ) : (
                <button disabled className="relative z-10 w-full rounded-xl bg-cream-deep px-4 py-3 text-sm font-bold text-ink-whisper cursor-not-allowed flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Generating Link...
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}