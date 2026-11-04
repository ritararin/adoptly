import { useEffect, useState } from 'react'
import { listUsers, listPets, listApplications } from '../lib/api'
import { Users, PawPrint, ClipboardList, Heart, ShieldCheck, Sparkles, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Admin() {
  const [d, setD] = useState({ users: [], pets: [], apps: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listUsers(), listPets(), listApplications()])
      .then(([users, pets, apps]) => setD({ users, pets, apps }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-forest">
        <Loader2 className="animate-spin text-forest" size={36} />
        <p className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          Loading platform administration data…
        </p>
      </div>
    )
  }

  const Stat = ({ label, value, sub, icon: Icon, color, bg }) => (
    <div className="rounded-[24px] border border-line/80 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5">
      <div className={`flex size-11 items-center justify-center rounded-2xl ${bg} ${color} mb-4 shadow-2xs`}>
        <Icon size={22} />
      </div>
      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 font-serif text-3xl font-bold text-ink-head">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </div>
  )

  const completedAdoptions = d.apps.filter(a => a.status === 'Adoption Completed').length

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest-wash/80 px-3 py-1 text-xs font-bold text-forest shadow-2xs backdrop-blur-xs">
          <ShieldCheck size={13} className="text-forest" />
          <span>System Administration</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-head sm:text-4xl">
          Platform Overview
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Audit registered users, active animal shelter listings, and adoption applications across Adoptly.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Users" value={d.users.length} sub="Registered accounts" icon={Users} color="text-forest" bg="bg-forest-wash" />
        <Stat label="Pet Inventory" value={d.pets.length} sub="Shelter listings" icon={PawPrint} color="text-amber-800" bg="bg-amber-100" />
        <Stat label="Applications" value={d.apps.length} sub="Total submitted" icon={ClipboardList} color="text-ink-head" bg="bg-cream-dim" />
        <Stat label="Completed Adoptions" value={completedAdoptions} sub="Permanently placed" icon={Heart} color="text-emerald-800" bg="bg-emerald-100" />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-line/80 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
          <h2 className="font-serif text-lg font-bold text-ink-head">Registered Accounts</h2>
          <span className="rounded-full bg-cream-dim px-2.5 py-1 text-xs font-bold text-ink-head">
            {d.users.length} Total
          </span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-[10px] uppercase tracking-[0.14em] text-ink-muted border-b border-line-soft">
            <tr>
              <th className="px-6 py-3.5 font-bold">Name</th>
              <th className="px-6 py-3.5 font-bold">Email</th>
              <th className="px-6 py-3.5 font-bold">Assigned Role</th>
            </tr>
          </thead>
          <tbody>
            {d.users.map(u => (
              <tr key={u.id} className="border-t border-line-soft hover:bg-forest-wash/30 transition-colors">
                <td className="px-6 py-4 font-semibold text-ink-head">{u.name || 'Unnamed User'}</td>
                <td className="px-6 py-4 text-ink-muted text-xs font-medium">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize border ${
                      u.role === 'shelter'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : u.role === 'admin'
                        ? 'border-purple-200 bg-purple-50 text-purple-800'
                        : 'border-line bg-cream-dim text-ink-muted'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        u.role === 'shelter' ? 'bg-emerald-500' : u.role === 'admin' ? 'bg-purple-500' : 'bg-ink-whisper'
                      }`}
                    />
                    <span>{u.role || 'adopter'}</span>
                  </span>
                </td>
              </tr>
            ))}
            {d.users.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-sm text-ink-muted">
                  No users registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
