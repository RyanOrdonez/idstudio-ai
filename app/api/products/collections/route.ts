import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  validateStringLength,
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

    const { data, error } = await supabase
      .from('product_collections')
      .select('*')
      .eq('user_id', user.id)
      .or('archived.is.null,archived.eq.false')
      .order('created_at', { ascending: false })

    if (error) {
      return corsHeaders(
        NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
      )
    }

    return corsHeaders(NextResponse.json({ collections: data || [] }))
  } catch (error) {
    console.error('Collections list error:', error)
    return corsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, token, error: authError } = await getAuthenticatedUser(request)
    if (!user || !token) return corsHeaders(unauthorizedResponse(authError || undefined))

    const { name, description, project_id } = await request.json()

    if (!name) {
      return corsHeaders(
        NextResponse.json({ error: 'name is required' }, { status: 400 })
      )
    }

    const nameError = validateStringLength(name, 200, 'name')
    if (nameError) {
      return corsHeaders(NextResponse.json({ error: nameError }, { status: 400 }))
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data, error } = await supabase
      .from('product_collections')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        project_id: project_id || null,
      })
      .select()
      .single()

    if (error) {
      return corsHeaders(
        NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
      )
    }

    return corsHeaders(NextResponse.json({ collection: data }, { status: 201 }))
  } catch (error) {
    console.error('Collection create error:', error)
    return corsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
