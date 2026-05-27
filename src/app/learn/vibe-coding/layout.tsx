import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vibe Coding',
  description: 'A starter pack for learning to vibe code with an AI agent.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: '/learn/vibe-coding' },
}

export default function VibeCodingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
