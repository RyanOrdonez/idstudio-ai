'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export default function ManageBilling() {
  const { user } = useAuth();
  const { subscription, hasActive, isLoading: subscriptionLoading } = useSubscription();
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
      <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
    );
  }

  if (!hasActive || !subscription) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'trialing':
        return 'text-blue-600 bg-blue-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status:</span>
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </span>
        </div>
        
        {subscription.trial_end && subscription.status === 'trialing' && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Trial Ends:</span>
            <span className="font-medium">{formatDate(subscription.trial_end)}</span>
          </div>
        )}
        
        {subscription.current_period_end && subscription.status === 'active' && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Next Billing:</span>
            <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
          </div>
        )}
        
        {subscription.cancel_at_period_end && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Cancels At:</span>
            <span className="font-medium text-red-600">
              {formatDate(subscription.current_period_end ?? null)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={handleManageBilling}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition-colors"
      >
        {isLoading ? 'Loading...' : 'Manage Billing'}
      </button>
    </div>
  );
}
