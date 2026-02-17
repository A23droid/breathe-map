import { NextRequest, NextResponse } from 'next/server'
import { createZone, getLatestAQIForZones, listZones } from '@/lib/db/repository'
import { Zone } from '@/lib/types'

export async function GET() {
  try {
    const zones = await listZones()
    const estimates = await getLatestAQIForZones(zones)

    return NextResponse.json({
      zones,
      estimates: Object.fromEntries(estimates),
      count: zones.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Omit<Zone, 'id' | 'created_at'>

    if (!body.name || !body.land_use_type) {
      return NextResponse.json({ error: 'Missing required zone fields' }, { status: 400 })
    }

    const zone = await createZone(body)

    return NextResponse.json({ zone }, { status: 201 })
  } catch (error) {
    console.error('Error creating zone:', error)
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
  }
}
