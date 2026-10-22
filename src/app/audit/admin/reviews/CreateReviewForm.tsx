'use client'

import { useActionState } from 'react'
import { createReviewAction, type ReviewActionState } from './actions'

export function CreateReviewForm({ slugs }: { slugs: string[] }) {
  const [state, action, pending] = useActionState<ReviewActionState, FormData>(createReviewAction, {})
  return (
    <form action={action} className="mt-10 flex flex-wrap items-end gap-3 rounded-xl border border-border p-5">
      <label className="flex flex-col gap-1 text-sm">
        New review link for
        <select name="slug" className="min-h-11 rounded-lg border border-border bg-background px-3">
          {slugs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-foreground px-5 text-sm font-semibold text-background">
        {pending ? 'Creating…' : 'Create link'}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="w-full text-sm">{state.ok}</p>}
    </form>
  )
}
