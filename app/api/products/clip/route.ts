import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  checkRateLimit,
  rateLimitResponse,
  validateStringLength,
} from '@/lib/apiSecurity'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'
import type { ClipProductRequest } from '@/lib/product-clipper/types'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    const { user, token, error: authError } = await getAuthenticatedUser(request)
    if (!user || !token) return corsHeaders(unauthorizedResponse(authError || undefined))

    const rl = checkRateLimit(`clip:${user.id}`, 30)
    if (!rl.allowed) return corsHeaders(rateLimitResponse(rl.retryAfterMs))

    const body: ClipProductRequest = await request.json()

    if (!body.product_name) {
      return corsHeaders(
        NextResponse.json({ error: 'product_name is required' }, { status: 400 })
      )
    }

    const nameError = validateStringLength(body.product_name, 500, 'product_name')
    if (nameError) {
      return corsHeaders(NextResponse.json({ error: nameError }, { status: 400 }))
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    // If image_url is provided, try to download and store it
    let storagePath: string | null = null
    if (body.image_url) {
      try {
        const imgRes = await fetch(body.image_url, { signal: AbortSignal.timeout(10_000) })
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
          const sanitizedName = body.product_name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50)
          const fileName = `${user.id}/products/${Date.now()}-${sanitizedName}.${ext}`

          const buffer = await imgRes.arrayBuffer()
          const { error: uploadError } = await supabase.storage
            .from('idstudio-files')
            .upload(fileName, buffer, { contentType, upsert: false })

          if (!uploadError) {
            storagePath = fileName
          }
        }
      } catch {
        // Image download failed — proceed without stored image
      }
    }

    const { data, error } = await supabase
      .from('clipped_products')
      .insert({
        user_id: user.id,
        project_id: body.project_id || null,
        product_name: body.product_name.trim(),
        brand: body.brand?.trim() || null,
        url: body.url?.trim() || null,
        price: body.price ?? null,
        currency: body.currency || 'USD',
        image_url: body.image_url || null,
        storage_path: storagePath,
        description: body.description?.trim() || null,
        category: body.category || 'other',
        dimensions: body.dimensions?.trim() || null,
        material: body.material?.trim() || null,
        color: body.color?.trim() || null,
        sku: body.sku?.trim() || null,
        retailer: body.retailer?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Product clip insert error:', error)
      return corsHeaders(
        NextResponse.json({ error: 'Failed to save product' }, { status: 500 })
      )
    }

    // Add to collection if specified
    if (body.collection_id && data) {
      await supabase.from('collection_products').insert({
        collection_id: body.collection_id,
        product_id: data.id,
        user_id: user.id,
      })
    }

    return corsHeaders(NextResponse.json({ product: data }, { status: 201 }))
  } catch (error) {
    console.error('Product clip error:', error)
    return corsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
