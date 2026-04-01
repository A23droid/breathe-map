'use client'

import React, { useState } from 'react'
import { Zone, LandUseType } from '@/lib/types'
import { Loader } from '@/components/loader'
import { Home, Building2, Factory, Trees, Layers } from 'lucide-react'

// ─── FONT CONFIG ────────────────────────────────────────────────────────────
const FONT_IMPORT = 'Google+Sans:wght@300;400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"
// ────────────────────────────────────────────────────────────────────────────

interface ZoneFormProps {
  initialZone?: Zone
  onSubmit: (zone: Omit<Zone, 'id' | 'created_at'> | Zone) => void
  onCancel?: () => void
  isLoading?: boolean
}

// ── Slider ───────────────────────────────────────────────────────────────────
function FormSlider({
  id, name, label, hint, value, min, max, step, unit, color, onChange,
}: {
  id: string; name: string; label: string; hint?: string;
  value: number; min: number; max: number; step: number;
  unit: string; color: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-zinc-200"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {label}
        </label>
        <div
          className="px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums"
          style={{ backgroundColor: `${color}18`, color, fontFamily: FONT_DISPLAY }}
        >
          {value}{unit}
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-zinc-800 mb-2">
        <div
          className="absolute h-full rounded-full transition-all duration-100"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        <input
          id={id} name={name} type="range"
          min={min} max={max} step={step} value={value}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 shadow-md pointer-events-none transition-all duration-100"
          style={{ left: `calc(${pct}% - 7px)`, backgroundColor: color }}
        />
      </div>
      {hint && (
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{hint}</p>
      )}
    </div>
  )
}

// ── Field label ───────────────────────────────────────────────────────────────
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold text-zinc-400 uppercase tracking-[0.13em] mb-2"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      {children}
    </label>
  )
}

const LAND_USE_OPTIONS: { value: LandUseType; label: string; icon: React.ReactNode }[] = [
  { value: 'residential', label: 'Residential', icon: <Home size={13} /> },
  { value: 'commercial', label: 'Commercial', icon: <Building2 size={13} /> },
  { value: 'industrial', label: 'Industrial', icon: <Factory size={13} /> },
  { value: 'green_space', label: 'Green Space', icon: <Trees size={13} /> },
  { value: 'mixed', label: 'Mixed Use', icon: <Layers size={13} /> },
]

// ── Form ─────────────────────────────────────────────────────────────────────
export function ZoneForm({ initialZone, onSubmit, onCancel, isLoading }: ZoneFormProps) {
  const [formData, setFormData] = useState({
    name: initialZone?.name || '',
    land_use_type: (initialZone?.land_use_type || 'mixed') as LandUseType,
    traffic_density: initialZone?.traffic_density || 50,
    population_density: initialZone?.population_density || 50,
    road_length: initialZone?.road_length || 10,
    notes: initialZone?.notes || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? parseFloat(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(initialZone ? { ...initialZone, ...formData } : formData)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');

        :root {
          --font-display: ${FONT_DISPLAY};
          --font-body:    ${FONT_BODY};
        }

        .zone-form { font-family: var(--font-body); }

        .form-input {
          width: 100%;
          background: rgba(39,39,42,0.5);
          border: 1px solid rgba(63,63,70,0.6);
          border-radius: 12px;
          padding: 10px 14px;
          color: #e4e4e7;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          font-family: var(--font-body);
        }
        .form-input::placeholder { color: #71717a; }
        .form-input:focus {
          border-color: rgba(52,211,153,0.4);
          box-shadow: 0 0 0 3px rgba(52,211,153,0.08);
          background: rgba(39,39,42,0.7);
        }

        .land-use-btn {
          transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
        }
        .land-use-btn:hover { transform: translateY(-1px); }

        .glow-submit {
          box-shadow: 0 0 16px rgba(52,211,153,0.2), 0 4px 12px rgba(0,0,0,0.3);
          transition: box-shadow 0.2s ease, transform 0.15s ease, opacity 0.2s ease;
        }
        .glow-submit:hover:not(:disabled) {
          box-shadow: 0 0 28px rgba(52,211,153,0.4), 0 6px 20px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }
        .glow-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <form onSubmit={handleSubmit} className="zone-form space-y-6">

        {/* ── Zone Name ── */}
        <div>
          <FieldLabel htmlFor="name">
            Zone Name <span className="text-emerald-500 normal-case tracking-normal">*</span>
          </FieldLabel>
          <input
            id="name" type="text" name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="e.g. Downtown Commercial District"
          />
        </div>

        {/* ── Land Use Type ── */}
        <div>
          <FieldLabel>Land Use Type</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {LAND_USE_OPTIONS.map((opt) => {
              const active = formData.land_use_type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, land_use_type: opt.value }))}
                  className="land-use-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    backgroundColor: active ? 'rgba(52,211,153,0.12)' : 'rgba(39,39,42,0.5)',
                    border: `1px solid ${active ? 'rgba(52,211,153,0.35)' : 'rgba(63,63,70,0.5)'}`,
                    color: active ? '#34d399' : '#a1a1aa',
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  <span className="opacity-80">{opt.icon}</span>
                  {opt.label}
                </button>
              )
            })}
          </div>
          {/* Hidden select for form semantics / accessibility */}
          <select
            id="land_use_type" name="land_use_type"
            value={formData.land_use_type}
            onChange={handleChange}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          >
            {LAND_USE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* ── Traffic + Population sliders ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <FormSlider
            id="traffic_density" name="traffic_density"
            label="Traffic Density"
            hint="0% = minimal · 100% = gridlock"
            value={formData.traffic_density} min={0} max={100} step={5} unit="%"
            color="#f97316"
            onChange={handleChange}
          />
          <FormSlider
            id="population_density" name="population_density"
            label="Population Density"
            hint="0% = unpopulated · 100% = densely packed"
            value={formData.population_density} min={0} max={100} step={5} unit="%"
            color="#818cf8"
            onChange={handleChange}
          />
        </div>

        {/* ── Road length slider ── */}
        <div className="sm:w-1/2">
          <FormSlider
            id="road_length" name="road_length"
            label="Road Network Length"
            hint="Total km of roads within the zone"
            value={formData.road_length} min={0} max={50} step={0.5} unit=" km"
            color="#60a5fa"
            onChange={handleChange}
          />
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-zinc-800/60" />

        {/* ── Notes ── */}
        <div>
          <FieldLabel htmlFor="notes">
            Notes{' '}
            <span
              className="text-zinc-600 normal-case tracking-normal font-medium"
              style={{ fontSize: '11px' }}
            >
              (optional)
            </span>
          </FieldLabel>
          <textarea
            id="notes" name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="form-input resize-none"
            placeholder="Additional information about this zone…"
            style={{ lineHeight: '1.65' }}
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="glow-submit flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm w-full sm:w-auto"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {isLoading ? (
              <>
                <Loader variant="inline" />
                Saving…
              </>
            ) : (
              'Save Zone'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-zinc-700/60 text-zinc-400 font-semibold rounded-xl text-sm hover:border-zinc-600 hover:text-zinc-300 transition-all duration-150 w-full sm:w-auto"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Cancel
            </button>
          )}
        </div>

      </form>
    </>
  )
}