'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Help Center</h1>
            <p className="text-xl text-neutral-600">Everything you need to know about IDStudio.ai</p>
          </div>

          {/* Quick Search */}
          <div className="mb-12">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full px-4 py-3 pl-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Getting Started</h3>
              <p className="text-neutral-600 mb-4">Learn the basics of using IDStudio.ai for your interior design projects.</p>
              <a href="#getting-started" className="text-blue-600 hover:text-blue-700 font-medium">View guides →</a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">AI Assistant</h3>
              <p className="text-neutral-600 mb-4">Master the AI-powered features for design generation and client communication.</p>
              <a href="#ai-assistant" className="text-blue-600 hover:text-blue-700 font-medium">Learn more →</a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Project Management</h3>
              <p className="text-neutral-600 mb-4">Organize projects, manage clients, and handle files efficiently.</p>
              <a href="#project-management" className="text-blue-600 hover:text-blue-700 font-medium">Explore →</a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Document Generation</h3>
              <p className="text-neutral-600 mb-4">Create proposals, contracts, and invoices with AI assistance.</p>
              <a href="#documents" className="text-blue-600 hover:text-blue-700 font-medium">Get started →</a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Account & Settings</h3>
              <p className="text-neutral-600 mb-4">Manage your account, billing, and platform preferences.</p>
              <a href="#settings" className="text-blue-600 hover:text-blue-700 font-medium">Configure →</a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75c0-1.856-.511-3.596-1.403-5.09l-4.069 4.069a3.75 3.75 0 01-5.304-5.304l4.069-4.069A9.75 9.75 0 0012 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Troubleshooting</h3>
              <p className="text-neutral-600 mb-4">Common issues and solutions to keep your workflow smooth.</p>
              <a href="#troubleshooting" className="text-blue-600 hover:text-blue-700 font-medium">Find solutions →</a>
            </div>
          </div>

          {/* Popular Articles */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Popular Articles</h2>
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="divide-y divide-neutral-200">
                <div className="p-6 hover:bg-neutral-50 transition-colors">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">How to create your first project</h3>
                  <p className="text-neutral-600 mb-3">Step-by-step guide to setting up your first interior design project in IDStudio.ai.</p>
                  <span className="text-sm text-neutral-500">5 min read</span>
                </div>
                <div className="p-6 hover:bg-neutral-50 transition-colors">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Using AI to generate design proposals</h3>
                  <p className="text-neutral-600 mb-3">Learn how to leverage AI to create compelling proposals for your clients.</p>
                  <span className="text-sm text-neutral-500">8 min read</span>
                </div>
                <div className="p-6 hover:bg-neutral-50 transition-colors">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Managing client communications</h3>
                  <p className="text-neutral-600 mb-3">Best practices for keeping clients informed throughout the design process.</p>
                  <span className="text-sm text-neutral-500">6 min read</span>
                </div>
                <div className="p-6 hover:bg-neutral-50 transition-colors">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">File organization and management</h3>
                  <p className="text-neutral-600 mb-3">Keep your design files organized and easily accessible across projects.</p>
                  <span className="text-sm text-neutral-500">4 min read</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Still need help?</h2>
            <p className="text-neutral-600 mb-6">Can&apos;t find what you&apos;re looking for? Our support team is here to help.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="mailto:support@idstudio.ai"
                className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
