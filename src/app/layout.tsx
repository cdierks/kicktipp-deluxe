import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'

const barlow = localFont({
  src: [
    { path: '../../public/fonts/barlow-300.ttf', weight: '300', style: 'normal' },
    { path: '../../public/fonts/barlow-400.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/barlow-500.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/barlow-600.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/barlow-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-barlow',
  display: 'swap',
})

const barlowCondensed = localFont({
  src: [
    { path: '../../public/fonts/barlow-condensed-500.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/barlow-condensed-600.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/barlow-condensed-700.ttf', weight: '700', style: 'normal' },
    { path: '../../public/fonts/barlow-condensed-800.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-barlow-condensed',
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
      <body className={`${barlow.variable} ${barlowCondensed.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  )
}
