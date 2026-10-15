'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { submitRole, type ContactFormState } from '@/app/actions'
import { ROLE_BUDGETS, ROLE_TIMELINES } from '@/lib/data'

/* /hire role form: role, listing link, timeline, budget range (Chris, 2026-10-14).
 * Controlled fields, so a server-side error keeps what the visitor typed
 * (React 19 resets an uncontrolled form after every action). */

const initialState: ContactFormState = { success: false, message: '' }
const empty = { name: '', email: '', role: '', listing: '', timeline: '', budget: '' }

const field =
  'w-full rounded-lg border border-field-edge bg-field px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none md:text-sm'
const label = 'mb-1.5 block text-sm font-medium text-foreground'

export function HireForm() {
  const [state, formAction, isPending] = useActionState(submitRole, initialState)
  const [loadedAt] = useState(() => Date.now())
  const [v, setV] = useState(empty)
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })

  useEffect(() => {
    if (state.success) setV(empty)
  }, [state])

  return (
    <form action={formAction} className="glass-card grid gap-5 p-6 md:p-8">
      {/* Honeypot + timing, same guards as the homepage form */}
      <input
        type="text"
        name="company"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <input type="hidden" name="_t" value={loadedAt} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="hire-name" className={label}>Name</label>
          <input id="hire-name" name="name" required autoComplete="name" value={v.name} onChange={set('name')} className={field} />
        </div>
        <div>
          <label htmlFor="hire-email" className={label}>Email</label>
          <input id="hire-email" name="email" type="email" required autoComplete="email" value={v.email} onChange={set('email')} className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="hire-role" className={label}>The role</label>
        <textarea
          id="hire-role"
          name="role"
          required
          minLength={10}
          rows={4}
          placeholder="What do you need built, written or fixed? Which platform is it on?"
          value={v.role}
          onChange={set('role')}
          className={`${field} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="hire-listing" className={label}>
          Link to the listing <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="hire-listing"
          name="listing"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={v.listing}
          onChange={set('listing')}
          className={field}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="hire-timeline" className={label}>When do you need it?</label>
          <select id="hire-timeline" name="timeline" value={v.timeline} onChange={set('timeline')} className={field}>
            <option value="">Choose one</option>
            {ROLE_TIMELINES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hire-budget" className={label}>Budget range</label>
          <select id="hire-budget" name="budget" value={v.budget} onChange={set('budget')} className={field}>
            <option value="">Choose one</option>
            {ROLE_BUDGETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-shadow duration-200 hover:shadow-glow disabled:opacity-60"
        >
          {isPending ? (
            <>Sending <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /></>
          ) : (
            <>Send the role <Send className="h-3.5 w-3.5" aria-hidden="true" /></>
          )}
        </button>
        <button
          type="button"
          data-cal-link="chris-hornak/30min"
          data-cal-namespace="30min"
          data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
          className="text-sm font-semibold text-primary underline-offset-[3px] hover:underline"
        >
          Rather talk? Book 30 minutes
        </button>
      </div>

      <p role="status" aria-live="polite" className={`min-h-5 text-sm ${state.success ? 'text-primary' : 'text-destructive'}`}>
        {state.message}
      </p>
    </form>
  )
}
