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

// Extended POI type for API response
type POI = Omit<Pois, 'currentKing' | 'updatedAt' | 'createdAt'> & {
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
  [key: string]: string | undefined
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
): Promise<POI[]> {
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

      const mappedPOIs = data.elements
        .filter((poi: OverpassElement) => poi.tags?.name) // Only POIs with names
        .map((poi: OverpassElement) => {
          const lat = poi.lat || poi.center?.lat
          const lon = poi.lon || poi.center?.lon

          const description =
            poi.tags.description ||
            poi.tags['description:en'] ||
            poi.tags['description:nl'] ||
            poi.tags['description:de'] ||
            poi.tags.note ||
            poi.tags['note:en'] ||
            poi.tags['note:nl'] ||
            poi.tags.comment ||
            undefined

          return {
            id: `osm_${poi.id}`,
            name: poi.tags.name,
            coordinates: [lon, lat],
            latitude: lat,
            longitude: lon,
            type: detectPOIType(poi.tags),
            category: poi.tags.tourism || poi.tags.amenity || poi.tags.leisure || 'other',
            description: description,
            website: poi.tags.website || poi.tags['contact:website'] || undefined,
            wikipedia:
              poi.tags.wikipedia ||
              poi.tags['wikipedia:en'] ||
              poi.tags['wikipedia:nl'] ||
              undefined,
          } as POI
        })

      return mappedPOIs
    } catch (error: unknown) {
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

async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ city: string; country: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      {
        headers: {
          'User-Agent': 'FealtyApp/1.0',
        },
      },
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.address) {
      return null
    }

    const city =
      data.address.city || data.address.town || data.address.village || data.address.municipality

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

interface SyncCityRequestBody {
  lat: number
  lng: number
}

/**
 * Sync POIs for a city
 * If city found, checks if POIs exist in database, if not fetches from Overpass and stores them
 * If no city found, returns empty array (client should fallback to Overpass)
 */
export async function POST(request: NextRequest) {
  console.log('[sync-city] POST request received')
  try {
    const body = (await request.json()) as SyncCityRequestBody
    const { lat, lng } = body

    if (!lat || !lng) {
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
      console.log(
        `[sync-city] POIs already exist for ${city}, ${country} (${existingPOIs.totalDocs} POIs)`,
      )

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

      const pois = allPOIs.docs.map((poi: Pois) => ({
        id: poi.id,
        name: poi.name,
        coordinates: poi.coordinates || [poi.longitude, poi.latitude],
        latitude: poi.latitude,
        longitude: poi.longitude,
        type: poi.type,
        category: poi.category,
        description: (poi as any).description,
        website: (poi as any).website,
        wikipedia: (poi as any).wikipedia,
        city: (poi as any).city,
        country: (poi as any).country,
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

    // Use larger radius for city-wide query (50km)
    const radius = 50000
    const query = `
      [out:json][timeout:60];
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
    let overpassPOIs: POI[] = []
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const result = await fetchPOIsFromOverpass(endpoint, query, 3)
        if (result.length > 0) {
          overpassPOIs = result
          console.log(`[sync-city] Successfully fetched ${result.length} POIs from Overpass`)
          break
        }
      } catch (error) {
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
    const storedPOIs: POI[] = []
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
          // POI already exists - update city/country if needed
          const existingPOI = existing.docs[0] as any
          if (!existingPOI.city || !existingPOI.country) {
            await payload.update({
              collection: 'pois',
              id: existingPOI.id,
              data: {
                city: city,
                country: country,
              },
            })
          }
          duplicateCount++
          storedPOIs.push({
            ...poi,
            city: existingPOI.city || city,
            country: existingPOI.country || country,
          })
          continue
        }

        // Create new POI with city/country metadata
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
            city: city,
            country: country,
          },
        })

        storedPOIs.push({
          id: created.id,
          name: created.name,
          coordinates: created.coordinates || [created.longitude, created.latitude],
          latitude: created.latitude,
          longitude: created.longitude,
          type: created.type,
          category: created.category,
          description: (created as any).description,
          website: (created as any).website,
          wikipedia: (created as any).wikipedia,
          city: city,
          country: country,
        })
        storedCount++
      } catch (error: any) {
        // Handle duplicate key errors or other issues
        if (error.message?.includes('E11000') || error.message?.includes('duplicate')) {
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
