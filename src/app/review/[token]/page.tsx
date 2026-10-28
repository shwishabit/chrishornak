import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Source_Serif_4, Figtree, Fraunces, Geist } from 'next/font/google'
import { getReview } from '@/lib/review-store'
import { REVIEW_CONTENT } from '@/content/reviews'
import { ReviewShell } from '@/components/review/ReviewShell'
import { FollowupShell } from '@/components/review/FollowupShell'
import '@/styles/review.css'

const serif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--f-serif', display: 'swap' })
const figtree = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--f-figtree', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], axes: ['SOFT', 'opsz'], style: ['normal', 'italic'], variable: '--f-fraunces', display: 'swap' })
const geist = Geist({ subsets: ['latin'], variable: '--f-geist', display: 'swap' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Design review',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const review = await getReview(token)
  const content = review ? REVIEW_CONTENT[review.slug] : undefined
  if (!review || !content) notFound()

  return (
    <div className={`${serif.variable} ${figtree.variable} ${fraunces.variable} ${geist.variable}`}>
      {content.followup ? (
        <FollowupShell token={token} content={{ ...content, followup: content.followup }} initial={review} />
      ) : (
        <ReviewShell token={token} content={content} initial={review} />
      )}
    </div>
  )
}
