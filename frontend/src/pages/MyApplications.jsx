import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listApplications, updateApplication } from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import { CalendarClock, PawPrint } from 'lucide-react'

export default function MyApplications() {
  const { user } = useAuth(); const [apps, setApps] = useState([])
  const load = () => listApplications({ adopterId: user.uid }).then(setApps)
  useEffect(() => { load() }, [])
  const cancel = async id => { await updateApplication(id, { status: 'Cancelled' }); load() }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="eyebrow">Your activity</p>
        <h1 className="mt-2 h-serif text-3xl">My applications</h1>
        <p className="mt-2 text-sm text-ink-muted">Track the status of every adoption you've applied for.</p>
      </div>

      {apps.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-line bg-white p-10 text-center">
          <PawPrint className="mx-auto text-ink-whisper" size={22} />
          <p className="mt-3 text-sm text-ink-muted">You haven't applied for any pets yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {apps.map(a => (
          <div key={a.id} className="rounded-[18px] border border-line bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="h-serif text-lg">{a.petName}</h3>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  Match: {a.score != null ? Math.round(a.score * 100) + '%' : '—'}
                </p>
                {a.interview?.meetLink && (
                  <a className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-forest-tint px-3 py-1.5 text-xs font-bold text-forest hover:bg-forest-wash"
                    href={a.interview.meetLink} target="_blank" rel="noreferrer">
                    <CalendarClock size={13} /> Join interview · {a.interview.date} {a.interview.time}
                  </a>
                )}
              </div>
              {a.status === 'Pending Review' && (
                <button className="btn-outline" onClick={() => cancel(a.id)}>Withdraw</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}