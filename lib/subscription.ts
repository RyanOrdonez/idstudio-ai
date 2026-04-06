import { supabase } from './supabaseClient';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_type: 'free' | 'starter' | 'pro';
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  current_period_end?: string;
  trial_end?: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  subscription_status: string;
  trial_ends_at: string | null;
  period_ends_at: string | null;
  days_until_trial_end: number | null;
}

export const createTrialSubscription = async (userId: string, planType: 'starter' | 'pro' = 'starter') => {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_type: planType,
      status: 'trialing',
      current_period_end: trialEnd.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSubscription = async (
  userId: string,
  updates: Partial<Subscription>
) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus | null> => {
  const { data, error } = await supabase
    .rpc('get_subscription_status', { user_uuid: userId });

  if (error) throw error;
  return data?.[0] || null;
};

export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('has_active_subscription', { user_uuid: userId });

  if (error) throw error;
  return data || false;
};

export const isTrialExpiring = (subscription: Subscription | null): boolean => {
  if (!subscription || subscription.status !== 'trialing' || !subscription.current_period_end) {
    return false;
  }

  const trialEnd = new Date(subscription.current_period_end);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
};

export const isTrialExpired = (subscription: Subscription | null): boolean => {
  if (!subscription || subscription.status !== 'trialing' || !subscription.current_period_end) {
    return false;
  }

  const trialEnd = new Date(subscription.current_period_end);
  const now = new Date();
  
  return now > trialEnd;
};
