import type { Metadata } from 'next'
import { isAdmin } from '@/lib/admin-auth'
import { AdminLogin } from '@/components/sections/AdminLogin'
import { DashboardView } from '@/components/sections/DashboardView'

export const metadata: Metadata = {
  title: 'Admin — Dashboard',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  if (!(await isAdmin())) {
    return (
      <main id="main-content" className="relative min-h-screen">
        <AdminLogin />
      </main>
    )
  }
  return <DashboardView />
}
