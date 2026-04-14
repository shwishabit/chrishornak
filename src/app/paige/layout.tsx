import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  // 'block' holds text invisible briefly until Manrope is loaded,
  // preventing the flash from fallback font → Manrope on the lockup.
  display: 'block',
  variable: '--font-paige',
  weight: ['500', '600', '700'],
  preload: true,
})

export const metadata: Metadata = {
  title: 'Paige',
  description: 'Meet Paige.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  // Self-canonical — prevents link-preview tools from following the
  // site-wide canonical back to the homepage.
  alternates: { canonical: '/paige' },
}

export default function PaigeLayout({ children }: { children: React.ReactNode }) {
  return <div className={manrope.variable} style={{ minHeight: '100dvh' }}>{children}</div>
}
