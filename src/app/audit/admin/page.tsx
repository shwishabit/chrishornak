import { redirect } from 'next/navigation'

// Findability usage, job leads, projects and everything else now live together
// at /audit/admin/dashboard (2026-10-15). This keeps the old bookmark working.
export default function AdminPage() {
  redirect('/audit/admin/dashboard')
}
