import { Bell, Info, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Notifications() {
  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow">Inbox</p>
        <h1 className="mt-2 h-serif text-3xl">Notifications</h1>
        <p className="mt-2 text-sm text-ink-muted">Stay updated on your applications and matches.</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Example Notification 1 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 rounded-[20px] border border-line bg-white p-5 shadow-soft">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-wash text-forest">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-ink-head text-sm">Application Approved</h3>
            <p className="text-sm text-ink-muted mt-1">Your application for Luna has been approved! The shelter has scheduled a virtual interview.</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-whisper mt-2">2 hours ago</p>
          </div>
        </motion.div>

        {/* Example Notification 2 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-start gap-4 rounded-[20px] border border-line bg-white p-5 shadow-soft">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-ink">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="font-bold text-ink-head text-sm">New Matches Available</h3>
            <p className="text-sm text-ink-muted mt-1">Our AI found 3 new pets that match your lifestyle profile. Check them out!</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-whisper mt-2">1 day ago</p>
          </div>
        </motion.div>

        {/* Example Notification 3 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-start gap-4 rounded-[20px] border border-line bg-white p-5 shadow-soft">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream-soft text-ink-muted">
            <Info size={20} />
          </div>
          <div>
            <h3 className="font-bold text-ink-head text-sm">Welcome to Adoptly</h3>
            <p className="text-sm text-ink-muted mt-1">Complete your lifestyle questionnaire to get personalized pet recommendations.</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-whisper mt-2">3 days ago</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}