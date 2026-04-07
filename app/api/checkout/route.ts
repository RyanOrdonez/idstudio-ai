import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  stripe,
  createCheckoutSession,
  getStripeCustomerByEmail,
  createStripeCustomer,
  STRIPE_CONFIG,
  priceIdToPlanType,
} from '@/lib/stripe';
import { getSubscription } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId } = body;
    let { successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing priceId' },
        { status: 400 }
      );
    }

    // Default successUrl / cancelUrl to safe values derived from the request
    // origin if the client omits them. Keeps malformed client calls working.
    const appOrigin = new URL(request.url).origin;
    if (!successUrl) {
      successUrl = `${appOrigin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
    }
    if (!cancelUrl) {
      cancelUrl = `${appOrigin}/checkout-cancel`;
    }

    // Validate redirect URLs belong to this app's origin to prevent phishing
    try {
      const successOrigin = new URL(successUrl).origin;
      const cancelOrigin = new URL(cancelUrl).origin;
      if (successOrigin !== appOrigin || cancelOrigin !== appOrigin) {
        return NextResponse.json(
          { error: 'Redirect URLs must belong to this application' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid redirect URL format' },
        { status: 400 }
      );
    }

    // Validate price ID — currently only Starter + Pro.
    // Studio is deferred; when added, append STRIPE_CONFIG.STUDIO_PLAN_PRICE_ID here.
    const validPriceIds = [
      STRIPE_CONFIG.STARTER_PLAN_PRICE_ID,
      STRIPE_CONFIG.PRO_PLAN_PRICE_ID,
    ];
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    const requestedPlan = priceIdToPlanType(priceId);

    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const existingSubscription = await getSubscription(user.id);

    // Same-plan no-op: only reject when the user is already paid + active on
    // the exact plan being requested. All other states (free, trialing,
    // past_due, canceled, switching between paid plans) proceed to Checkout.
    if (
      existingSubscription &&
      existingSubscription.status === 'active' &&
      existingSubscription.plan_type === requestedPlan
    ) {
      return NextResponse.json(
        { error: 'already_on_plan', message: `You're already on the ${requestedPlan} plan.` },
        { status: 409 }
      );
    }

    // Cancel existing real Stripe subscription before creating a new one.
    // Trialing auto-trial rows have no stripe_subscription_id — they skip this
    // branch. The stale-ID guard in the webhook handler prevents race-condition
    // flashes when the delete event arrives after the new created event.
    if (
      existingSubscription?.stripe_subscription_id &&
      existingSubscription.status !== 'canceled'
    ) {
      try {
        await stripe.subscriptions.cancel(
          existingSubscription.stripe_subscription_id,
          { prorate: true }
        );
      } catch (err) {
        // Old sub may already be gone in Stripe — log and continue.
        console.warn('Could not cancel existing subscription:', err);
      }
    }

    // Get or create Stripe customer
    let stripeCustomer = await getStripeCustomerByEmail(user.email!);

    if (!stripeCustomer) {
      stripeCustomer = await createStripeCustomer(
        user.email!,
        user.user_metadata?.full_name || user.email
      );
    }

    // Create checkout session — NO trial on upgrade (auto-trial already ran on signup).
    const session = await createCheckoutSession({
      customerId: stripeCustomer.id,
      priceId,
      successUrl,
      cancelUrl,
      trialPeriodDays: null,
    });

    // Update subscription record with Stripe customer ID if it wasn't set yet.
    if (existingSubscription && !existingSubscription.stripe_customer_id) {
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: stripeCustomer.id })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await getSubscription(user.id);
    
    return NextResponse.json({
      hasSubscription: !!subscription,
      subscription: subscription || null,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
