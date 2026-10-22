import { NextResponse } from 'next/server'
import { finalizeReview } from '@/lib/review-store'
import { buildReviewEmail, sendReviewEmail } from '@/lib/review-email'
import { REVIEW_CONTENT } from '@/content/reviews'

export const dynamic = 'force-dynamic'

/** Lock the review and email Chris every comment. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const state = await finalizeReview(token)
  if (!state) return NextResponse.json({ error: 'not open' }, { status: 409 })

  const content = REVIEW_CONTENT[state.slug]
  if (!content) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const link = `${new URL(req.url).origin}/review/${token}`
  try {
    const delivery = await sendReviewEmail(buildReviewEmail(content, state, link))
    return NextResponse.json({ ok: true, status: 'final', delivery })
  } catch (e) {
    // The review stays final; Chris can still read it on the admin page.
    console.error('review finalize email failed', e)
    return NextResponse.json({ ok: true, status: 'final', delivery: 'failed' })
  }
}
