import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from './StatusBadge'
import { Sparkles, Heart, Zap, ShieldAlert, Award } from 'lucide-react'

export default function PetHoverPreview({ pet, children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef(null)
  const triggerRef = useRef(null)

  const handleMouseEnter = (e) => {
    if (!pet) return
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        // Determine position: prefer right or top
        const spaceRight = window.innerWidth - rect.right
        const spaceBottom = window.innerHeight - rect.bottom

        let x = rect.left + rect.width / 2
        let y = rect.bottom + 8

        // If overflowing bottom, show above
        if (spaceBottom < 320 && rect.top > 320) {
          y = rect.top - 8
        }

        // Clamp x to viewport
        if (x + 140 > window.innerWidth) {
          x = window.innerWidth - 150
        } else if (x - 140 < 10) {
          x = 150
        }

        setCoords({ x, y, showAbove: spaceBottom < 320 && rect.top > 320 })
        setIsOpen(true)
      }
    }, 150)
  }

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 100)
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  if (!pet) return <>{children}</>

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${className}`}
    >
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: coords.showAbove ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: coords.showAbove ? 8 : -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: `translate(-50%, ${coords.showAbove ? '-100%' : '0'})`,
              zIndex: 9999,
            }}
            className="pointer-events-none w-72 overflow-hidden rounded-2xl border border-line bg-white/98 p-4 shadow-2xl backdrop-blur-md"
          >
            {/* Header Photo */}
            <div className="relative h-36 w-full overflow-hidden rounded-xl bg-forest-wash">
              {pet.photoUrl ? (
                <>
                  <img
                    src={pet.photoUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-30 pointer-events-none"
                  />
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className="relative h-full w-full object-cover object-[center_20%]"
                  />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl">
                  {pet.species === 'Cat' ? '🐱' : '🐶'}
                </div>
              )}
              <div className="absolute right-2.5 top-2.5">
                <StatusBadge status={pet.adoptionStatus || 'Available'} size="xs" />
              </div>
            </div>

            {/* Details */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-lg font-bold text-ink-head leading-tight">
                  {pet.name}
                </h4>
                <span className="rounded-md bg-cream-dim px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                  {pet.species}
                </span>
              </div>

              <p className="text-xs font-semibold text-forest">
                {pet.breed || 'Unknown breed'}
              </p>

              <p className="text-[11px] text-ink-muted">
                {pet.age != null ? `${pet.age} yr${Number(pet.age) === 1 ? '' : 's'}` : 'Age unlisted'} · {pet.size || 'Medium size'} · {pet.temperament || 'Friendly'}
              </p>

              {/* Energy & Child rating tags */}
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-line-soft pt-2 text-[10px]">
                <div className="rounded-lg bg-cream-soft p-1.5 flex items-center gap-1.5">
                  <Zap size={11} className="text-amber-600 shrink-0" />
                  <span className="truncate">
                    Energy: <strong>{pet.energyLevel ? `${pet.energyLevel}/5` : 'Default'}</strong>
                  </span>
                </div>
                <div className="rounded-lg bg-cream-soft p-1.5 flex items-center gap-1.5">
                  <Heart size={11} className="text-rose-500 shrink-0" />
                  <span className="truncate">
                    Child: <strong>{pet.childFriendly ? `${pet.childFriendly}/5` : 'Default'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

