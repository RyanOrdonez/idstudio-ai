'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl mb-6">
              About IDStudio.ai
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              We&apos;re revolutionizing how interior designers work by combining cutting-edge AI technology 
              with intuitive design tools to streamline every aspect of your business.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">Our Mission</h2>
              <p className="text-lg text-neutral-600 mb-6">
                To empower interior designers with AI-powered tools that eliminate busywork and amplify creativity. 
                We believe designers should spend their time designing, not managing spreadsheets or chasing invoices.
              </p>
              <p className="text-lg text-neutral-600">
                Our platform brings together project management, client communication, AI assistance, and business 
                operations into one seamless experience that grows with your practice.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">AI-First Design</h3>
              <p className="text-neutral-600">Built from the ground up with artificial intelligence at its core</p>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Speed & Efficiency</h3>
                <p className="text-neutral-600">
                  We believe your tools should work as fast as your creativity flows
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Designer-Centric</h3>
                <p className="text-neutral-600">
                  Every feature is built with the designer&apos;s workflow and needs in mind
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Quality First</h3>
                <p className="text-neutral-600">
                  We&apos;re committed to delivering exceptional experiences that exceed expectations
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Practice?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of designers who have already revolutionized their workflow
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-neutral-100 transition-colors"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
