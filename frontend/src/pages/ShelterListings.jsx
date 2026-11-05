import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listPets, createPet, updatePet, deletePet, uploadPetPhoto } from '../lib/api'
import { SPECIES, SIZES, TEMPERAMENTS, ENERGY } from '../lib/options'
import StatusBadge from '../components/StatusBadge'
import PetHoverPreview from '../components/PetHoverPreview'
import { Plus, X, Pencil, Trash2, ImagePlus, Loader2, PawPrint, CheckCircle2, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

const BLANK = {
  name: '', species: 'Dog', breed: '', age: 1, size: 'Medium',
  temperament: 'Friendly', energyLevel: 3, childFriendly: 4, careRequirements: '',
  healthStatus: 'Healthy', photoUrl: '', adoptionStatus: 'Available',
  location: ''
}

export default function ShelterListings() {
  const { user } = useAuth()
  const [pets, setPets] = useState([])
  const [form, setForm] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () => listPets({ shelterId: user.uid }).then(setPets)
  useEffect(() => { load() }, [])

  // Calculate KPIs
  const totalPets = pets.length
  const availablePets = pets.filter(p => p.adoptionStatus === 'Available').length
  const adoptedPets = pets.filter(p => p.adoptionStatus === 'Adopted').length

  const getDefaultLocation = () => {
    try {
      const saved = localStorage.getItem('adoptly_shelter_location')
      if (saved) return saved
    } catch {}
    if (user?.email?.includes('strathmore.edu')) return 'Nairobi - Strathmore Hub'
    return 'Nairobi - Central Shelter'
  }

  const openNew = () => {
    setForm({ ...BLANK, location: getDefaultLocation() })
    setPhotoFile(null)
    setPhotoPreview('')
    setErr('')
  }

  const openEdit = p => {
    setForm({ ...p, location: p.location || p.shelterLocation || getDefaultLocation() })
    setPhotoFile(null)
    setPhotoPreview(p.photoUrl || '')
    setErr('')
  }

  const closeForm = () => {
    setForm(null)
    setPhotoFile(null)
    setPhotoPreview('')
    setErr('')
  }

  const onPickFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setErr('Please choose an image file.')
    if (file.size > 5 * 1024 * 1024) return setErr('Image must be under 5 MB.')
    setErr('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const save = async e => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    
    try {
      let photoUrl = form.photoUrl || ''

      // 1. Try to upload the photo (with a safety try/catch so it doesn't block the save)
      if (photoFile) {
        try {
          photoUrl = await uploadPetPhoto(user.uid, photoFile)
        } catch (uploadErr) {
          console.warn("Image upload failed, saving pet without photo:", uploadErr)
        }
      }

      const shelterLocation = (form.location || form.shelterLocation || getDefaultLocation()).trim()
      try {
        localStorage.setItem('adoptly_shelter_location', shelterLocation)
      } catch {}

      const shelterName = user?.name || user?.displayName || 
        (user?.email?.includes('strathmore') ? 'Strathmore Animal Sanctuary' : 'Adoptly Rescue Center')

      // 2. Sanitize the payload to prevent Firestore "undefined" errors
      const data = { 
        ...form, 
        photoUrl, 
        age: Number(form.age) || 1, 
        shelterId: user.uid,
        shelterEmail: user.email || '',
        shelterName,
        location: shelterLocation,
        shelterLocation,
        name: form.name || '',
        species: form.species || 'Dog',
        breed: form.breed || '',
        size: form.size || 'Medium',
        temperament: form.temperament || 'Friendly',
        energyLevel: Number(form.energyLevel) || 3,
        childFriendly: Number(form.childFriendly) || 3,
        healthStatus: form.healthStatus || 'Healthy',
        adoptionStatus: form.adoptionStatus || 'Available',
        careRequirements: form.careRequirements || ''
      }
      
      delete data.id
      
      // 3. Save to Firestore
      form.id ? await updatePet(form.id, data) : await createPet(data)
      closeForm()
      load()
    } catch (x) {
      console.error("Failed to save pet:", x)
      setErr(x.message || 'Could not save pet.')
    } finally {
      setBusy(false)
    }
  }

  const f = k => ({ value: form?.[k] ?? '', onChange: e => setForm({ ...form, [k]: e.target.value }) })
  const Select = ({ k, opts }) => (
    <select className="input" {...f(k)}>{opts.map(o => <option key={o}>{o}</option>)}</select>
  )

  return (
    <div>
      {/* --- HEADER --- */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Shelter workspace</p>
          <h1 className="mt-2 h-serif text-3xl">My pet listings</h1>
          <p className="mt-2 text-sm text-ink-muted">Manage the pets available for adoption at your shelter.</p>
        </div>
        <button className="btn-primary shadow-lift hover:-translate-y-0.5 transition-transform" onClick={openNew}>
          <Plus size={16} /> Add new pet
        </button>
      </div>

      {/* --- KPI STATS ROW --- */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[22px] border border-line bg-white p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-lift">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-forest-wash text-forest shadow-2xs"><PawPrint size={24} /></div>
          <div>
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.14em]">Total Inventory</p>
            <p className="text-2xl font-serif font-bold text-ink-head mt-0.5">{totalPets}</p>
          </div>
        </div>
        <div className="rounded-[22px] border border-line bg-white p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-lift">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-2xs"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.14em]">Available for Adoption</p>
            <p className="text-2xl font-serif font-bold text-emerald-800 mt-0.5">{availablePets}</p>
          </div>
        </div>
        <div className="rounded-[22px] border border-line bg-white p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-lift">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-forest text-gold shadow-2xs"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.14em]">Placed in Homes</p>
            <p className="text-2xl font-serif font-bold text-forest mt-0.5">{adoptedPets}</p>
          </div>
        </div>
      </div>

      {/* --- FORM --- */}
      {form && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          onSubmit={save} className="mb-6 grid gap-4 overflow-hidden rounded-[20px] border border-line bg-white p-6 shadow-lift sm:grid-cols-3"
        >
          <div className="sm:col-span-3 flex items-center justify-between">
            <h2 className="h-serif text-lg">{form.id ? 'Edit pet' : 'New pet'}</h2>
            <button type="button" onClick={closeForm} className="rounded-lg p-1.5 text-ink-faint hover:bg-cream-dim transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="sm:col-span-3">
            <label className="label">Photo</label>
            <div className="flex items-start gap-4">
              <label className="group relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-cream-soft transition hover:border-forest/50 hover:bg-forest-wash">
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Pet preview" className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-ink/60 py-1 text-center text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">Change</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-ink-faint">
                    <ImagePlus size={20} />
                    <span className="text-[11px] font-bold">Add photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={onPickFile} />
              </label>
              <div className="flex-1 pt-1">
                <p className="text-xs font-semibold text-ink-head">Upload a clear photo of the pet</p>
                <p className="mt-1 text-[11px] leading-5 text-ink-muted">JPG, PNG, or WEBP — up to 5 MB.</p>
                {photoPreview && (
                  <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(''); setForm({ ...form, photoUrl: '' }) }}
                    className="mt-2 text-[11px] font-bold text-terracotta hover:text-terracotta-deep">Remove photo</button>
                )}
              </div>
            </div>
          </div>

          <div><label className="label">Name</label><input className="input" required {...f('name')} /></div>
          <div><label className="label">Species</label><Select k="species" opts={SPECIES} /></div>
          <div><label className="label">Breed</label><input className="input" required {...f('breed')} /></div>
          <div><label className="label">Age (years)</label><input className="input" type="number" min="0" step="0.5" {...f('age')} /></div>
          <div><label className="label">Size</label><Select k="size" opts={SIZES} /></div>
          <div><label className="label">Temperament</label><Select k="temperament" opts={TEMPERAMENTS} /></div>
          
          {/* Shelter Location Specification */}
          <div className="sm:col-span-2">
            <label className="label flex items-center gap-1.5">
              <MapPin size={13} className="text-forest" />
              Shelter Location / Branch
            </label>
            <input 
              className="input" 
              placeholder="e.g. Nairobi (Karen Branch), Nairobi (Central Shelter), or Austin, TX" 
              required 
              {...f('location')} 
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              Specify your shelter facility or branch so adopters can differentiate between multiple shelters.
            </p>
          </div>

          <div>
            <label className="label">Energy level (1 to 5)</label>
            <select className="input" value={form.energyLevel || 3} onChange={e => setForm({ ...form, energyLevel: Number(e.target.value) })}>
              <option value={1}>1 - Low energy</option>
              <option value={2}>2 - Gentle / Quiet</option>
              <option value={3}>3 - Moderate</option>
              <option value={4}>4 - High energy</option>
              <option value={5}>5 - Very high energy</option>
            </select>
          </div>
          <div>
            <label className="label">Child-friendliness (1 to 5)</label>
            <select className="input" value={form.childFriendly || 4} onChange={e => setForm({ ...form, childFriendly: Number(e.target.value) })}>
              <option value={1}>1 - Not suited for children</option>
              <option value={2}>2 - Cautious / Older kids only</option>
              <option value={3}>3 - Moderate / Supervised</option>
              <option value={4}>4 - Good with children</option>
              <option value={5}>5 - Exceptionally gentle with kids</option>
            </select>
          </div>
          <div><label className="label">Health status</label><input className="input" {...f('healthStatus')} /></div>
          <div><label className="label">Status</label><Select k="adoptionStatus" opts={['Available', 'Pending', 'Adopted']} /></div>
          <div className="sm:col-span-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label mb-0">Care Requirements &amp; Shelter Notes</label>
              <span className="text-[11px] font-medium text-ink-whisper">
                {(form.careRequirements || '').length} characters
              </span>
            </div>
            <textarea
              className="input min-h-[110px] resize-y text-xs leading-relaxed"
              rows={4}
              placeholder="Describe any medical needs, daily routines, exercise habits, yard preferences, or special behavioral notes (e.g. Crate trained, loves daily 45-min walks, needs a fenced yard, thrives as the only pet)..."
              value={form.careRequirements || ''}
              onChange={e => setForm({ ...form, careRequirements: e.target.value })}
            />
            <p className="mt-1.5 text-[11px] text-ink-muted">
              These notes are featured in compatibility evaluations and shown to interested adopters to ensure a seamless match.
            </p>
          </div>

          {err && <p className="sm:col-span-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">{err}</p>}

          <div className="sm:col-span-3 flex gap-2 border-t border-line-soft pt-4">
            <button className="btn-primary" disabled={busy}>
              {busy ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Listing'}
            </button>
            <button type="button" className="btn-outline" onClick={closeForm}>Cancel</button>
          </div>
        </motion.form>
      )}

      {/* --- TABLE --- */}
      <div className="overflow-hidden rounded-[24px] border border-line/80 bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-[10px] uppercase tracking-[0.14em] text-ink-muted border-b border-line-soft">
            <tr>{['Pet', 'Species', 'Breed', 'Age', 'Status', ''].map(h => <th key={h} className="px-5 py-4 font-bold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {pets.map(p => (
              <tr key={p.id} className="group border-t border-line-soft transition-colors hover:bg-forest-wash/30">
                <td className="px-5 py-4">
                  <PetHoverPreview pet={p}>
                    <div className="flex items-center gap-3 cursor-pointer">
                      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-forest-wash text-lg shadow-2xs">
                        {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" /> : (p.species === 'Cat' ? '🐱' : '🐶')}
                      </div>
                      <div>
                        <span className="font-semibold text-ink-head group-hover:text-forest transition-colors underline decoration-dotted decoration-forest/30 underline-offset-4">{p.name}</span>
                        {(p.location || p.shelterLocation) && (
                          <div className="flex items-center gap-1 text-[11px] text-forest font-medium mt-0.5">
                            <MapPin size={10} className="shrink-0" />
                            <span>{p.location || p.shelterLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </PetHoverPreview>
                </td>
                <td className="px-5 py-4 text-ink-muted text-xs font-medium">{p.species}</td>
                <td className="px-5 py-4 text-ink-muted text-xs font-medium">{p.breed}</td>
                <td className="px-5 py-4 text-ink-muted text-xs font-medium">{p.age} yr{p.age === 1 ? '' : 's'}</td>
                <td className="px-5 py-4"><StatusBadge status={p.adoptionStatus} size="xs" /></td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-forest/20 bg-forest-wash/80 px-2.5 py-1.5 text-xs font-bold text-forest hover:bg-forest hover:text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                      onClick={() => {
                        openEdit(p)
                        window.scrollTo({ top: 120, behavior: 'smooth' })
                      }}
                      title={`Edit ${p.name}`}
                    >
                      <Pencil size={12} /> <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-600 hover:text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete ${p.name}? This action cannot be undone.`)) {
                          try {
                            await deletePet(p.id)
                            await load()
                          } catch (delErr) {
                            alert(`Could not delete ${p.name}: ${delErr.message}`)
                          }
                        }
                      }}
                      title={`Delete ${p.name}`}
                    >
                      <Trash2 size={12} /> <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pets.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-cream-soft mb-4">
                      <PawPrint size={32} className="text-ink-whisper" />
                    </div>
                    <p className="text-sm font-bold text-ink-head">No pets listed yet</p>
                    <p className="text-xs text-ink-muted mt-1 max-w-xs">Get started by adding your first pet to the adoption platform.</p>
                    <button onClick={openNew} className="btn-primary mt-6 px-6">Add your first pet</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
