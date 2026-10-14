const CARTO_DARK_RASTER =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

/** CARTO raster basemaps require ?key= since Sep 2026. See carto.com/basemaps/apikey */
export function cartoDarkTileUrl(): string {
  const key = process.env.NEXT_PUBLIC_CARTO_BASEMAPS_API_KEY?.trim()
  if (!key) return CARTO_DARK_RASTER
  return `${CARTO_DARK_RASTER}?key=${encodeURIComponent(key)}`
}

export const CARTO_TILE_ATTRIBUTION =
  '&copy; OpenStreetMap contributors &copy; CARTO'
