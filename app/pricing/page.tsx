'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PricingCards from '@/components/PricingCards'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Header />

      <main className="py-20">
        <PricingCards />

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-7">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">
                Is there a free trial?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes — every new signup gets a 14-day trial of the full Professional
                experience automatically, no credit card required. When it ends,
                pick a plan that fits.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">
                Can I change plans anytime?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Absolutely. Upgrade, downgrade, or cancel from the settings page or
                Stripe billing portal. Changes take effect immediately and we prorate
                the difference.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All major credit and debit cards via Stripe. Your payment details are
                never stored on our servers.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">
                Is my data secure?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes. All data is stored in Supabase with row-level security, every
                request is encrypted in transit, and you own your data — export or
                delete at any time.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
