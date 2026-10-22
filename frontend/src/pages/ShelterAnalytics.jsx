import { BarChart3, TrendingUp, Users, PawPrint } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ShelterAnalytics() {
  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow">Insights</p>
        <h1 className="mt-2 h-serif text-3xl">Shelter Analytics</h1>
        <p className="mt-2 text-sm text-ink-muted">Track adoption rates and application metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Adoptions', value: '142', icon: PawPrint, color: 'text-forest', bg: 'bg-forest-wash' },
          { label: 'Active Applications', value: '28', icon: Users, color: 'text-gold-ink', bg: 'bg-gold-soft' },
          { label: 'Match Rate', value: '84%', icon: TrendingUp, color: 'text-terracotta-deep', bg: 'bg-terracotta-soft' },
          { label: 'Avg. Time to Adopt', value: '14d', icon: BarChart3, color: 'text-ink', bg: 'bg-cream-deep' },
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

      {/* Placeholder Chart Area */}
      <div className="rounded-[20px] border border-line bg-white p-8 shadow-soft flex flex-col items-center justify-center min-h-[300px]">
        <BarChart3 size={48} className="text-ink-whisper mb-4" />
        <h3 className="text-lg font-bold text-ink-head">Adoption Trends Chart</h3>
        <p className="text-sm text-ink-muted mt-1 max-w-sm text-center">Interactive visualizations of monthly adoption rates will appear here in Sprint III.</p>
      </div>
    </div>
  )
}