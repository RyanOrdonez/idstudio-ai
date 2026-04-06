import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'node-html-parser'
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  checkRateLimit,
  rateLimitResponse,
} from '@/lib/apiSecurity'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (!user) return corsHeaders(unauthorizedResponse(authError || undefined))

    const rl = checkRateLimit(`enrich:${user.id}`, 10)
    if (!rl.allowed) return corsHeaders(rateLimitResponse(rl.retryAfterMs))

    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return corsHeaders(
        NextResponse.json({ error: 'url is required' }, { status: 400 })
      )
    }

    // Fetch the page HTML
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IDStudio/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!pageRes.ok) {
      return corsHeaders(
        NextResponse.json({ error: 'Failed to fetch URL' }, { status: 422 })
      )
    }

    const html = await pageRes.text()
    const root = parse(html)
    const extracted: Record<string, string | number | null> = {}

    // Layer 1: JSON-LD Product schema (highest confidence)
    const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]')
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent)
        const product = findProduct(data)
        if (product) {
          extracted.product_name = product.name || null
          extracted.brand = product.brand?.name || product.brand || null
          extracted.description = product.description || null
          extracted.sku = product.sku || product.mpn || null
          extracted.image_url = Array.isArray(product.image) ? product.image[0] : product.image || null
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
            extracted.price = parseFloat(offer.price) || null
            extracted.currency = offer.priceCurrency || 'USD'
          }
          extracted.material = product.material || null
          extracted.color = product.color || null
          break
        }
      } catch {
        // Invalid JSON-LD, continue
      }
    }

    // Layer 2: Open Graph meta tags
    if (!extracted.product_name) {
      extracted.product_name = getMeta(root, 'og:title') || null
    }
    if (!extracted.image_url) {
      extracted.image_url = getMeta(root, 'og:image') || null
    }
    if (!extracted.description) {
      extracted.description = getMeta(root, 'og:description') || null
    }
    if (!extracted.price) {
      const ogPrice = getMeta(root, 'product:price:amount')
      if (ogPrice) extracted.price = parseFloat(ogPrice)
      extracted.currency = getMeta(root, 'product:price:currency') || extracted.currency || 'USD'
    }

    // Layer 3: Title fallback
    if (!extracted.product_name) {
      const title = root.querySelector('title')?.textContent?.trim()
      if (title) {
        // Strip common suffixes like " | Retailer Name" or " - Store"
        extracted.product_name = title.split(/\s*[|–—-]\s*/)[0].trim()
      }
    }

    // Extract retailer from hostname
    try {
      const hostname = new URL(url).hostname.replace('www.', '')
      extracted.retailer = hostname.split('.')[0]
      // Capitalize first letter
      extracted.retailer = (extracted.retailer as string).charAt(0).toUpperCase() + (extracted.retailer as string).slice(1)
    } catch {
      // Invalid URL
    }

    return corsHeaders(
      NextResponse.json({
        ...extracted,
        url,
      })
    )
  } catch (error) {
    console.error('Enrich error:', error)
    return corsHeaders(
      NextResponse.json({ error: 'Failed to enrich URL' }, { status: 500 })
    )
  }
}

/** Recursively find a Product object in JSON-LD data */
function findProduct(data: any): any {
  if (!data) return null
  if (data['@type'] === 'Product') return data
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProduct(item)
      if (found) return found
    }
  }
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    return findProduct(data['@graph'])
  }
  return null
}

/** Get meta tag content by property or name */
function getMeta(root: any, name: string): string | null {
  const el =
    root.querySelector(`meta[property="${name}"]`) ||
    root.querySelector(`meta[name="${name}"]`)
  return el?.getAttribute('content') || null
}
