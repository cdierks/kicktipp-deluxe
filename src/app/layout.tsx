import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'

const ibmPlexSans = localFont({
  src: [
    { path: '../../public/fonts/ibm-plex-sans-variable.ttf', weight: '100 700', style: 'normal' },
  ],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})

const ibmPlexSansCondensed = localFont({
  src: [
    { path: '../../public/fonts/ibm-plex-sans-condensed-500.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/ibm-plex-sans-condensed-600.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/ibm-plex-sans-condensed-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-ibm-plex-sans-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kicktipp Deluxe',
  description: 'Bundesliga-Tippspiel für Freunde',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
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
      <body className={`${ibmPlexSans.variable} ${ibmPlexSansCondensed.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  )
}
