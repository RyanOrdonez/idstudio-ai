'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscribeButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function SubscribeButton({
  className = '',
  children = 'Start 14-Day Free Trial',
  planType = 'starter',
}: SubscribeButtonProps & { planType?: 'starter' | 'pro' }) {
  const { user } = useAuth();
  const { hasActive, isLoading: subscriptionLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user || hasActive) return;

    const priceId = planType === 'pro' 
      ? process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID;

    try {
      setIsLoading(true);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planType,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <button
        disabled
        className={`px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed ${className}`}
      >
        Loading...
      </button>
    );
  }

  if (hasActive) {
    return (
      <button
        disabled
        className={`px-6 py-3 bg-green-100 text-green-700 rounded-lg cursor-not-allowed ${className}`}
      >
        Current Plan
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading || !user}
      className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition-colors ${className}`}
    >
      {isLoading ? 'Processing...' : children}
    </button>
  );
}
