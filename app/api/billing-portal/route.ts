import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createBillingPortalSession } from '@/lib/stripe';
import { getSubscription } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Missing return URL' },
        { status: 400 }
      );
    }

    // Validate return URL belongs to this app's origin to prevent phishing
    const appOrigin = new URL(request.url).origin;
    try {
      if (new URL(returnUrl).origin !== appOrigin) {
        return NextResponse.json(
          { error: 'Return URL must belong to this application' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid return URL format' },
        { status: 400 }
      );
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

    // Get user's subscription
    const subscription = await getSubscription(user.id);
    
    if (!subscription || !subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Create billing portal session
    const session = await createBillingPortalSession(
      subscription.stripe_customer_id,
      returnUrl
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
