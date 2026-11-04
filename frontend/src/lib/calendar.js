/**
 * Adoptly Calendar & Meeting Utilities
 * Supports 1-click Google Calendar invites, universal .ics downloads, and email invites.
 */

/**
 * Format a Date object or ISO string to Google Calendar format (YYYYMMDDTHHmmssZ)
 */
function toUtcCompact(dateInput) {
  const d = new Date(dateInput)
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Generate a 1-click Google Calendar URL that pre-populates the event,
 * adds attendees as guests, and sets the Google Meet link.
 */
export function getGoogleCalendarUrl({
  title,
  description,
  location,
  dateTime,
  durationMinutes = 30,
  attendees = [],
}) {
  const start = new Date(dateTime)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Adoptly Pre-Adoption Interview',
    dates: `${toUtcCompact(start)}/${toUtcCompact(end)}`,
    details: description || 'Virtual verification interview via Adoptly.',
    location: location || '',
  })

  // Filter valid attendee emails
  const guestList = attendees
    .map(e => (typeof e === 'string' ? e.trim() : ''))
    .filter(e => e && e.includes('@') && !e.endsWith('.test'))
    .join(',')

  if (guestList) {
    params.set('add', guestList)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Download a universal .ics iCalendar file (Apple Calendar, Outlook, Google Calendar)
 */
export function downloadIcsFile({
  title,
  description,
  location,
  dateTime,
  durationMinutes = 30,
  attendees = [],
  filename = 'adoptly-interview.ics',
}) {
  const start = new Date(dateTime)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  const now = new Date()

  const attendeesLines = attendees
    .filter(e => typeof e === 'string' && e.includes('@') && !e.endsWith('.test'))
    .map(e => `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${e}:mailto:${e}`)
    .join('\r\n')

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Adoptly Pet Adoption//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:adoptly-${Date.now()}@adoptly-1.web.app`,
    `DTSTAMP:${toUtcCompact(now)}`,
    `DTSTART:${toUtcCompact(start)}`,
    `DTEND:${toUtcCompact(end)}`,
    `SUMMARY:${(title || 'Adoptly Pre-Adoption Interview').replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location || ''}`,
    attendeesLines,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Adoptly Interview in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate a pre-filled mailto: link to send an invitation email to adopter/shelter
 */
export function getMailtoInviteUrl({
  to,
  cc,
  petName,
  dateTime,
  meetLink,
}) {
  const formattedDate = new Date(dateTime).toLocaleString([], {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const subject = encodeURIComponent(`Virtual Interview Scheduled: ${petName || 'Pet Adoption'} via Adoptly`)
  const bodyText = `Hello,

Your pre-adoption virtual interview for ${petName || 'your pet application'} has been scheduled!

📅 Date & Time:
${formattedDate}

📹 Google Meet Link:
${meetLink}

Please join the meeting link at your scheduled time. If you need to reschedule or have questions in advance, simply reply to this email.

Looking forward to meeting you!

Warm regards,
Adoptly Shelter Team`

  const body = encodeURIComponent(bodyText)
  const ccParam = cc ? `&cc=${encodeURIComponent(cc)}` : ''

  return `mailto:${encodeURIComponent(to || '')}?subject=${subject}&body=${body}${ccParam}`
}

/**
 * Format date with human-readable relative hint (e.g. "Today · 3:00 PM", "Tomorrow · 10:00 AM", "In 3 days")
 */
export function formatInterviewBadge(dateTimeStr) {
  if (!dateTimeStr) return { dateStr: 'TBD', relative: '' }

  const target = new Date(dateTimeStr)
  const now = new Date()
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24))

  let relative = ''
  if (target.toDateString() === now.toDateString()) {
    relative = 'Today'
  } else if (diffDays === 1) {
    relative = 'Tomorrow'
  } else if (diffDays > 1 && diffDays <= 7) {
    relative = `In ${diffDays} days`
  } else if (diffDays < 0) {
    relative = 'Completed / Past'
  }

  const dateStr = target.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return { dateStr, relative }
}

