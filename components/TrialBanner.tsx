'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSubscription } from '@/hooks/useSubscription';
import SubscribeButton from './SubscribeButton';

export default function TrialBanner() {
  const { subscription, isTrialExpiring, isTrialExpired } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!subscription || (!isTrialExpiring && !isTrialExpired) || isDismissed) {
    return null;
  }

  const getDaysRemaining = () => {
    if (!subscription.current_period_end) return 0;
    const trialEnd = new Date(subscription.current_period_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();

  if (isTrialExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
              <span className="text-red-600 font-semibold text-sm">!</span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Trial Expired
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Your 14-day free trial has expired. Subscribe to Pro Plan to continue using IDStudio.ai&apos;s premium features.
              </p>
            </div>
            <div className="mt-4">
              <SubscribeButton className="text-sm px-4 py-2">
                Subscribe to Pro Plan
              </SubscribeButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
            <span className="text-yellow-600 font-semibold text-sm">{daysRemaining}</span>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Trial Ending Soon
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Your free trial expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
              Subscribe to Pro Plan to continue accessing all features.
            </p>
          </div>
          <div className="mt-4">
            <SubscribeButton className="text-sm px-4 py-2">
              Subscribe to Pro Plan
            </SubscribeButton>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setIsDismissed(true)}
              className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
