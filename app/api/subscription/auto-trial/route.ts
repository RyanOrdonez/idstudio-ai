import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createTrialSubscription, getSubscription } from '@/lib/subscription';

export async function POST(request: NextRequest) {
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

    // Check if user already has a subscription
    const existingSubscription = await getSubscription(user.id);
    if (existingSubscription) {
      return NextResponse.json(
        { message: 'User already has a subscription', subscription: existingSubscription },
        { status: 200 }
      );
    }

    // Create trial subscription
    const subscription = await createTrialSubscription(user.id);

    return NextResponse.json({ 
      message: 'Trial subscription created successfully',
      subscription 
    });
  } catch (error) {
    console.error('Auto-trial creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
