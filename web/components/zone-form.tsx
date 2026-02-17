'use client'

import React from "react"

import { useState } from 'react'
import { Zone } from '@/lib/types'
import { generateId } from '@/lib/utils'

interface ZoneFormProps {
  initialZone?: Zone
  onSubmit: (zone: Omit<Zone, 'id' | 'created_at'> | Zone) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function ZoneForm({ initialZone, onSubmit, onCancel, isLoading }: ZoneFormProps) {
  const [formData, setFormData] = useState({
    name: initialZone?.name || '',
    land_use_type: initialZone?.land_use_type || 'mixed',
    traffic_density: initialZone?.traffic_density || 50,
    population_density: initialZone?.population_density || 50,
    road_length: initialZone?.road_length || 10,
    notes: initialZone?.notes || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (initialZone) {
      onSubmit({ ...initialZone, ...formData })
    } else {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Zone Name *
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g., Downtown Commercial District"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="land_use_type" className="block text-sm font-medium mb-2">
            Land Use Type
          </label>
          <select
            id="land_use_type"
            name="land_use_type"
            value={formData.land_use_type}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="green_space">Green Space</option>
            <option value="mixed">Mixed Use</option>
          </select>
        </div>

        <div>
          <label htmlFor="road_length" className="block text-sm font-medium mb-2">
            Road Network Length (km): {formData.road_length}
          </label>
          <input
            id="road_length"
            type="range"
            name="road_length"
            min="0"
            max="50"
            step="0.5"
            value={formData.road_length}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="traffic_density" className="block text-sm font-medium mb-2">
            Traffic Density: {formData.traffic_density}%
          </label>
          <input
            id="traffic_density"
            type="range"
            name="traffic_density"
            min="0"
            max="100"
            step="5"
            value={formData.traffic_density}
            onChange={handleChange}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">0% = minimal traffic, 100% = gridlock</p>
        </div>

        <div>
          <label htmlFor="population_density" className="block text-sm font-medium mb-2">
            Population Density: {formData.population_density}%
          </label>
          <input
            id="population_density"
            type="range"
            name="population_density"
            min="0"
            max="100"
            step="5"
            value={formData.population_density}
            onChange={handleChange}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">0% = unpopulated, 100% = densely packed</p>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Additional information about this zone..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Zone'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-secondary text-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
