import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================
// Auth helper — extracts and verifies JWT from request
// ============================================

export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return { user: null, token: null, error: 'Missing authorization header' }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, token: null, error: 'Invalid or expired token' }
  }

  return { user, token, error: null }
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

// ============================================
// Rate limiter — in-memory sliding window
// ============================================

interface RateLimitEntry {
  timestamps: number[]
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Array.from(rateLimitStore.entries()).forEach(([key, entry]: [string, RateLimitEntry]) => {
    entry.timestamps = entry.timestamps.filter((t: number) => now - t < 60_000)
    if (entry.timestamps.length === 0) rateLimitStore.delete(key)
  })
}, 5 * 60_000)

/**
 * Check rate limit for a given key (e.g. userId or IP).
 * @param key - Unique identifier (user ID or IP)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 60s)
 * @returns { allowed, remaining, retryAfterMs }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key) || { timestamps: [] }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = windowMs - (now - oldestInWindow)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  entry.timestamps.push(now)
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  }
}

export function rateLimitResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
    }
  )
}

// ============================================
// Prompt injection sanitization
// ============================================

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(?:a\s+)?(?:new|different)/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|(?:im_start|im_end|system|endoftext)\|>/i,
  /\bpretend\s+(?:you\s+are|to\s+be)\b/i,
  /reveal\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions)/i,
  /what\s+(?:are|is)\s+your\s+(?:system\s+)?(?:prompt|instructions)/i,
  /output\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions)/i,
]

/**
 * Sanitize user message for prompt injection attempts.
 * Returns { safe, flagged, sanitized }.
 * Does NOT block — just flags and strips dangerous patterns.
 */
export function sanitizeUserMessage(message: string): {
  safe: boolean
  flagged: string[]
  sanitized: string
} {
  const flagged: string[] = []
  let sanitized = message

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      flagged.push(pattern.source)
      sanitized = sanitized.replace(pattern, '[filtered]')
    }
  }

  // Strip any attempts to inject XML-like system tags
  sanitized = sanitized.replace(/<\/?(?:system|assistant|human|user|tool)[^>]*>/gi, '[filtered]')

  return {
    safe: flagged.length === 0,
    flagged,
    sanitized,
  }
}

// ============================================
// Input validation helpers
// ============================================

export function validateRequiredFields(
  body: Record<string, any>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Missing required field: ${field}`
    }
  }
  return null
}

export function validateStringLength(
  value: string,
  maxLength: number,
  fieldName: string
): string | null {
  if (typeof value !== 'string') return `${fieldName} must be a string`
  if (value.length > maxLength) return `${fieldName} exceeds max length of ${maxLength}`
  return null
}
