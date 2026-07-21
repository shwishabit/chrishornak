'use server'

import { redirect } from 'next/navigation'
import { adminKey, setAdminCookie, clearAdminCookie } from '@/lib/admin-auth'

export interface LoginState {
  error?: string
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const pass = String(formData.get('passphrase') ?? '')
  const key = adminKey()
  if (!key) return { error: 'Admin access is not configured on this deployment.' }

  if (pass !== key) {
    // Small constant delay to blunt brute-forcing a single-secret gate.
    await new Promise((r) => setTimeout(r, 600))
    return { error: 'Incorrect passphrase.' }
  }

  await setAdminCookie()
  redirect('/audit/admin')
}

export async function logout(): Promise<void> {
  await clearAdminCookie()
  redirect('/audit/admin')
}
