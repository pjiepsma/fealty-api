import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { Pois } from '@/payload-types'

type PoisWithDistance = Pois & { distance: number }

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const radius = searchParams.get('radius') || '5000'
    const limit = searchParams.get('limit') || '100'

    // Validate parameters
    if (!latitude || !longitude) {
      return NextResponse.json(
        {
          error: 'Missing required parameters: latitude and longitude',
        },
        { status: 400 }
      )
    }

    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    const maxDistance = parseInt(radius, 10) // in meters
    const maxResults = parseInt(limit, 10)

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        {
          error: 'Invalid latitude or longitude',
        },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Query POIs using MongoDB geospatial query
    const pois = await payload.find({
      collection: 'pois',
      where: {
        coordinates: {
          near: [lon, lat, maxDistance],
        },
      },
      limit: maxResults,
      depth: 1,
    })

    // Calculate distance for each POI (in meters)
    const poisWithDistance: PoisWithDistance[] = pois.docs.map((poi: Pois) => {
      if (poi.coordinates) {
        const [poiLon, poiLat] = poi.coordinates
        const distanceKm = calculateDistance(lat, lon, poiLat, poiLon)
        const distanceMeters = distanceKm * 1000

        return {
          ...poi,
          distance: Math.round(distanceMeters), // Distance in meters
        }
      }
      // If no coordinates, set distance to Infinity so it sorts last
      return {
        ...poi,
        distance: Infinity,
      }
    })

    // Sort by distance (closest first)
    poisWithDistance.sort((a, b) => a.distance - b.distance)

    return NextResponse.json({
      docs: poisWithDistance,
      totalDocs: pois.totalDocs,
      limit: pois.limit,
      page: pois.page,
      totalPages: pois.totalPages,
    })
  } catch (error) {
    console.error('Error fetching nearby POIs:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch nearby POIs',
      },
      { status: 500 }
    )
  }
}






