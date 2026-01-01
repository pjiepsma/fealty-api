import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        {
          error: 'Missing required parameters: lat and lon',
        },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      {
        headers: {
          'User-Agent': 'FealtyApp/1.0',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Geocoding service error',
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.address) {
      return NextResponse.json({
        city: null,
      })
    }

    const city = data.address.city || 
                 data.address.town || 
                 data.address.village || 
                 data.address.municipality

    const country = data.address.country

    return NextResponse.json({
      city: city
        ? {
            name: city,
            country: country,
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lon),
          }
        : null,
    })
  } catch (error) {
    console.error('Error in reverse geocoding:', error)
    return NextResponse.json(
      {
        error: 'Failed to reverse geocode',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

