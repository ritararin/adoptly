import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listApplications, listPets, updateApplication, recordPetQueueEntry } from '../lib/api'
import { computeQueueRanks, getAppTimestamp } from '../lib/adoptionQueue'
import StatusBadge from '../components/StatusBadge'
import PetHoverPreview from '../components/PetHoverPreview'
import {
  ArrowRight,
  Inbox,
  Search,
  Filter,
  Sparkles,
  Loader2,
  Calendar,
  User,
  Heart,
  MapPin,
  Clock,
  ShieldCheck,
  Scale,
  Video,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ShelterApplications() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('valid') // 'valid' (default) | 'Pending Review' | 'Interview Scheduled' | 'resolved' | 'all'
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.uid) return
    Promise.all([
      listApplications({ shelterId: user.uid }),
      listPets({ shelterId: user.uid })
    ])
      .then(([appsData, petsData]) => {
        const petsMap = Object.fromEntries(petsData.map(p => [p.id, p]))
        const enriched = appsData.map(a => {
          const matchedPet = petsMap[a.petId] || {}
          const shelterLocation = a.shelterLocation || matchedPet.location || matchedPet.shelterLocation || ''
          return {
            ...a,
            shelterLocation,
            pet: a.pet || matchedPet || { name: a.petName, id: a.petId }
          }
        })

        const ranked = computeQueueRanks(enriched)

        // Sync computed ranks to Firestore & petQueues so adopters can see live position
        ranked.forEach(app => {
          if (app.queueRank && (app.queueRank !== app.storedQueueRank || app.queueTotal !== app.storedQueueTotal)) {
            updateApplication(app.id, {
              queueRank: app.queueRank,
              queueTotal: app.queueTotal,
              storedQueueRank: app.queueRank,
              storedQueueTotal: app.queueTotal,
              petId: app.petId,
            }).catch(() => {})
          }

          // Ensure entry is synchronized in the pet's shared queue
          if (app.petId && app.id) {
            recordPetQueueEntry(app.petId, app.id, {
              appId: app.id,
              petId: app.petId,
              adopterId: app.adopterId,
              status: app.status,
              submittedDate: app.submittedDate || app.createdAt || new Date(),
              submittedAt: getAppTimestamp(app),
              queueRank: app.queueRank,
              queueTotal: app.queueTotal,
            }).catch(() => {})
          }
        })

        // Sort: Priority #1 active applications first, then other pending, then completed
        ranked.sort((a, b) => {
          if (a.isPriority && !b.isPriority) return -1
          if (!a.isPriority && b.isPriority) return 1
          if (a.status === 'Pending Review' && b.status !== 'Pending Review') return -1
          if (a.status !== 'Pending Review' && b.status === 'Pending Review') return 1
          return (a.queueRank || 99) - (b.queueRank || 99)
        })

        setApps(ranked)
      })
      .finally(() => setLoading(false))
  }, [user?.uid])

  const isValidRequest = (a) => a.status === 'Pending Review' || a.status === 'Interview Scheduled'
  const isResolvedRequest = (a) =>
    a.status === 'Adoption Completed' ||
    a.status === 'Rejected' ||
    a.status === 'Cancelled' ||
    a.status === 'Failed Adoption'

  const validCount = apps.filter(isValidRequest).length
  const pendingCount = apps.filter(a => a.status === 'Pending Review').length
  const interviewCount = apps.filter(a => a.status === 'Interview Scheduled').length
  const resolvedCount = apps.filter(isResolvedRequest).length

  const filteredApps = apps.filter(a => {
    let matchesFilter = true
    if (filter === 'valid') {
      matchesFilter = isValidRequest(a)
    } else if (filter === 'resolved') {
      matchesFilter = isResolvedRequest(a)
    } else if (filter !== 'all') {
      matchesFilter = a.status === filter
    }

    const matchesSearch =
      (a.adopterName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.petName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.shelterLocation || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.status || '').toLowerCase().includes(search.toLowerCase())

    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-forest">
        <Loader2 className="animate-spin text-forest" size={36} />
        <p className="text-xs font-semibold tracking-wider uppercase text-ink-muted">
          Loading application queue…
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest-wash/80 px-3 py-1 text-xs font-bold text-forest shadow-2xs backdrop-blur-xs">
            <Sparkles size={13} className="text-forest animate-pulse" />
            <span>Adoption Applications</span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-head sm:text-4xl">
            Review Queue
          </h1>
          <p className="mt-2 text-sm text-ink-muted max-w-xl">
            Review applicant lifestyle submissions, evaluate compatibility scores, and schedule virtual verification interviews.
          </p>
        </div>

        {validCount > 0 ? (
          <div className="self-start sm:self-auto rounded-xl border border-forest/20 bg-forest-wash px-3.5 py-2 text-xs font-bold text-forest shadow-2xs">
            {validCount} active request{validCount === 1 ? '' : 's'} awaiting action
          </div>
        ) : (
          <div className="self-start sm:self-auto rounded-xl border border-line bg-cream-soft px-3.5 py-2 text-xs font-medium text-ink-muted">
            Queue clear
          </div>
        )}
      </div>

      {/* Clean Queue Presence Indicator (replaces lengthy 48h review target banner) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-soft bg-white px-4 py-2.5 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-ink-muted">
          <span className="flex size-2 rounded-full bg-forest animate-pulse" />
          <span className="font-bold text-ink-head">FIFO Adoption Queue Active</span>
          <span className="text-ink-whisper">·</span>
          <span>Sorted in chronological order of submission</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-forest/20 bg-forest-wash px-2.5 py-1 text-[11px] font-bold text-forest">
          <Clock size={12} />
          <span>Applicant #1 holds priority review</span>
        </span>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'valid', label: 'Valid Requests', count: validCount },
            { id: 'Pending Review', label: 'Pending Review', count: pendingCount },
            { id: 'Interview Scheduled', label: 'Interviews', count: interviewCount },
            { id: 'resolved', label: 'Approved & Rejected', count: resolvedCount },
            { id: 'all', label: 'All Applications', count: apps.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-forest text-cream shadow-xs font-bold'
                  : 'bg-white border border-line text-ink-muted hover:border-forest/30 hover:text-ink-head font-semibold'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Search by pet, applicant or branch…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-line bg-white pl-8 pr-3 py-1.5 text-xs outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
          />
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-line bg-white p-12 text-center shadow-soft">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-cream-dim text-ink-whisper mb-3">
            <Inbox size={28} />
          </div>
          <h3 className="font-serif text-lg font-bold text-ink-head">
            {search
              ? 'No applications match your search'
              : filter === 'valid'
              ? 'All caught up!'
              : filter === 'resolved'
              ? 'No approved or rejected applications yet'
              : 'No applications found'}
          </h3>
          <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
            {search
              ? 'Try adjusting your search terms.'
              : filter === 'valid'
              ? 'There are no active or pending requests requiring shelter action right now.'
              : filter === 'resolved'
              ? 'Applications you approve or reject will be stored here to keep your active queue uncluttered.'
              : 'No applications match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredApps.map((a, index) => {
              const scorePct = a.score != null ? Math.round(a.score * 100) : null

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    to={`/shelter/applications/${a.id}`}
                    className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[22px] border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift ${
                      a.isPriority && a.status === 'Pending Review'
                        ? 'border-forest/40 ring-1 ring-forest/15'
                        : 'border-line/80 hover:border-forest/30'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-forest-wash text-forest font-serif font-bold text-base shadow-2xs">
                        {(a.petName || 'P').charAt(0)}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-ink-head group-hover:text-forest transition-colors">
                            {a.adopterName || 'Applicant'}
                          </h3>
                          <span className="text-xs text-ink-whisper">for</span>
                          <PetHoverPreview pet={a.pet}>
                            <span className="font-semibold text-sm text-forest underline decoration-dotted decoration-forest/40 underline-offset-4 cursor-pointer hover:text-forest-dark">
                              “{a.petName}”
                            </span>
                          </PetHoverPreview>
                          <StatusBadge status={a.status} size="xs" />

                          {/* Queue Position Badge */}
                          {a.queueRank != null && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                a.queueRank === 1
                                  ? 'bg-forest text-cream'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              <span>Queue #{a.queueRank}{a.queueTotal ? ` of ${a.queueTotal}` : ''}</span>
                            </span>
                          )}

                          {/* 48-Hour Review SLA Pill for Priority Applicant */}
                          {a.queueRank === 1 && a.status === 'Pending Review' && a.slaStatus && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] ${a.slaStatus.badgeColor}`}
                            >
                              <Clock size={10} />
                              <span>{a.slaStatus.text}</span>
                            </span>
                          )}

                          {a.queueRank > 1 && a.status === 'Pending Review' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-cream-dim px-2 py-0.5 text-[10px] text-ink-muted">
                              <span>Waiting in line</span>
                            </span>
                          )}

                          {a.shelterLocation && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-forest-wash px-2 py-0.5 text-[10px] font-semibold text-forest">
                              <MapPin size={10} />
                              <span>{a.shelterLocation}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-ink-muted">
                          {a.adopterProfile?.housingType || 'Housing specified'} · {a.adopterProfile?.experience || 'Experience listed'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-line-soft pt-3 sm:border-0 sm:pt-0">
                      {scorePct != null && (
                        <div className="text-right">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-whisper">
                            Compatibility
                          </span>
                          <span
                            className={`font-serif text-lg font-bold ${
                              scorePct >= 75
                                ? 'text-forest'
                                : scorePct >= 50
                                ? 'text-amber-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {scorePct}%
                          </span>
                        </div>
                      )}

                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream-dim text-ink-muted transition-colors group-hover:bg-forest group-hover:text-cream">
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
