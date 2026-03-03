import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kicktipp Deluxe',
  description: 'Bundesliga-Tippspiel für Freunde',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kicktipp Deluxe',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${barlow.variable} ${barlowCondensed.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  )
}
