'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/audit/admin/actions'

const initial: LoginState = {}

export function AdminLogin() {
  const [state, formAction, pending] = useActionState(login, initial)

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">
        Restricted
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">
        Admin access
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Usage log for the findability audit. Enter the passphrase to continue.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <input
          type="password"
          name="passphrase"
          autoFocus
          autoComplete="off"
          placeholder="Passphrase"
          className="w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
        />
        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
