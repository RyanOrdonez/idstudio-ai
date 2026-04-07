import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  createOneTimeCheckoutSession,
  getStripeCustomerByEmail,
  createStripeCustomer,
} from '@/lib/stripe'
import { checkRateLimit, rateLimitResponse } from '@/lib/apiSecurity'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 10 payment link creates per minute per user
    const rl = checkRateLimit(`payment-link:${user.id}`, 10, 60_000)
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfterMs)
    }

    // Load invoice (RLS enforces ownership)
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (invErr) {
      console.error('Payment link invoice lookup error:', invErr)
      return NextResponse.json({ error: 'Failed to load invoice' }, { status: 500 })
    }
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Validate invoice is in a payable state
    if (invoice.status === 'paid') {
      return NextResponse.json(
        {
          error: 'already_paid',
          message: 'This invoice has already been paid.',
        },
        { status: 409 }
      )
    }
    if (invoice.status === 'canceled') {
      return NextResponse.json(
        {
          error: 'canceled',
          message: 'This invoice has been canceled and cannot accept payment.',
        },
        { status: 409 }
      )
    }

    // Validate positive total
    if (!invoice.total || invoice.total <= 0) {
      return NextResponse.json(
        {
          error: 'zero_total',
          message: 'Cannot create a payment link for a zero-total invoice.',
        },
        { status: 400 }
      )
    }

    // Resolve Stripe customer
    let stripeCustomerId: string | null = invoice.stripe_customer_id || null

    if (!stripeCustomerId) {
      // Look up the linked client for email
      if (!invoice.client_id) {
        return NextResponse.json(
          {
            error: 'no_client',
            message:
              'Link a client to this invoice before generating a payment link.',
          },
          { status: 400 }
        )
      }

      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('name, email')
        .eq('id', invoice.client_id)
        .maybeSingle()

      if (clientErr || !client) {
        return NextResponse.json(
          { error: 'client_not_found', message: 'Client not found.' },
          { status: 404 }
        )
      }

      if (!client.email) {
        return NextResponse.json(
          {
            error: 'no_client_email',
            message:
              "Add an email to this client in the Clients page before generating a payment link.",
          },
          { status: 400 }
        )
      }

      // Get or create Stripe customer by email
      let stripeCustomer = await getStripeCustomerByEmail(client.email)
      if (!stripeCustomer) {
        stripeCustomer = await createStripeCustomer(
          client.email,
          client.name || undefined
        )
      }
      stripeCustomerId = stripeCustomer.id

      // Persist on the invoice
      await supabase
        .from('invoices')
        .update({
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)
    }

    // Create the one-time Checkout session
    const appOrigin = new URL(request.url).origin
    const encodedNumber = encodeURIComponent(invoice.invoice_number)
    const session = await createOneTimeCheckoutSession({
      customerId: stripeCustomerId,
      invoiceId: invoice.id,
      amount: Number(invoice.total),
      currency: invoice.currency || 'usd',
      invoiceNumber: invoice.invoice_number,
      successUrl: `${appOrigin}/invoice-paid?invoice=${encodedNumber}`,
      cancelUrl: `${appOrigin}/invoice-canceled?invoice=${encodedNumber}`,
    })

    // Persist the new session id (defense-in-depth for webhook correlation)
    await supabase
      .from('invoices')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      expiresAt: session.expires_at,
    })
  } catch (error) {
    console.error('Payment link error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
