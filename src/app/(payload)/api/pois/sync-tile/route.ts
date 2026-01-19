import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Pois } from '@/payload-types'

/**
 * Calculate Mapbox tile ID from lat/lng at specified zoom level
 */
function latLngToTile(lat: number, lng: number, zoom: number = 14): string {
  const n = Math.pow(2, zoom)
  const x = Math.floor((lng + 180) / 360 * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )
  return `${zoom}/${x}/${y}`
}

/**
 * Calculate tile bounds (north, south, east, west) from tile ID
 */
function tileToBounds(tileId: string): {
  north: number
  south: number
  east: number
  west: number
} {
  const [zoom, x, y] = tileId.split('/').map(Number)
  const n = Math.pow(2, zoom)
  const west = (x / n) * 360 - 180
  const east = ((x + 1) / n) * 360 - 180
  const north =
    Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * (180 / Math.PI)
  const south =
    Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * (180 / Math.PI)
  return { north, south, east, west }
}

interface SyncTilePoiResponse {
  id: string
  name: string
  coordinates: [number, number]
  latitude: number
  longitude: number
  type: string
  category: string | null | undefined
  description?: string | null
  website?: string | null
  wikipedia?: string | null
  tileId?: string | null
  createdAt?: string
}

interface OverpassPoi {
  id: string
  name: string
  coordinates: [number, number]
  latitude: number
  longitude: number
  type: string
  category: string
  description?: string
  website?: string
  wikipedia?: string
  tileId?: string
}

interface OsmTags {
  leisure?: string
  tourism?: string
  historic?: string
  amenity?: string
  name?: string
  description?: string
  'description:en'?: string
  website?: string
  wikipedia?: string
}

// Overpass API endpoints (try multiple for reliability)
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]

/**
 * Detect POI type from OSM tags
 */
function detectPOIType(tags: OsmTags): string {
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park'
  if (tags.tourism === 'museum') return 'museum'
  if (tags.tourism === 'artwork') return 'artwork'
  if (tags.tourism === 'viewpoint') return 'viewpoint'
  if (tags.historic === 'monument') return 'monument'
  if (tags.historic === 'memorial') return 'memorial'
  if (tags.historic === 'castle') return 'castle'
  if (tags.historic === 'ruins') return 'ruins'
  if (tags.historic) return 'historic'
  if (tags.amenity === 'place_of_worship') return 'church'
  return 'other'
}

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  geometry?: Array<{ lat: number; lon: number }>
  tags?: OsmTags
}

/**
 * Fetch POIs from Overpass API with retry logic
 */
async function fetchPOIsFromOverpass(
  endpoint: string,
  query: string,
  maxRetries: number = 3
): Promise<OverpassPoi[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (typeof data !== 'object' || data === null || !('elements' in data)) {
        return []
      }
      const rawElements = Array.isArray(data.elements) ? data.elements : []
      const pois: OverpassPoi[] = []

      for (const el of rawElements) {
        if (!el || typeof el !== 'object' || !('type' in el) || !('id' in el) || !('tags' in el)) {
          continue
        }
        // Overpass element shape validated by in-checks
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- external API, shape validated above
        const element = el as OverpassElement
        const tags = element.tags
        if (!tags?.name) continue

        const lat =
          element.lat ?? element.center?.lat ?? element.geometry?.[0]?.lat
        const lng =
          element.lon ?? element.center?.lon ?? element.geometry?.[0]?.lon

        if (lat == null || lng == null) continue

        const category =
          tags.leisure ??
          tags.tourism ??
          tags.historic ??
          tags.amenity ??
          'other'

        const poi: OverpassPoi = {
          id: `osm_${element.type}_${element.id}`,
          name: tags.name,
          coordinates: [lng, lat],
          latitude: lat,
          longitude: lng,
          type: detectPOIType(tags),
          category,
          description: tags.description ?? tags['description:en'],
          website: tags.website,
          wikipedia: tags.wikipedia,
        }

        pois.push(poi)
      }

      return pois
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Request failed'
      console.warn(
        `[sync-tile] Overpass attempt ${attempt}/${maxRetries} failed:`,
        errMsg
      )
      if (attempt === maxRetries) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }

  return []
}

