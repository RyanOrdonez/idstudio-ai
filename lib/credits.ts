import { createClient } from '@supabase/supabase-js'

// ============================================
// AI Credit System — Plan Configuration
// ============================================

export type PlanType = 'free' | 'starter' | 'pro' | 'studio'
export type ModelTier = 'haiku' | 'sonnet' | 'opus'

// NOTE: Haiku and Opus model IDs may need updating once your Anthropic account has access.
// For now, all tiers use Sonnet to ensure the chat works. Credit costs still differ.
export const MODEL_CONFIG: Record<ModelTier, { label: string; credits: number; model: string; description: string }> = {
  haiku: {
    label: 'Haiku',
    credits: 1,
    model: 'claude-sonnet-4-20250514',
    description: 'Fast & lightweight — emails, quick answers',
  },
  sonnet: {
    label: 'Sonnet',
    credits: 3,
    model: 'claude-sonnet-4-20250514',
    description: 'Balanced — proposals, contracts, detailed work',
  },
  opus: {
    label: 'Opus',
    credits: 5,
    model: 'claude-sonnet-4-20250514',
    description: 'Most capable — complex reasoning, full documents',
  },
}

export const PLAN_LIMITS: Record<PlanType, { weeklyCredits: number; label: string; unlimited: boolean }> = {
  free: { weeklyCredits: 7, label: 'Free', unlimited: false },
  starter: { weeklyCredits: 50, label: 'Starter', unlimited: false },
  pro: { weeklyCredits: 200, label: 'Pro', unlimited: false },
  studio: { weeklyCredits: Infinity, label: 'Studio', unlimited: true },
}

// ============================================
// Week Calculation
// ============================================

/** Get the start of the current ISO week (Monday 00:00 UTC) */
export function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? 6 : day - 1 // Monday = 0
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday.toISOString()
}

// ============================================
// Server-side Credit Operations
// ============================================

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  // Use service role key if available, otherwise fall back to anon key
  return createClient(url, serviceKey || anonKey)
}

/** Get the user's current plan type from their subscription */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', userId)
    .single()

  if (!data || !['active', 'trialing'].includes(data.status)) {
    return 'free'
  }

  const plan = data.plan_type as string
  if (plan === 'starter' || plan === 'pro' || plan === 'studio') return plan
  return 'free'
}

/** Get credits used this week */
export async function getCreditsUsed(userId: string): Promise<number> {
  const supabase = getServiceClient()
  const weekStart = getCurrentWeekStart()

  const { data } = await supabase
    .from('ai_usage')
    .select('credits_used')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  return data?.credits_used ?? 0
}

/** Get full credit status for a user */
export async function getCreditStatus(userId: string) {
  const [plan, creditsUsed] = await Promise.all([
    getUserPlan(userId),
    getCreditsUsed(userId),
  ])

  const planConfig = PLAN_LIMITS[plan]
  const creditsRemaining = planConfig.unlimited ? Infinity : Math.max(0, planConfig.weeklyCredits - creditsUsed)

  return {
    plan,
    planLabel: planConfig.label,
    weeklyLimit: planConfig.weeklyCredits,
    creditsUsed,
    creditsRemaining,
    unlimited: planConfig.unlimited,
  }
}

/** Check if user can afford a message with the given model */
export function canAfford(creditsRemaining: number, model: ModelTier, unlimited: boolean): boolean {
  if (unlimited) return true
  return creditsRemaining >= MODEL_CONFIG[model].credits
}

/** Deduct credits after a successful AI call */
export async function deductCredits(
  userId: string,
  model: ModelTier,
  category: string,
  inputTokens?: number,
  outputTokens?: number
): Promise<void> {
  const supabase = getServiceClient()
  const weekStart = getCurrentWeekStart()
  const cost = MODEL_CONFIG[model].credits

  // Upsert weekly usage (increment credits_used)
  const { data: existing } = await supabase
    .from('ai_usage')
    .select('id, credits_used')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (existing) {
    await supabase
      .from('ai_usage')
      .update({
        credits_used: existing.credits_used + cost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('ai_usage')
      .insert({
        user_id: userId,
        credits_used: cost,
        week_start: weekStart,
      })
  }

  // Log individual message for analytics
  await supabase
    .from('ai_messages')
    .insert({
      user_id: userId,
      model: MODEL_CONFIG[model].model,
      category,
      credits_cost: cost,
      input_tokens: inputTokens ?? null,
      output_tokens: outputTokens ?? null,
    })
}
