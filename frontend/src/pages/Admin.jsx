import { useEffect, useState } from 'react'
import { listUsers, listPets, listApplications } from '../lib/api'
import { Users, PawPrint, ClipboardList, Heart } from 'lucide-react'

export default function Admin() {
  const [d, setD] = useState({ users: [], pets: [], apps: [] })
  useEffect(() => {
    Promise.all([listUsers(), listPets(), listApplications()])
      .then(([users, pets, apps]) => setD({ users, pets, apps }))
  }, [])

  const Stat = ({ label, value, icon: Icon }) => (
    <div className="rounded-[20px] border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="label mb-0">{label}</p>
        <Icon size={16} className="text-ink-whisper" />
      </div>
      <p className="mt-3 font-serif text-4xl tracking-[-0.04em] text-forest">{value}</p>
    </div>
  )

  return (
    <div>
      <div className="mb-7">
        <p className="eyebrow">Administration</p>
        <h1 className="mt-2 h-serif text-3xl">Platform overview</h1>
        <p className="mt-2 text-sm text-ink-muted">Monitor users, listings, and adoption activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={d.users.length} icon={Users} />
        <Stat label="Pet listings" value={d.pets.length} icon={PawPrint} />
        <Stat label="Applications" value={d.apps.length} icon={ClipboardList} />
        <Stat label="Completed adoptions" value={d.apps.filter(a => a.status === 'Adoption Completed').length} icon={Heart} />
      </div>

      <div className="mt-8 overflow-hidden rounded-[20px] border border-line bg-white shadow-soft">
        <div className="border-b border-line-soft px-6 py-4">
          <h2 className="h-serif text-lg">All users</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            <tr>
              <th className="px-6 py-3 font-bold">Name</th>
              <th className="px-6 py-3 font-bold">Email</th>
              <th className="px-6 py-3 font-bold">Role</th>
            </tr>
          </thead>
          <tbody>
            {d.users.map(u => (
              <tr key={u.id} className="border-t border-line-soft">
                <td className="px-6 py-4 font-semibold text-ink-head">{u.name}</td>
                <td className="px-6 py-4 text-ink-muted">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-forest-tint px-2.5 py-1 text-[11px] font-bold capitalize text-forest">{u.role}</span>
                </td>
              </tr>
            ))}
            {d.users.length === 0 && (
              <tr><td colSpan="3" className="px-6 py-10 text-center text-sm text-ink-muted">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}