export async function POST(request: NextRequest) {
  console.log('[sync-tile] POST request received')
  const start = Date.now()
  const payload = await getPayload({ config })

  try {
    const raw = await request.json()
    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body',
          tileId: null,
          pois: [],
          synced: false,
          count: 0,
        },
        { status: 400 }
      )
    }
    const lat = 'lat' in raw ? raw.lat : undefined
    const lng = 'lng' in raw ? raw.lng : undefined
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: lat and lng',
          tileId: null,
          pois: [],
          synced: false,
          count: 0,
        },
        { status: 400 }
      )
    }

    console.log('[sync-tile] Request params:', { lat, lng })

    // Step 1: Calculate Mapbox tile ID from coordinates (zoom 14)
    const tileId = latLngToTile(lat, lng, 14)
    console.log(`[sync-tile] Calculated tile ID: ${tileId}`)

    // Step 2: Check if POIs for this tile already exist in the database
    const existingPOIs = await payload.find({
      collection: 'pois',
      where: {
        tileId: {
          equals: tileId,
        },
      },
      limit: 1, // Only need to know if at least one exists
    })

    if (existingPOIs.totalDocs > 0) {
      console.log(
        `[sync-tile] POIs already exist for tile ${tileId}. Fetching from DB...`
      )
      const allPOIs = await payload.find({
        collection: 'pois',
        where: {
          tileId: {
            equals: tileId,
          },
        },
        limit: 10000, // Get all POIs for the tile
      })

      const pois: SyncTilePoiResponse[] = allPOIs.docs.map((poi: Pois) => ({
        id: poi.id,
        name: poi.name,
        coordinates: poi.coordinates ?? [poi.longitude, poi.latitude],
        latitude: poi.latitude,
        longitude: poi.longitude,
        type: poi.type,
        category: poi.category,
        description: poi.description,
        website: poi.website,
        wikipedia: poi.wikipedia,
        tileId: poi.tileId,
        createdAt: poi.createdAt,
      }))

      return NextResponse.json({
        success: true,
        tileId,
        pois,
        synced: false, // Already existed
        count: pois.length,
      })
    }

    // Step 3: POIs don't exist - fetch from Overpass and store
    console.log(
      `[sync-tile] No POIs found for tile ${tileId}. Fetching from Overpass...`
    )

    // Calculate tile bounds for Overpass query
    const bounds = tileToBounds(tileId)
    const centerLat = (bounds.north + bounds.south) / 2
    const centerLng = (bounds.east + bounds.west) / 2

    // Use bounding box query for better accuracy, or radius query as fallback
    // For zoom 14, tiles are ~2.5km x 4km, so use ~3km radius to cover the tile
    const radius = 3000

    const query = `
      [out:json][timeout:25];
      (
        node["leisure"="park"](around:${radius},${centerLat},${centerLng});
        way["leisure"="park"](around:${radius},${centerLat},${centerLng});
        node["leisure"="garden"](around:${radius},${centerLat},${centerLng});
        way["leisure"="garden"](around:${radius},${centerLat},${centerLng});
        node["historic"](around:${radius},${centerLat},${centerLng});
        way["historic"](around:${radius},${centerLat},${centerLng});
        node["amenity"="place_of_worship"](around:${radius},${centerLat},${centerLng});
        node["tourism"="museum"](around:${radius},${centerLat},${centerLng});
        node["tourism"="artwork"](around:${radius},${centerLat},${centerLng});
        node["tourism"="viewpoint"](around:${radius},${centerLat},${centerLng});
      );
      out center;
    `

    // Try each endpoint with retries
    let overpassPOIs: OverpassPoi[] = []
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const result = await fetchPOIsFromOverpass(endpoint, query, 3)
        if (result.length > 0) {
          overpassPOIs = result
          console.log(
            `[sync-tile] Successfully fetched ${result.length} POIs from Overpass`
          )
          break
        }
      } catch (_err) {
        console.warn(
          `[sync-tile] Failed to fetch from ${endpoint}, trying next...`
        )
        continue
      }
    }

    if (overpassPOIs.length === 0) {
      console.warn('[sync-tile] All Overpass API endpoints failed')
      return NextResponse.json({
        success: false,
        tileId,
        pois: [],
        synced: false,
        count: 0,
        error: 'Failed to fetch POIs from Overpass',
      })
    }

    // Step 4: Store POIs in database with tileId metadata
    console.log(
      `[sync-tile] Storing ${overpassPOIs.length} POIs in database...`
    )
    const storedPOIs: SyncTilePoiResponse[] = []
    let storedCount = 0
    let duplicateCount = 0

    for (const poi of overpassPOIs) {
      try {
        // Check if POI already exists (by ID)
        const existing = await payload.find({
          collection: 'pois',
          where: {
            id: {
              equals: poi.id,
            },
          },
          limit: 1,
        })

        if (existing.totalDocs > 0) {
          const existingPOI = existing.docs[0]
          const needsTileUpdate =
            existingPOI.tileId == null || existingPOI.tileId !== tileId
          if (needsTileUpdate) {
            await payload.update({
              collection: 'pois',
              id: existingPOI.id,
              data: {
                tileId: tileId,
              },
            })
          }
          duplicateCount++
          storedPOIs.push({
            ...poi,
            tileId,
          })
          continue
        }

        const created = await payload.create({
          collection: 'pois',
          data: {
            id: poi.id,
            name: poi.name,
            latitude: poi.latitude,
            longitude: poi.longitude,
            coordinates: poi.coordinates,
            type: poi.type,
            category: poi.category,
            description: poi.description,
            website: poi.website,
            wikipedia: poi.wikipedia,
            tileId,
          },
        })

        storedPOIs.push({
          id: created.id,
          name: created.name,
          coordinates:
            created.coordinates ?? [created.longitude, created.latitude],
          latitude: created.latitude,
          longitude: created.longitude,
          type: created.type,
          category: created.category,
          description: created.description,
          website: created.website,
          wikipedia: created.wikipedia,
          tileId,
        })
        storedCount++
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : ''
        const isDuplicate =
          errMsg.includes('E11000') || errMsg.includes('duplicate')
        if (isDuplicate) {
          duplicateCount++
          console.warn(`[sync-tile] Duplicate POI skipped: ${poi.id}`)
        } else {
          console.error(`[sync-tile] Error storing POI ${poi.id}:`, error)
        }
      }
    }

    console.log(
      `[sync-tile] Stored ${storedCount} new POIs, ${duplicateCount} duplicates/skipped`
    )

    const duration = Date.now() - start
    console.log(`[sync-tile] Completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      tileId,
      pois: storedPOIs,
      synced: true, // Just synced
      count: storedPOIs.length,
    })
  } catch (error) {
    console.error('[sync-tile] Error in endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync tile POIs',
        message: error instanceof Error ? error.message : 'Unknown error',
        tileId: null,
        pois: [],
        synced: false,
        count: 0,
      },
      { status: 500 }
    )
  }
}
