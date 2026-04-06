'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface ManageBillingButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function ManageBillingButton({
  className = '',
  children = 'Manage Billing',
}: ManageBillingButtonProps) {
  const { user } = useAuth();
  const { hasActive, isLoading: subscriptionLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const handleManageBilling = async () => {
    if (!user || !hasActive) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      window.location.href = url;
    } catch (error) {
      console.error('Billing portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
    );
  }

  if (!hasActive) {
    return null;
  }

  return (
    <button
      onClick={handleManageBilling}
      disabled={isLoading}
      className={`px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition-colors ${className}`}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
