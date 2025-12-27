import { NextRequest, NextResponse } from 'next/server'
import { seedRewards } from '@/scripts/seedRewards'

export async function POST(_request: NextRequest) {
  try {
    // Execute seed function
    await seedRewards()

    return NextResponse.json({
      success: true,
      message: 'Rewards seeded successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error seeding rewards:', error)
    return NextResponse.json(
      {
        error: 'Failed to seed rewards',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'POST to this endpoint to seed rewards',
    description: 'Seeds default rewards for difficulty levels 1-9',
  })
}


