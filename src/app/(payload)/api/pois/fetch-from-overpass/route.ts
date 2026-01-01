import { NextRequest, NextResponse } from 'next/server'

// Overpass API endpoints (fallback list)
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]

interface POI {
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

function detectPOIType(tags: any): string {
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

async function fetchWithRetry(
  endpoint: string,
  query: string,
  maxRetries: number = 3
): Promise<POI[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(
        `${endpoint}?data=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'FealtyApp/1.0',
          },
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      // Handle 504 Gateway Timeout with retry
      if (response.status === 504) {
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000 // Exponential backoff: 2s, 4s, 6s
          console.warn(`Overpass API 504 timeout, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
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

      const mappedPOIs = data.elements
        .filter((poi: any) => poi.tags?.name) // Only POIs with names
        .map((poi: any) => {
          // For ways (polygons), use center coordinates
          const lat = poi.lat || poi.center?.lat
          const lon = poi.lon || poi.center?.lon
          
          // Try multiple description tags
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
            wikipedia: poi.tags.wikipedia || poi.tags['wikipedia:en'] || poi.tags['wikipedia:nl'] || undefined,
          } as POI
        })
      
      return mappedPOIs
    } catch (error: any) {
      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000
          console.warn(`Request timeout, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        } else {
          console.error('Request timeout after all retries')
          return []
        }
      }

      // Other errors
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000
        console.warn(`Error fetching POIs, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries}):`, error.message)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      } else {
        console.error('Error fetching POIs after all retries:', error)
        return []
      }
    }
  }

  return []
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, radius = 10000 } = body

    if (!lat || !lng) {
      return NextResponse.json(
        {
          error: 'Missing required parameters: lat and lng',
        },
        { status: 400 }
      )
    }

    const query = `
      [out:json][timeout:25];
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
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const result = await fetchWithRetry(endpoint, query, 3)
        if (result.length > 0) {
          return NextResponse.json({
            success: true,
            pois: result,
            count: result.length,
          })
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}, trying next...`)
        continue
      }
    }

    return NextResponse.json({
      success: false,
      error: 'All Overpass API endpoints failed',
      pois: [],
      count: 0,
    })
  } catch (error) {
    console.error('Error in fetch-from-overpass endpoint:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch POIs from Overpass',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

