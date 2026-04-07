import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_CONFIG, priceIdToPlanType } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Lazy-init server-side Supabase client (env vars unavailable at build time)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Received webhook event:', event.type);
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        if (process.env.NODE_ENV === 'development') {
          console.log(`Unhandled event type: ${event.type}`);
        }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    // Return 500 so Stripe retries the webhook
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Get customer to find user
  const customer = await stripe.customers.retrieve(subscription.customer as string);

  if (!customer || customer.deleted) {
    throw new Error(`Customer not found for subscription: ${subscription.id}`);
  }

  const customerEmail = (customer as Stripe.Customer).email;
  if (!customerEmail) {
    throw new Error(`Customer email not found for subscription: ${subscription.id}`);
  }

  // Find user by email via profiles table (efficient single-row lookup)
  const { data: profile, error: profileError } = await getSupabaseAdmin()
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (profileError || !profile) {
    throw new Error(`User not found for email: ${customerEmail}`);
  }

  // Derive plan_type from the subscription's first price item so the DB
  // column stays in sync with the plan the user actually paid for.
  const priceId = subscription.items.data[0]?.price?.id;
  const planType = priceId ? priceIdToPlanType(priceId) : null;
  if (!priceId) {
    console.warn(`Subscription ${subscription.id} has no price item`);
  } else if (!planType) {
    // Unknown price ID — log but do NOT overwrite plan_type with a default.
    // Keep other fields in sync, leave plan_type alone.
    console.warn(`Unknown priceId ${priceId} on subscription ${subscription.id}`);
  }

  const updateData: Record<string, unknown> = {
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    status: subscription.status as string,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  };
  if (planType) updateData.plan_type = planType;

  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .upsert({ user_id: profile.id, ...updateData }, { onConflict: 'user_id' });

  if (error) throw error;
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Stale-ID guard: only mark canceled when the deleted subscription is the
  // one currently tracked on the user's row. When we upgrade between paid
  // plans we cancel the old Stripe sub before creating the new one; the
  // old sub's delete webhook arrives *after* the new sub's created webhook,
  // so without this guard the row would be re-overwritten to status=canceled
  // and flash the wrong state in the UI.
  const { data: row } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('id, stripe_subscription_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (!row) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Ignoring delete for stale subscription ${subscription.id} (not the current one on any row)`
      );
    }
    return;
  }

  // status='canceled' is enough — the UI uses current_period_end to show
  // when access ends. (The legacy canceled_at column doesn't exist in setup.sql.)
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (error) throw error;
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription;
  if (subscriptionId && typeof subscriptionId === 'string') {
    const { error } = await getSupabaseAdmin()
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription;
  if (subscriptionId && typeof subscriptionId === 'string') {
    const { error } = await getSupabaseAdmin()
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) throw error;
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  // TODO: Send email/in-app notification about trial ending
  // Requires email service integration (e.g., Resend, SendGrid)
  if (process.env.NODE_ENV === 'development') {
    console.log('Trial will end for subscription:', subscription.id);
  }
}
