import { NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

/** Add CORS headers to an existing NextResponse */
export function corsHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

/** Handle CORS preflight (OPTIONS) requests */
export function handleCorsOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
