import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Cookie-based client so sessions are visible to Next.js middleware
export const supabase = createClientComponentClient()
