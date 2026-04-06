import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiSecurity'
import { getCreditStatus } from '@/lib/credits'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse(authError || undefined)

    const creditStatus = await getCreditStatus(user.id)
    return NextResponse.json(creditStatus)
  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json({ error: 'Failed to fetch credit status' }, { status: 500 })
  }
}
