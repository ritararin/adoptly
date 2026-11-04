import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

export function useUnreadNotifications(user) {
  const [hasUnread, setHasUnread] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.uid) {
      setHasUnread(false)
      setUnreadCount(0)
      return
    }

    const isShelter = user.role === 'shelter'
    const clauses = isShelter
      ? [where('shelterId', '==', user.uid)]
      : [where('adopterId', '==', user.uid)]

    const q = query(collection(db, 'adoptionApplications'), ...clauses)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let readIds = []
        try {
          const stored = localStorage.getItem(`adoptly_read_notifs_${user.uid}`)
          readIds = stored ? JSON.parse(stored) : []
        } catch {
          readIds = []
        }

        const activeAppIds = []
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (isShelter) {
            if (data.status === 'Pending Review') {
              activeAppIds.push(`app-pending-${doc.id}`)
            }
            if (data.status === 'Interview Scheduled') {
              activeAppIds.push(`interview-${doc.id}`)
            }
          } else {
            if (data.status === 'Interview Scheduled') {
              activeAppIds.push(`adopter-interview-${doc.id}`)
            }
            if (data.status === 'Adoption Completed') {
              activeAppIds.push(`adopter-completed-${doc.id}`)
            }
          }
        })

        const unreadItems = activeAppIds.filter((id) => !readIds.includes(id))
        setUnreadCount(unreadItems.length)
        setHasUnread(unreadItems.length > 0)
      },
      (error) => {
        console.warn('Realtime notifications listener error:', error)
      }
    )

    return () => unsubscribe()
  }, [user?.uid, user?.role])

  return { hasUnread, unreadCount }
}

