'use client'

import { useState, useEffect, useRef } from 'react'
import { useCity } from '@/context/CityContext'
import { Loader } from '@/components/loader'
import toast from 'react-hot-toast'

// ─── FONT CONFIG ─────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"
// ─────────────────────────────────────────────────────────────────────────────

interface AddCityModalProps {
    open: boolean
    onClose: () => void
}

interface NominatimResult {
    display_name: string
    lat: string
    lon: string
    address?: { country?: string; state?: string; city?: string; town?: string; village?: string }
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
    return (
        <div className="flex items-center gap-2 justify-center mb-6">
            {[1, 2, 3].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: s === step ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '999px',
                            backgroundColor: s === step ? '#34d399' : s < step ? 'rgba(52,211,153,0.4)' : 'rgba(82,82,91,0.5)',
                            transition: 'all 0.3s ease',
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

// ── Location Map ──────────────────────────────────────────────────────────────
function LocationPicker({
    lat, lng, onPick,
}: { lat: number; lng: number; onPick: (lat: number, lng: number) => void }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const markerRef = useRef<any>(null)

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return
        let mounted = true

            ; (async () => {
                const L = (await import('leaflet')).default
                if (!mounted || !containerRef.current || (containerRef.current as any)._leaflet_id) return

                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link')
                    link.id = 'leaflet-css'; link.rel = 'stylesheet'
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
                    document.head.appendChild(link)
                }
                delete (L.Icon.Default.prototype as any)._getIconUrl
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                })

                const map = L.map(containerRef.current!, { center: [lat || 20, lng || 78], zoom: lat ? 11 : 4, zoomControl: true })
                mapRef.current = map

                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap contributors &copy; CARTO', subdomains: 'abcd', maxZoom: 19,
                }).addTo(map)

                // Inject dark controls style
                const s = document.createElement('style')
                s.textContent = `
        .leaflet-control-zoom a { background: rgba(24,24,27,0.94)!important; color: #a1a1aa!important; border-color: rgba(255,255,255,0.08)!important; }
        .leaflet-control-zoom a:hover { color: #34d399!important; }
        .leaflet-control-attribution { background: rgba(24,24,27,0.8)!important; color: #52525b!important; font-size: 10px!important; }
      `
                document.head.appendChild(s)

                if (lat && lng) {
                    markerRef.current = L.marker([lat, lng]).addTo(map)
                }

