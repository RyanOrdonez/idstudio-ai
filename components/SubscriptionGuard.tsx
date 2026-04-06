'use client';

import { ReactNode, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionModal from './SubscriptionModal';
import TrialExpirationBanner from './TrialExpirationBanner';

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireActive?: boolean;
}

export default function SubscriptionGuard({ 
  children, 
  fallback,
  requireActive = true 
}: SubscriptionGuardProps) {
  const { hasActive, isTrialExpired, isLoading } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireActive && !hasActive) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isTrialExpired ? 'Trial Expired' : 'Premium Feature'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {isTrialExpired 
              ? 'Your 14-day free trial has expired. Subscribe to continue using IDStudio.ai.'
              : 'This feature requires an active subscription. Start your free trial to unlock all features.'
            }
          </p>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isTrialExpired ? 'Subscribe Now' : 'Start Free Trial'}
          </button>
        </div>

        <SubscriptionModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />
      </div>
    );
  }

  return (
    <>
      <TrialExpirationBanner />
      {children}
    </>
  );
}
