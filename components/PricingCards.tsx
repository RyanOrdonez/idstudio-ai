'use client';

import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { PRICING_PLANS } from '@/lib/stripe';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface PricingCardsProps {
  onPlanSelect?: (planType: 'free' | 'starter' | 'pro') => void;
  selectedPlan?: 'free' | 'starter' | 'pro';
  showTrialButton?: boolean;
}

export default function PricingCards({ 
  onPlanSelect, 
  selectedPlan = 'starter',
  showTrialButton = true 
}: PricingCardsProps) {
  const { user } = useAuth();
  const { subscription, hasActive } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanSelect = (planType: 'free' | 'starter' | 'pro') => {
    if (onPlanSelect) {
      onPlanSelect(planType);
    }
  };

  const handleStartTrial = async (planType: 'starter' | 'pro') => {
    if (!user) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: PRICING_PLANS[planType].priceId,
          planType,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      const stripe = (await import('@stripe/stripe-js')).loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );
      
      const stripeInstance = await stripe;
      if (stripeInstance) {
        await stripeInstance.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPlan = () => {
    if (!subscription) return 'free';
    return subscription.plan_type || 'free';
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that fits your practice. All plans include our AI assistant,
            unlimited projects, and premium support.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {/* Free Plan */}
          <div
            className={`relative rounded-2xl border-2 p-8 cursor-pointer transition-all ${
              selectedPlan === 'free'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => handlePlanSelect('free')}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Free</h3>
              <p className="mt-2 text-sm text-gray-500">Perfect for getting started</p>
              <p className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-sm font-medium text-gray-500">/month</span>
              </p>
            </div>

            <ul className="mt-6 space-y-4">
              {PRICING_PLANS.free.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                disabled={currentPlan === 'free'}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  currentPlan === 'free'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* Starter Plan */}
          <div
            className={`relative rounded-2xl border-2 p-8 cursor-pointer transition-all ${
              selectedPlan === 'starter'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => handlePlanSelect('starter')}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
              <p className="mt-2 text-sm text-gray-500">Perfect for solo designers</p>
              <p className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-sm font-medium text-gray-500">/month</span>
              </p>
            </div>

            <ul className="mt-6 space-y-4">
              {PRICING_PLANS.starter.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {showTrialButton && currentPlan !== 'starter' && !hasActive ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTrial('starter');
                  }}
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Start Free Trial'}
                </button>
              ) : (
                <button
                  disabled={currentPlan === 'starter'}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    currentPlan === 'starter'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {currentPlan === 'starter' ? 'Current Plan' : 'Get Started'}
                </button>
              )}
            </div>
          </div>

          {/* Professional Plan */}
          <div
            className={`relative rounded-2xl border-2 p-8 cursor-pointer transition-all ${
              selectedPlan === 'pro'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => handlePlanSelect('pro')}
          >
            {/* Most Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Professional</h3>
              <p className="mt-2 text-sm text-gray-500">For growing design practices</p>
              <p className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$79</span>
                <span className="text-sm font-medium text-gray-500">/month</span>
              </p>
            </div>

            <ul className="mt-6 space-y-4">
              {PRICING_PLANS.pro.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {showTrialButton && currentPlan !== 'pro' && !hasActive ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTrial('pro');
                  }}
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Start Free Trial'}
                </button>
              ) : (
                <button
                  disabled={currentPlan === 'pro'}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    currentPlan === 'pro'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {currentPlan === 'pro' ? 'Current Plan' : 'Get Started'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
