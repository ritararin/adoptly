import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listApplications } from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import { ArrowRight, Inbox } from 'lucide-react'

export default function ShelterApplications() {
  const { user } = useAuth(); const [apps, setApps] = useState([])
  useEffect(() => { listApplications({ shelterId: user.uid }).then(setApps) }, [user.uid])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7">
        <p className="eyebrow">Review queue</p>
        <h1 className="mt-2 h-serif text-3xl">Adoption applications</h1>
        <p className="mt-2 text-sm text-ink-muted">Review applicants and their predicted compatibility.</p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-line bg-white p-10 text-center">
          <Inbox className="mx-auto text-ink-whisper" size={22} />
          <p className="mt-3 text-sm text-ink-muted">No applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(a => (
            <Link key={a.id} to={`/shelter/applications/${a.id}`}
              className="group flex items-center justify-between rounded-[18px] border border-line bg-white p-5 shadow-soft transition hover:border-forest/40 hover:shadow-lift">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-ink-head">{a.adopterName} → {a.petName}</h3>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  Compatibility {a.score != null ? Math.round(a.score * 100) + '%' : '—'}
                </p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-ink-whisper transition group-hover:translate-x-0.5 group-hover:text-forest" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}