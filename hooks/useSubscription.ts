import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getSubscription, hasActiveSubscription, isTrialExpiring, isTrialExpired, Subscription } from '@/lib/subscription';

export interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  hasActive: boolean;
  isTrialExpiring: boolean;
  isTrialExpired: boolean;
  refetch: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActive, setHasActive] = useState(false);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setHasActive(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [subscriptionData, hasActiveData] = await Promise.all([
        getSubscription(user.id),
        hasActiveSubscription(user.id)
      ]);
      
      setSubscription(subscriptionData);
      setHasActive(hasActiveData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
      setHasActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return {
    subscription,
    isLoading,
    hasActive,
    isTrialExpiring: isTrialExpiring(subscription),
    isTrialExpired: isTrialExpired(subscription),
    refetch: fetchSubscription,
  };
};
