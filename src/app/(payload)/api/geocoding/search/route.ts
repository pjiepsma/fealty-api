import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const countryCode = searchParams.get('countryCode')

    if (!q) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: q (search query)',
        },
        { status: 400 }
      )
    }

    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=20&addressdetails=1`
    
    if (countryCode) {
      url += `&countrycodes=${countryCode.toLowerCase()}`
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FealtyApp/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Geocoding service error',
        },
        { status: response.status }
      )
    }

    interface NominatimResult {
      type: string
      name?: string
      display_name: string
      lat: string
      lon: string
      address?: {
        country?: string
      }
    }

    const data = await response.json() as NominatimResult[]

    const cities = data
      .filter((item: NominatimResult) => 
        item.type === 'city' || 
        item.type === 'town' || 
        item.type === 'village' ||
        item.type === 'municipality'
      )
      .map((item: NominatimResult) => ({
        name: item.name || item.display_name.split(',')[0],
        country: item.address?.country || '',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }))

    return NextResponse.json({
      cities,
      count: cities.length,
    })
  } catch (error) {
    console.error('Error in city search:', error)
    return NextResponse.json(
      {
        error: 'Failed to search cities',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


