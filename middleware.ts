import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // ============================================
  // Security Headers
  // ============================================
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  // ============================================
  // Auth & Session Refresh
  // ============================================
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Auto-create trial subscription for new authenticated users
  if (session?.user && req.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!subscription) {
        await fetch(`${req.nextUrl.origin}/api/subscription/auto-trial`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error in subscription middleware:', error);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/clients/:path*',
    '/files/:path*',
    '/api/:path*',
  ],
};
