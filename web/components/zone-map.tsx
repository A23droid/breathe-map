'use client'

import { useEffect, useRef } from 'react'
import { useCity } from '@/context/CityContext'
import { injectMissingGeometry, generateSinglePolygon } from '@/lib/generateZoneGeometry'
import { cartoDarkTileUrl, CARTO_TILE_ATTRIBUTION } from '@/lib/cartoBasemap'

// ─── FONT CONFIG ────────────────────────────────────────────────────────────
// Edit these values to change fonts across all map UI (popup, legend, controls).
const FONT_IMPORT  = 'Google+Sans:wght@400;500;600;700'
const FONT_DISPLAY = "'Google Sans', system-ui, sans-serif"
const FONT_BODY    = "'Google Sans', system-ui, sans-serif"
// ────────────────────────────────────────────────────────────────────────────

// ── CPCB AQI scale ───────────────────────────────────────────────────────────
export function aqiColor(aqi: number): string {
  if (aqi <= 50)  return '#34d399'  // Good         — emerald
  if (aqi <= 100) return '#fbbf24'  // Satisfactory — amber
  if (aqi <= 200) return '#f97316'  // Moderate     — orange
  if (aqi <= 300) return '#ef4444'  // Poor         — red
  return '#a855f7'                   // Severe       — purple
}

