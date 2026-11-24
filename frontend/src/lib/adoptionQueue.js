/**
 * Adoption Queue & Review SLA Management (Non-Discriminatory FIFO Queue)
 *
 * Implements Option 1: First-In, First-Evaluated Queue with 48-Hour Review SLA
 * to prevent discrimination and cherry-picking when multiple qualified adopters
 * apply for the same companion pet.
 */

export const SLA_HOURS = 48

export function getAppTimestamp(app) {
  if (!app) return 0
  if (app.submittedDate?.toMillis) return app.submittedDate.toMillis()
  if (app.submittedDate?.seconds) return app.submittedDate.seconds * 1000
  if (app.submittedDate) {
    const t = new Date(app.submittedDate).getTime()
    if (!isNaN(t)) return t
  }
  if (app.createdAt?.toMillis) return app.createdAt.toMillis()
  if (app.createdAt?.seconds) return app.createdAt.seconds * 1000
  if (app.createdAt) {
    const t = new Date(app.createdAt).getTime()
    if (!isNaN(t)) return t
  }
  return 0
}

/**
 * Calculates 48-Hour Review SLA status for an application
 */
export function getSlaStatus(app) {
  const submittedMs = getAppTimestamp(app)
  if (!submittedMs) {
    return {
      hoursLeft: SLA_HOURS,
      overdueHours: 0,
      isBreached: false,
      text: `${SLA_HOURS}h remaining in 48h SLA`,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    }
  }

  const deadlineMs = submittedMs + SLA_HOURS * 60 * 60 * 1000
  const nowMs = Date.now()
  const diffMs = deadlineMs - nowMs
  const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60))

  if (hoursLeft <= 0) {
    const overdueHours = Math.abs(hoursLeft)
    return {
      hoursLeft: 0,
      overdueHours,
      isBreached: true,
      text: overdueHours > 0 ? `SLA Overdue (${overdueHours}h)` : 'SLA Overdue',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
    }
  }

  return {
    hoursLeft,
    overdueHours: 0,
    isBreached: false,
    text: `${hoursLeft}h left in review SLA`,
    badgeColor:
      hoursLeft <= 12
        ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200',
  }
}

/**
 * Computes FIFO queue rank and total for applications of a pet or shelter.
 * Applications in terminal state ('Adoption Completed', 'Cancelled', 'Failed Adoption')
 * are excluded from active queue positions.
 */
export function computeQueueRanks(applications) {
  if (!Array.isArray(applications)) return []

  // Group by petId
  const groups = {}
  applications.forEach(a => {
    const key = a.petId || 'unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  })

  const results = []

  Object.values(groups).forEach(petApps => {
    // Terminal applications
    const terminal = petApps.filter(
      a =>
        a.status === 'Adoption Completed' ||
        a.status === 'Cancelled' ||
        a.status === 'Failed Adoption'
    )

    // Active applications
    const active = petApps.filter(
      a => a.status === 'Pending Review' || a.status === 'Interview Scheduled'
    )

    // If an applicant is already 'Interview Scheduled', they are actively holding slot #1
    const scheduled = active.filter(a => a.status === 'Interview Scheduled')
    // Pending applications are sorted chronologically ascending (FIFO: earliest submission first)
    const pending = active
      .filter(a => a.status === 'Pending Review')
      .sort((a, b) => getAppTimestamp(a) - getAppTimestamp(b))

    const activeOrdered = [...scheduled, ...pending]
    const totalActive = activeOrdered.length

    activeOrdered.forEach((app, idx) => {
      const rank = idx + 1
      const sla = getSlaStatus(app)
      results.push({
        ...app,
        queueRank: rank,
        queueTotal: totalActive,
        slaStatus: sla,
        isPriority: rank === 1,
      })
    })

    terminal.forEach(app => {
      results.push({
        ...app,
        queueRank: null,
        queueTotal: totalActive,
        slaStatus: null,
        isPriority: false,
      })
    })
  })

  return results
}
