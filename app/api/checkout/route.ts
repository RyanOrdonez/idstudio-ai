import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe, createCheckoutSession, getStripeCustomerByEmail, createStripeCustomer, STRIPE_CONFIG } from '@/lib/stripe';
import { getSubscription } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const { priceId, planType, successUrl, cancelUrl } = await request.json();

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate redirect URLs belong to this app's origin to prevent phishing
    const appOrigin = new URL(request.url).origin;
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

    // Validate price ID
    const validPriceIds = [STRIPE_CONFIG.STARTER_PLAN_PRICE_ID, STRIPE_CONFIG.PRO_PLAN_PRICE_ID];
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has a subscription
    const existingSubscription = await getSubscription(user.id);
    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomer = await getStripeCustomerByEmail(user.email!);
    
    if (!stripeCustomer) {
      stripeCustomer = await createStripeCustomer(
        user.email!,
        user.user_metadata?.full_name || user.email
      );
    }

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: stripeCustomer.id,
      priceId,
      successUrl,
      cancelUrl,
    });

    // Update subscription record with Stripe customer ID if needed
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
