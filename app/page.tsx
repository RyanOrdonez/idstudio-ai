'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show home page for all users (authenticated and unauthenticated)
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-neutral-50">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-bold text-neutral-900 sm:text-5xl md:text-6xl">
                    <span className="block xl:inline">Run Your Entire</span>{' '}
                    <span className="block text-blue-600 xl:inline">Interior Design Business</span>{' '}
                    <span className="block xl:inline">from One Hub</span>
                  </h1>
                  <p className="mt-3 text-base text-neutral-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Powered by an AI Assistant that writes emails, builds mood boards, generates contracts, invoices, and renderings.
                  </p>
                  <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow-lg">
                      <Link
                        href="/signup"
                        className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Start Free Trial
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        href="/login"
                        className="w-full flex items-center justify-center px-8 py-4 border border-blue-600 text-base font-semibold rounded-lg text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <div className="h-56 w-full bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20"></div>
                <div className="absolute top-32 right-16 w-16 h-16 bg-purple-200 rounded-full opacity-30"></div>
                <div className="absolute bottom-20 left-20 w-12 h-12 bg-pink-200 rounded-full opacity-25"></div>
                <div className="absolute bottom-32 right-8 w-24 h-24 bg-blue-100 rounded-full opacity-20"></div>
              </div>
              <div className="text-center relative z-10">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transform rotate-3">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-neutral-700 text-xl font-semibold">AI-Powered Design Hub</p>
                <p className="text-neutral-600 text-sm mt-2">Transform your workflow</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-blue-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-white">10,000+</div>
                <div className="text-blue-100 mt-2">Projects Managed</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white">500+</div>
                <div className="text-blue-100 mt-2">Happy Designers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white">98%</div>
                <div className="text-blue-100 mt-2">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-4xl leading-8 font-bold tracking-tight text-neutral-900 sm:text-5xl">
                Everything you need to succeed
              </p>
              <p className="mt-4 max-w-2xl text-xl text-neutral-600 mx-auto">
                Powerful tools designed specifically for interior design professionals
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-blue-600 text-white mb-6">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">Project Management</h3>
                  <p className="text-neutral-600">
                    Organize and track all your interior design projects with intuitive dashboards and timeline views.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-purple-600 text-white mb-6">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">Client Collaboration</h3>
                  <p className="text-neutral-600">
                    Keep clients engaged with real-time updates, shared mood boards, and seamless communication tools.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-green-600 text-white mb-6">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">AI Design Assistant</h3>
                  <p className="text-neutral-600">
                    Get intelligent suggestions for color palettes, furniture placement, and design trends.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-orange-600 text-white mb-6">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">Smart File Management</h3>
                  <p className="text-neutral-600">
                    Organize design files, mood boards, and project documents with AI-powered tagging and search.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-pink-600 text-white mb-6">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">Quality Assurance</h3>
                  <p className="text-neutral-600">
                    Automated checklists and quality control features ensure nothing falls through the cracks.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-indigo-600 text-white mb-6">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">Lightning Fast</h3>
                  <p className="text-neutral-600">
                    Built for speed with modern technology to keep your workflow moving at the pace of creativity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
