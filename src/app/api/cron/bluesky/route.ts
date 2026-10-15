// src/app/api/cron/bluesky/route.ts
//
// Daily Bluesky poster. The Vercel cron (vercel.json) calls this once a day and it
// posts today's entry from src/lib/bluesky-posts.ts (New York date): one post, or a
// thread on Story days. Cron-only: refuses requests without the CRON_SECRET header.
//
// ?dry=1 shows exactly what would post and posts nothing (&date=YYYY-MM-DD to preview
// another day). A date with no entry is skipped. A first post already on the feed is
// skipped, so a re-run or a hand-posted day never doubles up. Any failure emails Chris.

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { alreadyPosted, previewPost, publishPost, todayInNewYork, validatePost } from '@/lib/bluesky'
import { blueskyPosts } from '@/lib/bluesky-posts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production' // dev: allow
  return req.headers.get('authorization') === `Bearer ${secret}`
}

async function emailFailure(date: string, problem: string) {
  console.error(`[cron/bluesky] ${date}: ${problem}`)
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL) return
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Chris Hornak <chris@chrishornak.com>',
      to: process.env.CONTACT_EMAIL,
      subject: `Bluesky post did not go out (${date})`,
      text: [
        `The Bluesky robot could not post the ${date} entry.`,
        '',
        `What went wrong: ${problem}`,
        '',
        'The post is in src/lib/bluesky-posts.ts. Post it by hand, or fix it and the next run picks up the next day.',
      ].join('\n'),
    })
  } catch (err) {
    console.error('[cron/bluesky] failure email did not send:', err)
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const dry = url.searchParams.get('dry') === '1'
  // Picking another date is for previews and local tests only. Production posts today.
  const canPickDate = dry || process.env.NODE_ENV !== 'production'
  const date = (canPickDate && url.searchParams.get('date')) || todayInNewYork()
  const post = blueskyPosts.find((p) => p.date === date)
  if (!post) return NextResponse.json({ ok: true, date, skipped: 'no post planned for this date' })

  const problems = validatePost(post)
  if (problems.length) {
    if (!dry) await emailFailure(date, problems.join('; '))
    return NextResponse.json({ ok: false, date, problems }, { status: 422 })
  }

  try {
    if (dry) {
      return NextResponse.json({ ok: true, dry: true, date, parts: await previewPost(post, url.origin) })
    }

    const handle = process.env.BLUESKY_HANDLE
    const password = process.env.BLUESKY_APP_PASSWORD
    if (!handle || !password) throw new Error('BLUESKY_HANDLE or BLUESKY_APP_PASSWORD is not set in Vercel')

    if (await alreadyPosted(handle, post.parts[0].text)) {
      return NextResponse.json({ ok: true, date, skipped: 'already on the feed' })
    }
    const refs = await publishPost(post, { identifier: handle, password }, url.origin)
    return NextResponse.json({ ok: true, date, posted: refs.map((r) => r.uri) })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!dry) await emailFailure(date, message)
    return NextResponse.json({ ok: false, date, error: message }, { status: 500 })
  }
}
