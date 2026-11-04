import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listPets, listApplications } from '../lib/api'
import {
  BarChart3,
  TrendingUp,
  Users,
  PawPrint,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  HeartHandshake,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ShelterAnalytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPets: 0,
    adopted: 0,
    pendingApps: 0,
    available: 0,
    pendingPets: 0,
    interviewScheduled: 0,
  })

  useEffect(() => {
    if (!user?.uid) return

    const fetchData = async () => {
      try {
        const [pets, apps] = await Promise.all([
          listPets({ shelterId: user.uid }).catch(() => []),
          listApplications({ shelterId: user.uid }).catch(() => []),
        ])

        const adopted = pets.filter(p => p.adoptionStatus === 'Adopted').length
        const available = pets.filter(p => p.adoptionStatus === 'Available').length
        const pendingPets = pets.filter(p => p.adoptionStatus === 'Pending').length
        const pendingApps = apps.filter(a => a.status === 'Pending Review').length
        const interviewScheduled = apps.filter(a => a.status === 'Interview Scheduled').length

        setStats({
          totalPets: pets.length,
          adopted,
          available,
          pendingPets,
          pendingApps,
          interviewScheduled,
        })
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.uid])

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-forest">
        <Loader2 className="animate-spin text-forest" size={36} />
        <p className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          Aggregating shelter metrics…
        </p>
      </div>
    )
  }

  const total = stats.totalPets || 1
  const availPct = Math.round((stats.available / total) * 100)
  const pendPct = Math.round((stats.pendingPets / total) * 100)
  const adoptPct = Math.round((stats.adopted / total) * 100)
  const adoptionRate = stats.totalPets > 0 ? Math.round((stats.adopted / stats.totalPets) * 100) : 0

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest-wash/80 px-3 py-1 text-xs font-bold text-forest shadow-2xs backdrop-blur-xs">
          <Sparkles size={13} className="text-forest animate-pulse" />
          <span>Operational Intelligence</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-head sm:text-4xl">
          Shelter Analytics
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-xl">
          Real-time metrics on pet placement rates, pipeline throughput, and pre-adoption verification.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Pet Inventory',
            value: stats.totalPets,
            sub: `${stats.available} currently available`,
            icon: PawPrint,
            color: 'text-forest',
            bg: 'bg-forest-wash',
          },
          {
            label: 'Applications In Review',
            value: stats.pendingApps,
            sub: `${stats.interviewScheduled} interviews active`,
            icon: Users,
            color: 'text-amber-800',
            bg: 'bg-amber-100',
          },
          {
            label: 'Successful Adoptions',
            value: stats.adopted,
            sub: `${adoptionRate}% placement efficiency`,
            icon: HeartHandshake,
            color: 'text-emerald-800',
            bg: 'bg-emerald-100',
          },
          {
            label: 'Adoption Rate',
            value: `${adoptionRate}%`,
            sub: 'Of sheltered animals placed',
            icon: TrendingUp,
            color: 'text-ink-head',
            bg: 'bg-cream-dim',
          },
        ].map((kpi, i) => (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            key={kpi.label}
            className="rounded-[24px] border border-line/80 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5"
          >
            <div className={`flex size-11 items-center justify-center rounded-2xl ${kpi.bg} ${kpi.color} mb-4 shadow-2xs`}>
              <kpi.icon size={22} />
            </div>
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.14em]">
              {kpi.label}
            </p>
            <p className="text-3xl font-serif font-bold text-ink-head mt-1">{kpi.value}</p>
            <p className="text-xs text-ink-muted mt-1.5 font-medium">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Breakdown Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pet Inventory Distribution */}
        <div className="rounded-[28px] border border-line/80 bg-white p-8 shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-line-soft pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-head">Inventory Distribution</h3>
              <p className="text-xs text-ink-muted mt-0.5">Breakdown across shelter lifecycle stages</p>
            </div>
            <span className="rounded-full bg-cream-dim px-2.5 py-1 text-xs font-bold text-ink-head">
              {stats.totalPets} Pets
            </span>
          </div>

          {stats.totalPets === 0 ? (
            <p className="text-sm text-ink-muted py-6 text-center italic">
              Add pets to your listings to view live distribution stats.
            </p>
          ) : (
            <div className="space-y-5">
              {/* Available Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Available for Adoption
                  </span>
                  <span className="text-ink-head">{stats.available} ({availPct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-cream-dim overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
                    style={{ width: `${availPct}%` }}
                  />
                </div>
              </div>

              {/* Pending Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-800 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Application / Interview Pending
                  </span>
                  <span className="text-ink-head">{stats.pendingPets} ({pendPct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-cream-dim overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${pendPct}%` }}
                  />
                </div>
              </div>

              {/* Adopted Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-forest flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-forest" />
                    Adoption Successfully Completed
                  </span>
                  <span className="text-ink-head">{stats.adopted} ({adoptPct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-cream-dim overflow-hidden">
                  <div
                    className="h-full bg-forest rounded-full transition-all duration-1000"
                    style={{ width: `${adoptPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pipeline & Verification Summary */}
        <div className="rounded-[28px] border border-line/80 bg-white p-8 shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-line-soft pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-head">Verification Pipeline</h3>
              <p className="text-xs text-ink-muted mt-0.5">Adoption application funnel</p>
            </div>
            <span className="rounded-full bg-cream-dim px-2.5 py-1 text-xs font-bold text-ink-head">
              {stats.pendingApps + stats.interviewScheduled + stats.adopted} Total
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-line-soft bg-cream-soft/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-xs">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-head">Pending Application Review</p>
                  <p className="text-[11px] text-ink-muted">Awaiting initial shelter review</p>
                </div>
              </div>
              <span className="font-serif text-xl font-bold text-ink-head">{stats.pendingApps}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-line-soft bg-cream-soft/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-head">Active Virtual Interviews</p>
                  <p className="text-[11px] text-ink-muted">Google Meet verification scheduled</p>
                </div>
              </div>
              <span className="font-serif text-xl font-bold text-ink-head">{stats.interviewScheduled}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-line-soft bg-cream-soft/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-forest text-gold font-bold text-xs">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-head">Finalized Adoptions</p>
                  <p className="text-[11px] text-ink-muted">Successfully paired with families</p>
                </div>
              </div>
              <span className="font-serif text-xl font-bold text-ink-head">{stats.adopted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
