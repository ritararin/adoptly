import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listPets, listApplications } from '../lib/api'
import { BarChart3, TrendingUp, Users, PawPrint, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ShelterAnalytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPets: 0,
    adopted: 0,
    pendingApps: 0,
    available: 0,
    pendingPets: 0
  })

  useEffect(() => {
    if (!user?.uid) return

    const fetchData = async () => {
      try {
        const pets = await listPets({ shelterId: user.uid })
        const apps = await listApplications({ shelterId: user.uid })

        const adopted = pets.filter(p => p.adoptionStatus === 'Adopted').length
        const available = pets.filter(p => p.adoptionStatus === 'Available').length
        const pendingPets = pets.filter(p => p.adoptionStatus === 'Pending').length
        const pendingApps = apps.filter(a => a.status === 'Pending Review').length

        setStats({
          totalPets: pets.length,
          adopted,
          available,
          pendingPets,
          pendingApps
        })
      } catch (error) {
        console.error("Failed to load analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.uid])

  if (loading) return <div className="flex h-64 items-center justify-center text-forest"><Loader2 className="animate-spin" size={32} /></div>

  // Calculate percentages for the chart
  const total = stats.totalPets || 1
  const availPct = Math.round((stats.available / total) * 100)
  const pendPct = Math.round((stats.pendingPets / total) * 100)
  const adoptPct = Math.round((stats.adopted / total) * 100)

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow text-terracotta">Insights</p>
        <h1 className="mt-2 h-serif text-3xl">Shelter Analytics</h1>
        <p className="mt-2 text-sm text-ink-muted">Track adoption rates and application metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Pets', value: stats.totalPets, icon: PawPrint, color: 'text-forest', bg: 'bg-forest-wash' },
          { label: 'Active Apps', value: stats.pendingApps, icon: Users, color: 'text-gold-ink', bg: 'bg-gold-soft' },
          { label: 'Successful Adoptions', value: stats.adopted, icon: TrendingUp, color: 'text-terracotta-deep', bg: 'bg-terracotta-soft' },
          { label: 'Available Pets', value: stats.available, icon: BarChart3, color: 'text-ink', bg: 'bg-cream-deep' },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            key={kpi.label} 
            className="rounded-[20px] border border-line bg-white p-6 shadow-soft"
          >
            <div className={`flex size-10 items-center justify-center rounded-xl ${kpi.bg} ${kpi.color} mb-4`}>
              <kpi.icon size={20} />
            </div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-3xl font-serif font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Chart Area */}
      <div className="rounded-[24px] border border-line bg-white p-8 shadow-soft">
        <h3 className="text-lg font-serif font-bold text-forest mb-6">Pet Status Overview</h3>
        
        {stats.totalPets === 0 ? (
          <p className="text-sm text-ink-muted">Add some pets to see your analytics.</p>
        ) : (
          <div className="space-y-6">
            {/* Available Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2 font-bold">
                <span className="text-forest">Available</span>
                <span className="text-forest">{stats.available} pets ({availPct}%)</span>
              </div>
              <div className="h-4 rounded-full bg-cream-deep overflow-hidden">
                <div className="h-full bg-forest rounded-full transition-all duration-1000" style={{ width: `${availPct}%` }} />
              </div>
            </div>

            {/* Pending Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2 font-bold">
                <span className="text-gold-ink">Pending</span>
                <span className="text-gold-ink">{stats.pendingPets} pets ({pendPct}%)</span>
              </div>
              <div className="h-4 rounded-full bg-cream-deep overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all duration-1000" style={{ width: `${pendPct}%` }} />
              </div>
            </div>

            {/* Adopted Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2 font-bold">
                <span className="text-terracotta-deep">Adopted</span>
                <span className="text-terracotta-deep">{stats.adopted} pets ({adoptPct}%)</span>
              </div>
              <div className="h-4 rounded-full bg-cream-deep overflow-hidden">
                <div className="h-full bg-terracotta rounded-full transition-all duration-1000" style={{ width: `${adoptPct}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}