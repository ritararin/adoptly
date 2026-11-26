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
  if (typeof app === 'number') return app
  if (app.submittedAt) {
    const t = Number(app.submittedAt)
    if (!isNaN(t) && t > 0) return t
  }
  if (app.submittedDate?.toMillis) return app.submittedDate.toMillis()
  if (app.submittedDate?.seconds) return app.submittedDate.seconds * 1000
  if (typeof app.submittedDate === 'number') return app.submittedDate
  if (app.submittedDate) {
    const t = new Date(app.submittedDate).getTime()
    if (!isNaN(t)) return t
  }
  if (app.createdAt?.toMillis) return app.createdAt.toMillis()
  if (app.createdAt?.seconds) return app.createdAt.seconds * 1000
  if (typeof app.createdAt === 'number') return app.createdAt
  if (app.createdAt) {
    const t = new Date(app.createdAt).getTime()
    if (!isNaN(t)) return t
  }
  if (app.timestamp) {
    const t = Number(app.timestamp)
    if (!isNaN(t) && t > 0) return t
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
      text: `${SLA_HOURS}h review window`,
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
      text: 'Shelter reviewing now',
      badgeColor: 'bg-cream-dim text-ink-head border-line font-medium',
    }
  }

  return {
    hoursLeft,
    overdueHours: 0,
    isBreached: false,
    text: `${hoursLeft}h review window`,
    badgeColor:
      hoursLeft <= 12
        ? 'bg-amber-50 text-amber-900 border-amber-200 font-medium'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
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

/**
 * Resolves the live FIFO queue rank, total, priority flag, and SLA status
 * for an individual application among all queue entries for that pet.
 * Ensures strict chronological ordering (FIFO) so earlier applicants
 * hold priority, and later applicants are accurately placed next in line.
 */
export function resolveQueuePosition(app, queueEntries = []) {
  if (!app) {
    return { queueRank: 1, queueTotal: 1, isPriority: true, slaStatus: null }
  }

  const appId = app.id || app.appId
  const adopterId = app.adopterId

  // Clone entries list and ensure this app is represented
  const entriesCopy = [...queueEntries]
  const existingIdx = entriesCopy.findIndex(
    e =>
      (appId && (e.appId === appId || e.id === appId)) ||
      (!appId && adopterId && e.adopterId === adopterId)
  )

  let currentStatus = app.status || 'Pending Review'

  if (existingIdx >= 0) {
    const existingStatus = entriesCopy[existingIdx].status
    const appStatus = app.status
    // Give precedence to terminal or scheduled status
    currentStatus =
      appStatus === 'Cancelled' ||
      appStatus === 'Adoption Completed' ||
      appStatus === 'Rejected' ||
      appStatus === 'Failed Adoption'
        ? appStatus
        : existingStatus || appStatus || 'Pending Review'

    entriesCopy[existingIdx] = {
      ...entriesCopy[existingIdx],
      ...app,
      id: appId,
      appId,
      status: currentStatus,
    }
  } else if (appId) {
    entriesCopy.push({
      ...app,
      id: appId,
      appId,
      status: currentStatus,
    })
  }

  const isTerminal =
    currentStatus === 'Adoption Completed' ||
    currentStatus === 'Cancelled' ||
    currentStatus === 'Failed Adoption' ||
    currentStatus === 'Rejected'

  // Active applications: 'Interview Scheduled' or 'Pending Review'
  const active = entriesCopy.filter(
    e => e.status === 'Pending Review' || e.status === 'Interview Scheduled'
  )

  // Interview Scheduled applicant holds active slot #1
  const scheduled = active.filter(e => e.status === 'Interview Scheduled')
  // Pending applications sorted chronologically ascending (earliest submission first)
  const pending = active
    .filter(e => e.status === 'Pending Review')
    .sort((a, b) => getAppTimestamp(a) - getAppTimestamp(b))

  const activeOrdered = [...scheduled, ...pending]
  const totalActive = activeOrdered.length

  if (isTerminal) {
    return {
      queueRank: null,
      queueTotal: totalActive,
      isPriority: false,
      slaStatus: null,
    }
  }

  const myRankIdx = activeOrdered.findIndex(
    e =>
      (appId && (e.appId === appId || e.id === appId)) ||
      (!appId && adopterId && e.adopterId === adopterId)
  )

  const queueRank = myRankIdx >= 0 ? myRankIdx + 1 : (app.queueRank || 1)
  const queueTotal = Math.max(totalActive, queueRank, app.queueTotal || 1)
  const isPriority = queueRank === 1
  const slaStatus = getSlaStatus(app)

  return {
    queueRank,
    queueTotal,
    isPriority,
    slaStatus,
  }
}

