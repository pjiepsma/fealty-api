import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Pois } from '@/payload-types'

// Overpass API endpoints (fallback list)
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]

interface SyncCityPoiResponse {
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
  city: string
  country: string
}

interface OverpassPoiCity {
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
}

interface OSMTags {
  leisure?: string
  tourism?: string
  historic?: string
  amenity?: string
  name?: string
  description?: string
  'description:en'?: string
  'description:nl'?: string
  'description:de'?: string
  note?: string
  'note:en'?: string
  'note:nl'?: string
  comment?: string
  website?: string
  'contact:website'?: string
  wikipedia?: string
  'wikipedia:en'?: string
  'wikipedia:nl'?: string
}

function detectPOIType(tags: OSMTags): string {
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

async function fetchPOIsFromOverpass(
  endpoint: string,
  query: string,
  maxRetries: number = 3,
): Promise<OverpassPoiCity[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout for city-wide queries

      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'FealtyApp/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 504) {
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000
          console.warn(
            `Overpass API 504 timeout, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`,
          )
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        } else {
          console.error('Overpass API 504 timeout after all retries')
          return []
        }
      }

      if (!response.ok) {
        console.error('Overpass API error:', response.status, response.statusText)
        return []
      }

      const data = await response.json()

      if (!data.elements || !Array.isArray(data.elements)) {
        console.warn('Invalid response format from Overpass API')
        return []
      }

      interface OverpassElement {
        id: number
        type: 'node' | 'way' | 'relation'
        lat?: number
        lon?: number
        center?: {
          lat: number
          lon: number
        }
        tags: OSMTags
      }

      const mappedPOIs: OverpassPoiCity[] = data.elements
        .filter((el: OverpassElement) => el.tags?.name)
        .map((el: OverpassElement) => {
          const lat = el.lat ?? el.center?.lat
          const lon = el.lon ?? el.center?.lon
          if (lat == null || lon == null || !el.tags?.name) {
            return null
          }
          const desc =
            el.tags.description ??
            el.tags['description:en'] ??
            el.tags['description:nl'] ??
            el.tags['description:de'] ??
            el.tags.note ??
            el.tags['note:en'] ??
            el.tags['note:nl'] ??
            el.tags.comment ??
            undefined

          const cat =
            el.tags.tourism ?? el.tags.amenity ?? el.tags.leisure ?? 'other'

          return {
            id: `osm_${el.id}`,
            name: el.tags.name,
            coordinates: [lon, lat],
            latitude: lat,
            longitude: lon,
            type: detectPOIType(el.tags),
            category: cat,
            description: desc,
            website: el.tags.website ?? el.tags['contact:website'],
            wikipedia:
              el.tags.wikipedia ?? el.tags['wikipedia:en'] ?? el.tags['wikipedia:nl'],
          }
        })
        .filter((p: OverpassPoiCity | null): p is OverpassPoiCity => p !== null)

      return mappedPOIs
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000
          console.warn(
            `Request timeout, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`,
          )
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        } else {
          console.error('Request timeout after all retries')
          return []
        }
      }

      if (attempt < maxRetries) {
        const waitTime = attempt * 2000
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.warn(
          `Error fetching POIs, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries}):`,
          errorMessage,
        )
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        continue
      } else {
        console.error('Error fetching POIs after all retries:', error)
        return []
      }
    }
  }

  return []
}

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      {
        headers: {
          'User-Agent': 'FealtyApp/1.0',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.address) {
      return null
    }

    const city =
      data.address.city ??
      data.address.town ??
      data.address.village ??
      data.address.municipality

    const country = data.address.country

    if (city && country) {
      return { city, country }
    }

    return null
  } catch (error) {
    console.error('Error in reverse geocoding:', error)
    return null
  }
}

/**
 * Sync POIs for a city
 * If city found, checks if POIs exist in database, if not fetches from Overpass and stores them
 * If no city found, returns empty array (client should fallback to Overpass)
 */
