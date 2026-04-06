import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

    // Get usage statistics using the database function
    const { data, error } = await supabase
      .rpc('get_user_usage_stats', { user_uuid: user.id });

    if (error) {
      console.error('Error fetching usage stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch usage statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json(data?.[0] || {
      has_subscription: false,
      projects_count: 0,
      projects_limit: 3,
      files_count: 0,
      files_limit: 10,
      conversations_count: 0,
      conversations_limit: 5,
      messages_count: 0,
      messages_limit: 100,
    });
  } catch (error) {
    console.error('Usage stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
