'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PricingCards from '@/components/PricingCards'

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro'>('starter')

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="py-20">
        <PricingCards 
          selectedPlan={selectedPlan}
          onPlanSelect={setSelectedPlan}
          showTrialButton={true}
        />

        {/* FAQ Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Is there a free trial?</h3>
                <p className="text-neutral-600">Yes! All plans come with a 14-day free trial. No credit card required to start.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Can I change plans anytime?</h3>
                <p className="text-neutral-600">Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-neutral-600">We accept all major credit cards, PayPal, and bank transfers for Enterprise customers.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Is my data secure?</h3>
                <p className="text-neutral-600">Yes. We use enterprise-grade security with end-to-end encryption and regular security audits.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
