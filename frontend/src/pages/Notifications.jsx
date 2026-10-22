import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listApplications, listPets } from '../lib/api'
import { Bell, Info, CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Notifications() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user?.uid) return

    const generateNotifications = async () => {
      try {
        const apps = await listApplications({ shelterId: user.uid })
        const pets = await listPets({ shelterId: user.uid })
        
        const notifs = []

        // 1. Check for pending applications
        const pendingApps = apps.filter(a => a.status === 'Pending Review')
        if (pendingApps.length > 0) {
          notifs.push({
            id: 'pending-apps',
            title: 'Action Required',
            message: `You have ${pendingApps.length} new application(s) waiting for your review.`,
            type: 'alert',
            icon: FileText,
            color: 'text-gold-ink bg-gold-soft',
            time: 'Just now'
          })
        }

        // 2. Check for successful adoptions
        const adoptedPets = pets.filter(p => p.adoptionStatus === 'Adopted')
        if (adoptedPets.length > 0) {
          notifs.push({
            id: 'adopted-pets',
            title: 'Successful Adoption',
            message: `Great job! You have successfully rehomed ${adoptedPets.length} pet(s).`,
            type: 'success',
            icon: CheckCircle2,
            color: 'text-forest bg-forest-wash',
            time: 'Recently'
          })
        }

        // 3. Welcome message (always shows)
        notifs.push({
          id: 'welcome',
          title: 'Welcome to Adoptly',
          message: 'Your shelter dashboard is ready. Ensure all your pet listings have clear photos.',
          type: 'info',
          icon: Info,
          color: 'text-ink-muted bg-cream-soft',
          time: 'System'
        })

        setNotifications(notifs)
      } catch (error) {
        console.error("Failed to load notifications:", error)
      } finally {
        setLoading(false)
      }
    }
    generateNotifications()
  }, [user?.uid])

  if (loading) return <div className="flex h-64 items-center justify-center text-forest"><Loader2 className="animate-spin" size={32} /></div>

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow">Inbox</p>
        <h1 className="mt-2 h-serif text-3xl">Notifications</h1>
        <p className="mt-2 text-sm text-ink-muted">Stay updated on your applications and matches.</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {notifications.map((notif, index) => (
          <motion.div 
            key={notif.id}
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 rounded-[20px] border border-line bg-white p-5 shadow-soft"
          >
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${notif.color}`}>
              <notif.icon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-ink-head text-sm">{notif.title}</h3>
              <p className="text-sm text-ink-muted mt-1">{notif.message}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-whisper mt-2">{notif.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}