                map.on('click', (e: any) => {
                    const { lat: newLat, lng: newLng } = e.latlng
                    if (markerRef.current) {
                        markerRef.current.setLatLng([newLat, newLng])
                    } else {
                        markerRef.current = L.marker([newLat, newLng]).addTo(map)
                    }
                    onPick(newLat, newLng)
                })
            })()

        return () => {
            mounted = false
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Pan map when lat/lng change externally (autocomplete)
    useEffect(() => {
        if (!mapRef.current || !lat || !lng) return
        mapRef.current.setView([lat, lng], 11)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lat, lng])

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(63,63,70,0.6)' }}
        />
    )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function AddCityModal({ open, onClose }: AddCityModalProps) {
    const { cities, refreshCities, setCurrentCity } = useCity()

    const [step, setStep] = useState(1)
    const [name, setName] = useState('')
    const [state, setState] = useState('')
    const [country, setCountry] = useState('')
    const [lat, setLat] = useState(0)
    const [lng, setLng] = useState(0)
    const [zoom] = useState(12)

    const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
    const [showSugg, setShowSugg] = useState(false)
    const [nameError, setNameError] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [locationChosen, setLocationChosen] = useState(false)

    const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    // Reset on open
    useEffect(() => {
        if (open) {
            setStep(1); setName(''); setState(''); setCountry('')
            setLat(0); setLng(0); setNameError(''); setSuggestions([])
            setShowSugg(false); setLocationChosen(false); setIsSaving(false)
        }
    }, [open])

    // Autocomplete via Nominatim
    const handleNameChange = (val: string) => {
        setName(val)
        setNameError('')
        clearTimeout(searchTimeout.current)
        if (val.trim().length < 2) { setSuggestions([]); setShowSugg(false); return }
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=5&featuretype=city`,
                    { headers: { 'Accept-Language': 'en' } },
                )
                const data: NominatimResult[] = await res.json()
                setSuggestions(data)
                setShowSugg(data.length > 0)
            } catch { /* ignore */ }
        }, 400)
    }

    const pickSuggestion = (s: NominatimResult) => {
        const cityName = s.address?.city || s.address?.town || s.address?.village || s.display_name.split(',')[0]
        setName(cityName)
        setState(s.address?.state || '')
        setCountry(s.address?.country || '')
        setLat(parseFloat(s.lat))
        setLng(parseFloat(s.lon))
        setLocationChosen(true)
        setSuggestions([])
        setShowSugg(false)
    }

    const validateStep1 = () => {
        if (!name.trim()) { setNameError('City name is required'); return false }
        const dup = cities.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())
        if (dup) { setNameError('A city with this name already exists'); return false }
        return true
    }

    const handleSubmit = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/cities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), state, country, center_lat: lat, center_lng: lng, zoom }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Failed to create city')
                setIsSaving(false)
                return
            }
            await refreshCities()
            if (data.city?.id) setCurrentCity(data.city.id)
            toast.success(`${name} added successfully!`)
            onClose()
        } catch {
            toast.error('Failed to create city. Please try again.')
            setIsSaving(false)
        }
    }

    if (!open) return null

    const STEP_LABELS = ['City Info', 'Location', 'Confirm']

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="w-full max-w-md rounded-2xl border overflow-hidden"
                style={{
                    background: '#18181b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
                    animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
                }}
            >
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.93) translateY(16px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          .city-input {
            width: 100%; background: rgba(39,39,42,0.5); border: 1px solid rgba(63,63,70,0.6);
            border-radius: 10px; padding: 10px 14px; color: #e4e4e7; font-size: 14px;
            outline: none; transition: border-color 0.2s, box-shadow 0.2s; font-family: ${FONT_BODY};
          }
          .city-input::placeholder { color: #52525b; }
          .city-input:focus { border-color: rgba(52,211,153,0.4); box-shadow: 0 0 0 3px rgba(52,211,153,0.08); }
          .city-input-error { border-color: rgba(239,68,68,0.5)!important; }
        `}</style>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div>
                        <h2 className="text-base font-bold text-zinc-100" style={{ fontFamily: FONT_DISPLAY }}>Add New City</h2>
                        <p className="text-xs text-zinc-500 mt-0.5" style={{ fontFamily: FONT_BODY }}>Step {step} of 3 — {STEP_LABELS[step - 1]}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5">
                    <StepDots step={step} />

                    {/* ── Step 1: City Info ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-[0.12em] mb-2" style={{ fontFamily: FONT_DISPLAY }}>
                                    City Name <span className="text-emerald-500 normal-case tracking-normal">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        className={`city-input${nameError ? ' city-input-error' : ''}`}
                                        placeholder="e.g. Bangalore"
                                        value={name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                                        autoComplete="off"
                                    />
                                    {showSugg && suggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border overflow-hidden"
                                            style={{ background: '#1c1c1f', borderColor: 'rgba(63,63,70,0.7)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                                                    style={{ fontFamily: FONT_BODY, borderBottom: i < suggestions.length - 1 ? '1px solid rgba(63,63,70,0.4)' : 'none' }}
                                                    onClick={() => pickSuggestion(s)}
                                                >
                                                    <div className="font-medium truncate">{s.display_name.split(',')[0]}</div>
                                                    <div className="text-xs text-zinc-600 truncate">{s.display_name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {nameError && <p className="text-xs text-red-400 mt-1.5">{nameError}</p>}
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-[0.12em] mb-2" style={{ fontFamily: FONT_DISPLAY }}>
                                    State <span className="text-zinc-600 normal-case tracking-normal font-medium">(optional)</span>
                                </label>
                                <input className="city-input" placeholder="e.g. Karnataka" value={state} onChange={(e) => setState(e.target.value)} />
                            </div>

                            {/* Country */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-[0.12em] mb-2" style={{ fontFamily: FONT_DISPLAY }}>
                                    Country <span className="text-zinc-600 normal-case tracking-normal font-medium">(optional)</span>
                                </label>
                                <input className="city-input" placeholder="e.g. India" value={country} onChange={(e) => setCountry(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Location picker ── */}
                    {step === 2 && (
                        <div>
                            <p className="text-sm text-zinc-400 mb-3" style={{ fontFamily: FONT_BODY }}>
                                Click on the map to pin the city centre.{' '}
                                {locationChosen && <span className="text-emerald-400 font-medium">Location chosen ✓</span>}
                            </p>
                            <LocationPicker lat={lat} lng={lng} onPick={(la, ln) => { setLat(la); setLng(ln); setLocationChosen(true) }} />
                            {lat !== 0 && (
                                <p className="text-xs text-zinc-600 mt-2 text-center" style={{ fontFamily: FONT_BODY }}>
                                    {lat.toFixed(5)}, {lng.toFixed(5)}
                                </p>
                            )}
                            {!locationChosen && (
                                <p className="text-xs text-zinc-600 mt-2 text-center" style={{ fontFamily: FONT_BODY }}>
                                    Tip: You can skip this step and set the location later.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Confirm ── */}
                    {step === 3 && (
                        <div>
                            <p className="text-sm text-zinc-400 mb-4" style={{ fontFamily: FONT_BODY }}>
                                Please review the details before saving.
                            </p>
                            <div className="rounded-xl border space-y-0 overflow-hidden" style={{ borderColor: 'rgba(63,63,70,0.5)' }}>
                                {[
                                    { label: 'City Name', value: name },
                                    { label: 'State', value: state || '—' },
                                    { label: 'Country', value: country || '—' },
                                    { label: 'Latitude', value: lat ? lat.toFixed(5) : '—' },
                                    { label: 'Longitude', value: lng ? lng.toFixed(5) : '—' },
                                ].map((row, i, arr) => (
                                    <div
                                        key={row.label}
                                        className="flex items-center justify-between px-4 py-3"
                                        style={{
                                            borderBottom: i < arr.length - 1 ? '1px solid rgba(63,63,70,0.4)' : 'none',
                                            backgroundColor: i % 2 === 0 ? 'rgba(39,39,42,0.3)' : 'transparent',
                                        }}
                                    >
                                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider" style={{ fontFamily: FONT_DISPLAY }}>{row.label}</span>
                                        <span className="text-sm font-semibold text-zinc-200" style={{ fontFamily: FONT_DISPLAY }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-2.5 px-6 pb-5">
                    {step > 1 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            disabled={isSaving}
                            className="flex-1 py-2.5 border border-zinc-700/60 text-zinc-400 font-semibold rounded-xl text-sm hover:border-zinc-600 hover:text-zinc-300 transition-all"
                            style={{ fontFamily: FONT_DISPLAY }}
                        >
                            Back
                        </button>
                    )}
                    {step === 1 && (
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-zinc-700/60 text-zinc-400 font-semibold rounded-xl text-sm hover:border-zinc-600 hover:text-zinc-300 transition-all"
                            style={{ fontFamily: FONT_DISPLAY }}
                        >
                            Cancel
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => {
                                if (step === 1 && !validateStep1()) return
                                setStep((s) => s + 1)
                            }}
                            className="flex-1 py-2.5 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors"
                            style={{ boxShadow: '0 0 14px rgba(52,211,153,0.2)', fontFamily: FONT_DISPLAY }}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex-1 py-2.5 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ boxShadow: '0 0 14px rgba(52,211,153,0.2)', fontFamily: FONT_DISPLAY }}
                        >
                            {isSaving ? (
                                <>
                                    <Loader variant="inline" />
                                    Adding City…
                                </>
                            ) : (
                                'Add City'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
