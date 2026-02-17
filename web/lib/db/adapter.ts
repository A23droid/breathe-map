/**
 * Database Adapter Pattern
 * 
 * This file demonstrates the future integration point for a real database.
 * Currently uses in-memory mock data, but the interface allows easy swapping
 * to Supabase, Neon, or any other database.
 * 
 * How to integrate a real database:
 * 1. Install database driver (e.g., @supabase/supabase-js)
 * 2. Implement the DatabaseAdapter interface
 * 3. Replace import in api routes from mockZones to database adapter
 * 4. Update zone management pages to use real CRUD operations
 */

import { Zone, AQIEstimate, DatabaseAdapter } from '../types'
import { mockZones, generateMockAQIEstimates } from '../mock-data'

/**
 * Mock implementation - currently used
 */
const mockAdapter: DatabaseAdapter = {
  zones: {
    async getAll(): Promise<Zone[]> {
      return mockZones
    },

    async getById(id: string): Promise<Zone | null> {
      return mockZones.find((z) => z.id === id) || null
    },

    async create(zone: Omit<Zone, 'id' | 'created_at'>): Promise<Zone> {
      const newZone: Zone = {
        ...zone,
        id: `zone-${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      mockZones.push(newZone)
      return newZone
    },

    async update(id: string, updates: Partial<Zone>): Promise<Zone> {
      const zone = mockZones.find((z) => z.id === id)
      if (!zone) throw new Error('Zone not found')
      Object.assign(zone, updates)
      return zone
    },

    async delete(id: string): Promise<void> {
      const index = mockZones.findIndex((z) => z.id === id)
      if (index === -1) throw new Error('Zone not found')
      mockZones.splice(index, 1)
    },
  },

  aqi: {
    async estimate(zone: Zone): Promise<AQIEstimate> {
      const estimates = generateMockAQIEstimates()
      return estimates.get(zone.id) || { zone_id: zone.id, estimated_aqi: 0, category: 'good', feature_contributions: { traffic: 0, population: 0, road_network: 0, land_use: 0 }, assumptions: '', timestamp: new Date().toISOString() }
    },

    async getHistorical(zoneId: string): Promise<AQIEstimate[]> {
      // Mock implementation - returns current estimate only
      const estimates = generateMockAQIEstimates()
      const estimate = estimates.get(zoneId)
      return estimate ? [estimate] : []
    },
  },
}

/**
 * Real Database Implementation Example (Supabase)
 * 
 * const realAdapter: DatabaseAdapter = {
 *   zones: {
 *     async getAll(): Promise<Zone[]> {
 *       const { data, error } = await supabase
 *         .from('zones')
 *         .select('*')
 *       if (error) throw error
 *       return data || []
 *     },
 * 
 *     async getById(id: string): Promise<Zone | null> {
 *       const { data, error } = await supabase
 *         .from('zones')
 *         .select('*')
 *         .eq('id', id)
 *         .single()
 *       if (error) return null
 *       return data
 *     },
 * 
 *     async create(zone: Omit<Zone, 'id' | 'created_at'>): Promise<Zone> {
 *       const { data, error } = await supabase
 *         .from('zones')
 *         .insert([zone])
 *         .select()
 *         .single()
 *       if (error) throw error
 *       return data
 *     },
 * 
 *     async update(id: string, updates: Partial<Zone>): Promise<Zone> {
 *       const { data, error } = await supabase
 *         .from('zones')
 *         .update(updates)
 *         .eq('id', id)
 *         .select()
 *         .single()
 *       if (error) throw error
 *       return data
 *     },
 * 
 *     async delete(id: string): Promise<void> {
 *       const { error } = await supabase
 *         .from('zones')
 *         .delete()
 *         .eq('id', id)
 *       if (error) throw error
 *     },
 *   },
 *   // ... aqi methods similarly
 * }
 */

// Export the appropriate adapter based on environment
export const db: DatabaseAdapter = mockAdapter
// In production, switch to: export const db: DatabaseAdapter = realAdapter
