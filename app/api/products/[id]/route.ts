import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getAuthenticatedUser,
  unauthorizedResponse,
} from '@/lib/apiSecurity'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, token, error: authError } = await getAuthenticatedUser(request)
    if (!user || !token) return corsHeaders(unauthorizedResponse(authError || undefined))

    const body = await request.json()

    const allowedFields = [
      'product_name', 'brand', 'url', 'price', 'currency', 'image_url',
      'description', 'category', 'dimensions', 'material', 'color',
      'sku', 'retailer', 'notes', 'project_id', 'archived',
    ]

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data, error } = await supabase
      .from('clipped_products')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return corsHeaders(
        NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
      )
    }

    return corsHeaders(NextResponse.json({ product: data }))
  } catch (error) {
    console.error('Product update error:', error)
    return corsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, token, error: authError } = await getAuthenticatedUser(request)
    if (!user || !token) return corsHeaders(unauthorizedResponse(authError || undefined))

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { searchParams } = new URL(request.url)
    const hard = searchParams.get('hard') === 'true'

    if (hard) {
      const { error } = await supabase
        .from('clipped_products')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user.id)

      if (error) {
        return corsHeaders(
          NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
        )
      }
    } else {
      const { error } = await supabase
        .from('clipped_products')
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .eq('user_id', user.id)

      if (error) {
        return corsHeaders(
          NextResponse.json({ error: 'Failed to archive product' }, { status: 500 })
        )
      }
    }

    return corsHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    console.error('Product delete error:', error)
    return corsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
