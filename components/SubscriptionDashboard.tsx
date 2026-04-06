'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import ManageBilling from './ManageBilling';
import SubscriptionModal from './SubscriptionModal';
import UsageStats from './UsageStats';

export default function SubscriptionDashboard() {
  const { subscription, hasActive, isTrialExpiring, isTrialExpired } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  const getDaysRemaining = () => {
    if (!subscription?.current_period_end || subscription.status !== 'trialing') return 0;
    const trialEnd = new Date(subscription.current_period_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusDisplay = () => {
    if (!subscription) return { text: 'No subscription', color: 'text-gray-500' };
    
    switch (subscription.status) {
      case 'trialing':
        const daysLeft = getDaysRemaining();
        return { 
          text: `Trial (${daysLeft} days left)`, 
          color: daysLeft <= 3 ? 'text-yellow-600' : 'text-blue-600' 
        };
      case 'active':
        return { text: 'Active', color: 'text-green-600' };
      case 'past_due':
        return { text: 'Past Due', color: 'text-red-600' };
      case 'canceled':
        return { text: 'Canceled', color: 'text-gray-600' };
      default:
        return { text: subscription.status, color: 'text-gray-500' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
            <p className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </p>
          </div>
          
          <div className="flex space-x-3">
            {!hasActive && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isTrialExpired ? 'Subscribe Now' : 'Upgrade to Premium'}
              </button>
            )}
          </div>
        </div>

        {/* Trial Warning */}
        {(isTrialExpiring || isTrialExpired) && (
          <div className={`p-4 rounded-lg mb-4 ${
            isTrialExpired 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                isTrialExpired ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <span className={`text-xs font-bold ${
                  isTrialExpired ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  !
                </span>
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  isTrialExpired ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {isTrialExpired 
                    ? 'Your trial has expired. Subscribe to continue using premium features.'
                    : `Your trial expires in ${getDaysRemaining()} days. Subscribe to avoid interruption.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        {subscription && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Started:</span>
              <p className="font-medium">
                {subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {subscription.current_period_end && subscription.status === 'trialing' && (
              <div>
                <span className="text-gray-500">Trial Ends:</span>
                <p className="font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            )}
            {subscription.current_period_end && subscription.status === 'active' && (
              <div>
                <span className="text-gray-500">Next Billing:</span>
                <p className="font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      <UsageStats />

      {/* Billing Management */}
      {hasActive && <ManageBilling />}

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}
