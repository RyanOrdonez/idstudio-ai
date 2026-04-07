import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { InvoicePDF } from '@/components/invoices/InvoicePDF'
import type { InvoiceWithItems } from '@/lib/invoices'

// @react-pdf/renderer requires Node runtime — it uses Buffer and binary font handling
// that aren't available on Vercel's Edge runtime.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load the invoice (RLS enforces ownership)
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (invErr) {
      console.error('Invoice PDF lookup error:', invErr)
      return NextResponse.json({ error: 'Failed to load invoice' }, { status: 500 })
    }
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Load line items, profile, client, project in parallel
    const [{ data: lineItems }, { data: profile }, clientRes, projectRes] =
      await Promise.all([
        supabase
          .from('invoice_line_items')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('position', { ascending: true }),
        supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, company_name')
          .eq('id', user.id)
          .maybeSingle(),
        invoice.client_id
          ? supabase
              .from('clients')
              .select('name, email, phone, address')
              .eq('id', invoice.client_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        invoice.project_id
          ? supabase
              .from('projects')
              .select('project_name, street_address, city, state, zipcode')
              .eq('id', invoice.project_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ])

    const invoiceWithItems: InvoiceWithItems = {
      ...invoice,
      line_items: lineItems || [],
    }

    // Render the PDF
    let buffer: Buffer
    try {
      buffer = await renderToBuffer(
        <InvoicePDF
          invoice={invoiceWithItems}
          profile={profile || null}
          client={clientRes.data || null}
          project={projectRes.data || null}
        />
      )
    } catch (renderErr) {
      console.error('PDF render error:', renderErr)
      return NextResponse.json({ error: 'Failed to render PDF' }, { status: 500 })
    }

    const download = request.nextUrl.searchParams.get('download') === '1'
    const disposition = download ? 'attachment' : 'inline'
    const filename = `invoice-${invoice.invoice_number}.pdf`

    // Convert Node Buffer to Uint8Array for Response compatibility
    const body = new Uint8Array(buffer)

    return new Response(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('PDF route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
