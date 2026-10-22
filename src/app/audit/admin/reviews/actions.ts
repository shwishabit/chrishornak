'use server'

import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/admin-auth'
import { createReview, reopenReview } from '@/lib/review-store'
import { REVIEW_CONTENT } from '@/content/reviews'

export interface ReviewActionState {
  error?: string
  ok?: string
}

export async function createReviewAction(_prev: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  if (!(await isAdmin())) return { error: 'Not signed in.' }
  const slug = String(formData.get('slug') ?? '')
  const content = REVIEW_CONTENT[slug]
  if (!content) return { error: `No review content for "${slug}".` }
  try {
    await createReview(slug, content.title, content.client)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not create the review.' }
  }
  revalidatePath('/audit/admin/reviews')
  return { ok: `Created a link for ${content.client}.` }
}

export async function reopenReviewAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return
  await reopenReview(String(formData.get('slug') ?? ''))
  revalidatePath('/audit/admin/reviews')
}
