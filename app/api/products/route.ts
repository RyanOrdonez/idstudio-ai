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

export async function GET(request: NextRequest) {
  try {
    const { user, token, error: authError } = await getAuthenticatedUser(request)
    if (!user || !token) return corsHeaders(unauthorizedResponse(authError || undefined))

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const projectId = searchParams.get('project_id')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '50', 10), 100)

    let query = supabase
      .from('clipped_products')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .or('archived.is.null,archived.eq.false')
      .order('created_at', { ascending: false })

    if (category) query = query.eq('category', category)
    if (projectId) query = query.eq('project_id', projectId)
    if (search) {
      query = query.or(
        `product_name.ilike.%${search}%,brand.ilike.%${search}%,retailer.ilike.%${search}%,notes.ilike.%${search}%`
      )
    }

    const from = (page - 1) * perPage
    query = query.range(from, from + perPage - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('Products list error:', error)
      return corsHeaders(
        NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
      )
    }

    return corsHeaders(
      NextResponse.json({
        products: data || [],
        total: count || 0,
        page,
        per_page: perPage,
      })
    )
  } catch (error) {
    console.error('Products list error:', error)
    return corsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
