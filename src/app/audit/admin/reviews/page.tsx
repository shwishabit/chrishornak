import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { isAdmin } from '@/lib/admin-auth'
import { AdminLogin } from '@/components/sections/AdminLogin'
import { listReviews } from '@/lib/review-store'
import { REVIEW_CONTENT } from '@/content/reviews'
import { reopenReviewAction } from './actions'
import { CreateReviewForm } from './CreateReviewForm'

export const metadata: Metadata = {
  title: 'Admin — Client reviews',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default async function ReviewsAdminPage() {
  if (!(await isAdmin())) {
    return (
      <main id="main-content" className="relative min-h-screen">
        <AdminLogin />
      </main>
    )
  }

  const reviews = await listReviews()
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host') ?? 'chrishornak.com'}`
  const unused = Object.keys(REVIEW_CONTENT).filter((slug) => !reviews.some((r) => r.slug === slug))

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl">Client reviews</h1>
      <p className="mt-2 text-muted-foreground">Each link is secret. Send it to the client; their notes save as they go, and Finalize emails you.</p>

      <ul className="mt-8 flex flex-col gap-4">
        {reviews.length === 0 && <li className="text-muted-foreground">No reviews yet.</li>}
        {reviews.map((r) => (
          <li key={r.slug} className="rounded-xl border border-border p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <b>{r.client_name || r.slug}</b>
              <span className="text-sm">
                {r.status === 'final' ? `Finalized ${r.finalized_at ? new Date(r.finalized_at).toLocaleString('en-US', { timeZone: 'America/New_York' }) : ''}` : 'Open'} · {r.comment_count} notes
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{r.title}</p>
            <p className="mt-3 break-all font-mono text-sm">
              <a href={`/review/${r.token}`} className="underline">{`${origin}/review/${r.token}`}</a>
            </p>
            {r.status === 'final' && (
              <form action={reopenReviewAction} className="mt-3">
                <input type="hidden" name="slug" value={r.slug} />
                <button type="submit" className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold">
                  Reopen for edits
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      {unused.length > 0 && <CreateReviewForm slugs={unused} />}
    </main>
  )
}
