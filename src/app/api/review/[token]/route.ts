import { NextResponse } from 'next/server'
import { getReview, saveComment, REACTIONS, SECTION_KEY, NOTE_MAX, type Reaction } from '@/lib/review-store'
import { REVIEW_CONTENT } from '@/content/reviews'
import { commentKeys } from '@/content/reviews/types'

export const dynamic = 'force-dynamic'

/** Save one section's reaction + note. Body: { section, reaction, note }. */
export async function PUT(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let body: { section?: unknown; reaction?: unknown; note?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const section = typeof body.section === 'string' ? body.section : ''
  const reaction = (typeof body.reaction === 'string' ? body.reaction : '') as Reaction
  const note = typeof body.note === 'string' ? body.note : ''
  if (!SECTION_KEY.test(section) || !REACTIONS.includes(reaction) || note.length > NOTE_MAX) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const review = await getReview(token)
  const content = review ? REVIEW_CONTENT[review.slug] : undefined
  if (!review || !content) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!commentKeys(content).includes(section)) return NextResponse.json({ error: 'unknown section' }, { status: 400 })
  if (review.status !== 'open') return NextResponse.json({ error: 'final' }, { status: 409 })

  const ok = await saveComment(token, section, reaction, note)
  if (!ok) return NextResponse.json({ error: 'final' }, { status: 409 })
  return NextResponse.json({ ok: true, saved_at: new Date().toISOString() })
}