export function aqiLabel(aqi: number): string {
  if (aqi <= 50)  return 'Good'
  if (aqi <= 100) return 'Satisfactory'
  if (aqi <= 200) return 'Moderate'
  if (aqi <= 300) return 'Poor'
  return 'Severe'
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface ZoneFeature {
  id: string
  name: string
  landUseType: string
  trafficDensity: number
  populationDensity: number
  roadLength: number
  notes?: string
  estimatedAQI: number
  geometry: GeoJSON.Geometry
}

interface ZoneMapProps {
  zones: ZoneFeature[]
  isPlacingZone?: boolean
  onZonePlaced?: (lat: number, lng: number, geometry: GeoJSON.Polygon) => void
  onPlacementCancelled?: () => void
}

// ── Popup HTML builder ───────────────────────────────────────────────────────
function buildPopupHTML(zone: any, estimatedAQI: number, color: string, label: string): string {
  const fields = [
    ['Land Use',           String(zone.landUseType || zone.land_use_type || '').replace(/_/g, ' ')],
    ['Traffic',            `${zone.trafficDensity  ?? zone.traffic_density}%`],
    ['Population',         `${zone.populationDensity ?? zone.population_density}%`],
    ['Road Network',       `${zone.roadLength ?? zone.road_length} km`],
  ]

  return `
    <div style="
      font-family: ${FONT_BODY};
      min-width: 240px;
      max-width: 280px;
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 14px;
      padding: 16px;
      color: #e4e4e7;
    ">
      <!-- Header: name + category pill -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;">
        <p style="
          font-family: ${FONT_DISPLAY};
          font-weight: 700;
          font-size: 15px;
          line-height: 1.3;
          margin: 0;
          color: #f4f4f5;
          padding-right: 4px;
        ">
          ${zone.name}
        </p>
        <span style="
          flex-shrink: 0;
          background: ${color}1a;
          color: ${color};
          border: 1px solid ${color}35;
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          font-family: ${FONT_DISPLAY};
          letter-spacing: 0.01em;
        ">${label}</span>
      </div>

      <!-- Divider -->
      <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:12px;"></div>

      <!-- Field rows -->
      <div style="display:grid;gap:8px;">
        ${fields.map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="
              color: #a1a1aa;
              font-size: 12.5px;
              font-family: ${FONT_BODY};
            ">${k}</span>
            <span style="
              color: #e4e4e7;
              font-size: 12.5px;
              font-weight: 600;
              text-transform: capitalize;
              font-family: ${FONT_DISPLAY};
            ">${v}</span>
          </div>
        `).join('')}

        <!-- AQI value — prominent -->
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin-top: 2px;
        ">
          <span style="color:#a1a1aa;font-size:12.5px;font-family:${FONT_BODY};">Estimated AQI</span>
          <span style="
            color: ${color};
            font-weight: 800;
            font-size: 22px;
            line-height: 1;
            font-family: ${FONT_DISPLAY};
          ">${estimatedAQI}</span>
        </div>

        ${zone.notes ? `
          <div style="
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 10px;
            margin-top: 2px;
          ">
            <p style="
              color: #71717a;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              margin: 0 0 5px;
              font-family: ${FONT_DISPLAY};
            ">Notes</p>
            <p style="
              color: #a1a1aa;
              font-size: 12.5px;
              margin: 0;
              line-height: 1.6;
              font-family: ${FONT_BODY};
            ">${zone.notes}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

// ── Legend HTML builder ───────────────────────────────────────────────────────
function buildLegendHTML(): string {
  const entries = [
    { range: '0 – 50',    label: 'Good',         color: '#34d399' },
    { range: '51 – 100',  label: 'Satisfactory', color: '#fbbf24' },
    { range: '101 – 200', label: 'Moderate',      color: '#f97316' },
    { range: '201 – 300', label: 'Poor',          color: '#ef4444' },
    { range: '301 – 400', label: 'Severe',        color: '#a855f7' },
  ]

  return `
    <div style="
      font-family: ${FONT_BODY};
      background: rgba(24,24,27,0.94);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 12px;
      padding: 12px 14px;
      min-width: 170px;
      backdrop-filter: blur(10px);
    ">
      <p style="
        color: #71717a;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        margin: 0 0 10px;
        font-family: ${FONT_DISPLAY};
      ">AQI Scale (CPCB)</p>

      ${entries.map(({ range, label, color }) => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
          <div style="
            width: 9px;
            height: 9px;
            border-radius: 50%;
            flex-shrink: 0;
            background: ${color};
            box-shadow: 0 0 5px ${color}90;
          "></div>
          <span style="
            color: #d4d4d8;
            font-size: 12px;
            flex: 1;
            font-family: ${FONT_BODY};
          ">${label}</span>
          <span style="
            color: #71717a;
            font-size: 10.5px;
            font-family: ${FONT_BODY};
          ">${range}</span>
        </div>
      `).join('')}
    </div>
  `
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ZoneMap({
  zones, isPlacingZone, onZonePlaced, onPlacementCancelled,
}: ZoneMapProps) {
  const containerRef     = useRef<HTMLDivElement>(null)
  const mapRef           = useRef<any>(null)
  const previewLayerRef  = useRef<any>(null)
  const { currentCity }  = useCity()

  const cityLat  = currentCity.center_lat ?? 13.0827
  const cityLng  = currentCity.center_lng ?? 80.2707
  const cityZoom = currentCity.zoom       ?? 12

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !currentCity) return

    let isMounted = true

    ;(async () => {
      const L = (await import('leaflet')).default
      if (!isMounted || !containerRef.current || (containerRef.current as any)._leaflet_id) return

      // Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id   = 'leaflet-css'
        link.rel  = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Google Fonts for popup / legend
      if (!document.getElementById('zone-map-fonts')) {
        const link = document.createElement('link')
        link.id   = 'zone-map-fonts'
        link.rel  = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap`
        document.head.appendChild(link)
      }

      // Fix webpack broken icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, {
        center: [cityLat, cityLng],
        zoom: cityZoom,
        zoomControl: true,
        attributionControl: true,
      })
      mapRef.current = map

      // Dark tile layer
      L.tileLayer(cartoDarkTileUrl(), {
        attribution: CARTO_TILE_ATTRIBUTION,
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Dark-theme Leaflet chrome overrides
      const themeStyle = document.createElement('style')
      themeStyle.textContent = `
        .zone-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
          border-radius: 14px !important;
          border: none !important;
        }
        .zone-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: normal !important;
        }
        .zone-popup .leaflet-popup-tip-container { display: none !important; }
        .zone-popup .leaflet-popup-close-button {
          color: #71717a !important;
          font-size: 18px !important;
          top: 8px !important;
          right: 10px !important;
        }
        .zone-popup .leaflet-popup-close-button:hover { color: #e4e4e7 !important; }

        .leaflet-control-zoom a {
          background: rgba(24,24,27,0.94) !important;
          color: #a1a1aa !important;
          border-color: rgba(255,255,255,0.08) !important;
          backdrop-filter: blur(8px) !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover {
          color: #34d399 !important;
          background: rgba(24,24,27,1) !important;
        }
        .leaflet-control-zoom-in  { border-radius: 10px 10px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius: 0 0 10px 10px !important; }

        .leaflet-control-attribution {
          background: rgba(24,24,27,0.80) !important;
          color: #52525b !important;
          font-size: 10px !important;
          backdrop-filter: blur(4px) !important;
          border-radius: 8px 0 0 0 !important;
        }
        .leaflet-control-attribution a { color: #71717a !important; }
      `
      document.head.appendChild(themeStyle)

      // ── Draw zones ──────────────────────────────────────────────────────────
      const allBounds: ReturnType<typeof L.latLngBounds>[] = []
      const zonedFeatures = injectMissingGeometry(zones, cityLat, cityLng)

      zonedFeatures.forEach((zone: any) => {
        const estimatedAQI = zone.estimatedAQI ?? zone.estimated_aqi ?? 50
        const color        = aqiColor(estimatedAQI)
        const label        = aqiLabel(estimatedAQI)

        const layer = L.geoJSON(zone.geometry as any, {
          style: {
            color,
            weight: 2,
            opacity: 0.85,
            fillColor: color,
            fillOpacity: 0.18,
          },
        })

        layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.40, weight: 3 }))
        layer.on('mouseout',  () => layer.setStyle({ fillOpacity: 0.18, weight: 2 }))

        layer.bindPopup(
          buildPopupHTML(zone, estimatedAQI, color, label),
          { maxWidth: 300, className: 'zone-popup' },
        )
        layer.addTo(map)

        try { allBounds.push(layer.getBounds()) } catch (_) {}
      })

      // Fit bounds
      const validBounds = allBounds.filter((b) => b?.isValid?.())
      if (validBounds.length > 0) {
        const combined = validBounds.reduce((acc, b) => acc.extend(b))
        if (combined.isValid()) {
          map.fitBounds(combined, { padding: [48, 48], animate: false })
        }
      }

      // ── Legend ──────────────────────────────────────────────────────────────
      const Legend = (L.Control as any).extend({
        options: { position: 'bottomright' },
        onAdd() {
          const el = L.DomUtil.create('div')
          el.innerHTML = buildLegendHTML()
          return el
        },
      })
      new Legend().addTo(map)
    })()

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [zones, currentCity.id, cityLat, cityLng, cityZoom])

  // ── Placement mode ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const container = map.getContainer() as HTMLElement

    if (!isPlacingZone) {
      container.style.cursor = ''
      if (previewLayerRef.current) {
        map.removeLayer(previewLayerRef.current)
        previewLayerRef.current = null
      }
      return
    }

    container.style.cursor = 'crosshair'

    const handleClick = async (e: any) => {
      if (!isPlacingZone || !onZonePlaced) return
      const { lat, lng } = e.latlng
      const geometry = generateSinglePolygon(lat, lng)

      const L = (await import('leaflet')).default
      if (previewLayerRef.current) map.removeLayer(previewLayerRef.current)

      previewLayerRef.current = L.geoJSON(geometry as any, {
        style: {
          color: '#34d399',
          weight: 2,
          opacity: 0.9,
          fillColor: '#34d399',
          fillOpacity: 0.15,
          dashArray: '6 4',
        },
      }).addTo(map)

      onZonePlaced(lat, lng, geometry)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onPlacementCancelled) onPlacementCancelled()
    }

    map.on('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      map.off('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      container.style.cursor = ''
      if (previewLayerRef.current) {
        map.removeLayer(previewLayerRef.current)
        previewLayerRef.current = null
      }
    }
  }, [isPlacingZone, onZonePlaced, onPlacementCancelled])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '100%' }}
    />
  )
}