'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-8">Terms of Service</h1>
            
            <div className="prose prose-neutral max-w-none">
              <p className="text-lg text-neutral-600 mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-neutral-700 mb-4">
                  By accessing and using IDStudio.ai, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. Use License</h2>
                <p className="text-neutral-700 mb-4">
                  Permission is granted to temporarily download one copy of IDStudio.ai per device for personal, non-commercial transitory viewing only.
                </p>
                <ul className="list-disc pl-6 text-neutral-700 mb-4">
                  <li>This is the grant of a license, not a transfer of title</li>
                  <li>Under this license you may not modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the website</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. User Accounts</h2>
                <p className="text-neutral-700 mb-4">
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. AI Services</h2>
                <p className="text-neutral-700 mb-4">
                  Our AI-powered features are provided &ldquo;as is&rdquo; and we make no warranties about the accuracy or completeness of AI-generated content.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Privacy</h2>
                <p className="text-neutral-700 mb-4">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. Termination</h2>
                <p className="text-neutral-700 mb-4">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. Contact Information</h2>
                <p className="text-neutral-700 mb-4">
                  If you have any questions about these Terms of Service, please contact us at hello@idstudio.ai
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