export async function POST(request: NextRequest) {
  console.log('[sync-city] POST request received')
  try {
    const raw = await request.json()
    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body',
          city: null,
          country: null,
          pois: [],
          synced: false,
          count: 0,
        },
        { status: 400 },
      )
    }
    const lat = 'lat' in raw ? raw.lat : undefined
    const lng = 'lng' in raw ? raw.lng : undefined
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: lat and lng',
          city: null,
          country: null,
          pois: [],
          synced: false,
          count: 0,
        },
        { status: 400 },
      )
    }

    // Step 1: Reverse geocode to get city name
    const location = await reverseGeocode(lat, lng)

    if (!location) {
      // No city found - return empty (client should fallback to Overpass)
      console.log('[sync-city] No city found for coordinates:', { lat, lng })
      return NextResponse.json({
        success: false,
        city: null,
        country: null,
        pois: [],
        synced: false,
        count: 0,
      })
    }

    const { city, country } = location
    console.log('[sync-city] City found:', { city, country })

    const payload = await getPayload({ config })

    // Step 2: Check if POIs exist for this city
    const existingPOIs = await payload.find({
      collection: 'pois',
      where: {
        city: {
          equals: city,
        },
        country: {
          equals: country,
        },
      },
      limit: 1, // Just check if any exist
    })

    if (existingPOIs.totalDocs > 0) {
      // POIs already exist - return them
      console.log(`[sync-city] POIs already exist for ${city}, ${country} (${existingPOIs.totalDocs} POIs)`)
      
      const allPOIs = await payload.find({
        collection: 'pois',
        where: {
          city: {
            equals: city,
          },
          country: {
            equals: country,
          },
        },
        limit: 10000, // Get all POIs for the city
      })

      const pois: SyncCityPoiResponse[] = allPOIs.docs.map((p: Pois) => ({
        id: p.id,
        name: p.name,
        coordinates: p.coordinates ?? [p.longitude, p.latitude],
        latitude: p.latitude,
        longitude: p.longitude,
        type: p.type,
        category: p.category,
        description: p.description,
        website: p.website,
        wikipedia: p.wikipedia,
        city: p.city ?? city,
        country: p.country ?? country,
      }))

      return NextResponse.json({
        success: true,
        city,
        country,
        pois,
        synced: false, // Already existed
        count: pois.length,
      })
    }

    // Step 3: POIs don't exist - fetch from Overpass and store
    console.log(`[sync-city] No POIs found for ${city}, ${country}. Fetching from Overpass...`)

    // Use moderate radius for city-wide query (25km - faster, still good coverage)
    // Can be increased later if needed, but 25km covers most cities well
    const radius = 25000
    const query = `
      [out:json][timeout:30];
      (
        node["leisure"="park"](around:${radius},${lat},${lng});
        way["leisure"="park"](around:${radius},${lat},${lng});
        node["leisure"="garden"](around:${radius},${lat},${lng});
        way["leisure"="garden"](around:${radius},${lat},${lng});
        node["historic"](around:${radius},${lat},${lng});
        way["historic"](around:${radius},${lat},${lng});
        node["amenity"="place_of_worship"](around:${radius},${lat},${lng});
        node["tourism"="museum"](around:${radius},${lat},${lng});
        node["tourism"="artwork"](around:${radius},${lat},${lng});
        node["tourism"="viewpoint"](around:${radius},${lat},${lng});
      );
      out center;
    `

    // Try each endpoint with retries
    let overpassPOIs: OverpassPoiCity[] = []
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const result = await fetchPOIsFromOverpass(endpoint, query, 3)
        if (result.length > 0) {
          overpassPOIs = result
          console.log(`[sync-city] Successfully fetched ${result.length} POIs from Overpass`)
          break
        }
      } catch (_err) {
        console.warn(`[sync-city] Failed to fetch from ${endpoint}, trying next...`)
        continue
      }
    }

    if (overpassPOIs.length === 0) {
      console.warn('[sync-city] All Overpass API endpoints failed')
      return NextResponse.json({
        success: false,
        city,
        country,
        pois: [],
        synced: false,
        count: 0,
        error: 'Failed to fetch POIs from Overpass',
      })
    }

    // Step 4: Store POIs in database with city/country metadata
    console.log(`[sync-city] Storing ${overpassPOIs.length} POIs in database...`)
    const storedPOIs: SyncCityPoiResponse[] = []
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
          if (existingPOI.city == null || existingPOI.country == null) {
            await payload.update({
              collection: 'pois',
              id: existingPOI.id,
              data: { city, country },
            })
          }
          duplicateCount++
          storedPOIs.push({
            ...poi,
            city: existingPOI.city ?? city,
            country: existingPOI.country ?? country,
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
            city,
            country,
          },
        })

        storedPOIs.push({
          id: created.id,
          name: created.name,
          coordinates: created.coordinates ?? [created.longitude, created.latitude],
          latitude: created.latitude,
          longitude: created.longitude,
          type: created.type,
          category: created.category,
          description: created.description,
          website: created.website,
          wikipedia: created.wikipedia,
          city,
          country,
        })
        storedCount++
      } catch (error) {
        const msg = error instanceof Error ? error.message : ''
        if (msg.includes('E11000') || msg.includes('duplicate')) {
          duplicateCount++
          console.warn(`[sync-city] Duplicate POI skipped: ${poi.id}`)
        } else {
          console.error(`[sync-city] Error storing POI ${poi.id}:`, error)
        }
      }
    }

    console.log(`[sync-city] Stored ${storedCount} new POIs, ${duplicateCount} duplicates/skipped`)

    return NextResponse.json({
      success: true,
      city,
      country,
      pois: storedPOIs,
      synced: true, // Just synced
      count: storedPOIs.length,
    })
  } catch (error) {
    console.error('[sync-city] Error in endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync city POIs',
        message: error instanceof Error ? error.message : 'Unknown error',
        city: null,
        country: null,
        pois: [],
        synced: false,
        count: 0,
      },
      { status: 500 },
    )
  }
}

