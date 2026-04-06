'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-8">Privacy Policy</h1>
            
            <div className="prose prose-neutral max-w-none">
              <p className="text-lg text-neutral-600 mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Information We Collect</h2>
                <p className="text-neutral-700 mb-4">
                  We collect information you provide directly to us, such as when you create an account, use our services, or contact us.
                </p>
                <ul className="list-disc pl-6 text-neutral-700 mb-4">
                  <li>Account information (name, email, password)</li>
                  <li>Project data and design files you upload</li>
                  <li>Communication preferences and settings</li>
                  <li>Usage data and analytics</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">How We Use Your Information</h2>
                <p className="text-neutral-700 mb-4">
                  We use the information we collect to provide, maintain, and improve our services.
                </p>
                <ul className="list-disc pl-6 text-neutral-700 mb-4">
                  <li>Provide AI-powered design assistance</li>
                  <li>Store and organize your projects and files</li>
                  <li>Send important updates and notifications</li>
                  <li>Improve our AI models and services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Data Security</h2>
                <p className="text-neutral-700 mb-4">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">AI and Machine Learning</h2>
                <p className="text-neutral-700 mb-4">
                  We use AI and machine learning to provide design suggestions and improve our services. Your data may be used to train and improve our AI models, but we do not share personal information with third parties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Your Rights</h2>
                <p className="text-neutral-700 mb-4">
                  You have the right to access, update, or delete your personal information. You can also opt out of certain communications.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Contact Us</h2>
                <p className="text-neutral-700 mb-4">
                  If you have any questions about this Privacy Policy, please contact us at privacy@idstudio.ai
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
