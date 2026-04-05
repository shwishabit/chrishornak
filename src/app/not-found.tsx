import Link from 'next/link'
import { siteConfig } from '@/lib/data'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
      >
        Back to {siteConfig.brandName}
      </Link>
    </main>
  )
}
