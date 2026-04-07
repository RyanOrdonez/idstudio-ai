'use client'

import { loadStripe } from '@stripe/stripe-js'

/**
 * Shared client-side helper that POSTs to /api/checkout and redirects the
 * browser to Stripe Checkout. Used by both the /pricing page and the
 * dashboard settings billing tab so there's one source of truth for the flow.
 *
 * Throws a user-readable Error on any failure. Callers should catch and surface
 * via inline state or toast — do NOT use alert().
 */
export async function redirectToCheckout(
  priceId: string,
  planType: 'starter' | 'pro'
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('redirectToCheckout must be called from the client')
  }

  const successUrl = `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${window.location.origin}/checkout-cancel`

  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, planType, successUrl, cancelUrl }),
  })

  const data = await res.json()
  if (!res.ok || data.error) {
    // 409 already_on_plan is the only "expected" error worth a friendly message.
    if (res.status === 409 && data.error === 'already_on_plan') {
      throw new Error(data.message || `You're already on the ${planType} plan.`)
    }
    throw new Error(data.message || data.error || `Checkout failed (${res.status})`)
  }

  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  if (!stripe) {
    throw new Error('Stripe failed to load. Check your internet connection.')
  }

  const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
  if (error) {
    throw new Error(error.message || 'Failed to redirect to Stripe Checkout')
  }
}
