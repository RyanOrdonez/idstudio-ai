import type { Metadata } from 'next'
import { Playfair_Display } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Toaster } from 'sonner'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IDStudio.ai - AI-Powered Interior Design Platform',
  description: 'Run your entire interior design business from one hub. AI assistant for emails, mood boards, contracts, invoices, and renderings.',
}

const ClientSideLayout = dynamic(
  () => import('@/components/ClientSideLayout'),
  { ssr: false }
)

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground font-sans">Loading IDStudio...</p>
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} font-sans antialiased`}>
        <Suspense fallback={<Loading />}>
          <ClientSideLayout>
            {children}
          </ClientSideLayout>
        </Suspense>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(38 30% 97%)',
              border: '1px solid hsl(33 16% 86%)',
              color: 'hsl(30 18% 24%)',
            },
          }}
        />
      </body>
    </html>
  )
}

