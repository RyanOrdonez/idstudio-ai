'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import SubscriptionButton from './SubscriptionButton';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$29',
      interval: 'month' as const,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || '',
      popular: false,
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '$290',
      interval: 'year' as const,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || '',
      popular: true,
      savings: 'Save $58/year',
    },
  ];

  const features = [
    'Unlimited AI-powered design consultations',
    'Advanced project management tools',
    'Client collaboration features',
    'Document generation (proposals, contracts)',
    'Mood board creation with Canva integration',
    'Priority customer support',
    'Export to PDF and other formats',
    'Cloud storage for all your projects',
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                    Choose Your Plan
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="text-center mb-8">
                  <p className="text-lg text-gray-600">
                    Start your 14-day free trial. No credit card required.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border-2 p-6 ${
                        plan.popular
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Most Popular
                          </span>
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {plan.name}
                        </h4>
                        <div className="mb-2">
                          <span className="text-4xl font-bold text-gray-900">
                            {plan.price}
                          </span>
                          <span className="text-gray-600">/{plan.interval}</span>
                        </div>
                        {plan.savings && (
                          <p className="text-green-600 font-medium">{plan.savings}</p>
                        )}
                      </div>

                      <SubscriptionButton
                        priceId={plan.priceId}
                        planName={plan.name}
                        price={plan.price}
                        interval={plan.interval}
                        className="w-full mb-4"
                      />

                      <p className="text-sm text-gray-500 text-center">
                        14-day free trial, then {plan.price}/{plan.interval}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Everything included:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                  <p>
                    Cancel anytime. No questions asked. Your data is always yours.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
