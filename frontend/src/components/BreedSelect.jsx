import { useState, useRef, useEffect, useMemo } from 'react'
import breedsData from '../data/breeds.json'
import { ChevronDown, Search, Check, Sparkles, X } from 'lucide-react'

export default function BreedSelect({ species = 'Dog', value = '', onChange, required = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Sync internal query when value prop updates externally
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  const normalizedSpecies = (species || 'Dog').toLowerCase() === 'cat' ? 'cats' : 'dogs'

  const breedList = useMemo(() => {
    const rawList = breedsData[normalizedSpecies] || []
    const defaults = normalizedSpecies === 'cats'
      ? ['Domestic Shorthair', 'Domestic Mediumhair', 'Domestic Longhair', 'Mixed Breed / Crossbreed']
      : ['Mixed Breed / Crossbreed', 'Domestic Mixed']

    // Unique combined list with defaults first
    const seen = new Set()
    const result = []
    for (const d of defaults) {
      seen.add(d.toLowerCase())
      result.push(d)
    }
    for (const b of rawList) {
      if (!seen.has(b.toLowerCase())) {
        seen.add(b.toLowerCase())
        result.push(b)
      }
    }
    return result
  }, [normalizedSpecies])

  // Filtered breeds based on search query
  const filteredBreeds = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return breedList
    return breedList.filter(b => b.toLowerCase().includes(q))
  }, [breedList, query])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (breedName) => {
    setQuery(breedName)
    onChange?.(breedName)
    setIsOpen(false)
  }

  const handleInputChange = (e) => {
    const nextVal = e.target.value
    setQuery(nextVal)
    onChange?.(nextVal)
    if (!isOpen) setIsOpen(true)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setQuery('')
    onChange?.('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={`Type or select ${species.toLowerCase()} breed...`}
          className="input pr-16 text-xs font-medium"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-ink-whisper">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-ink-muted rounded transition-colors"
              title="Clear breed"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="p-1 hover:text-ink-muted rounded transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating suggestions dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-line bg-white py-1.5 shadow-xl backdrop-blur-md">
          <div className="px-3 py-1.5 border-b border-line-soft text-[10px] font-bold uppercase tracking-wider text-ink-whisper flex items-center justify-between">
            <span>{species} Breeds ({filteredBreeds.length})</span>
            {query && !filteredBreeds.some(b => b.toLowerCase() === query.toLowerCase()) && (
              <span className="text-forest">Custom breed</span>
            )}
          </div>

          {filteredBreeds.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-ink-muted">
              <p>No exact match found.</p>
              <button
                type="button"
                onClick={() => handleSelect(query.trim())}
                className="mt-1 text-[11px] font-bold text-forest hover:underline"
              >
                Use "{query}" as custom breed
              </button>
            </div>
          ) : (
            filteredBreeds.map((breed) => {
              const isSelected = breed.toLowerCase() === query.toLowerCase()
              return (
                <button
                  key={breed}
                  type="button"
                  onClick={() => handleSelect(breed)}
                  className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs transition-colors hover:bg-forest-wash hover:text-forest ${
                    isSelected ? 'bg-forest-wash font-bold text-forest' : 'text-ink-head'
                  }`}
                >
                  <span className="truncate">{breed}</span>
                  {isSelected && <Check size={13} className="text-forest shrink-0 ml-2" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
