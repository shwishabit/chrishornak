'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { fadeUp, stagger, ease } from '@/lib/animations'
import type { Post } from '@/lib/blog'

interface BlogLayoutProps {
  post: Post
  toc: { id: string; label: string }[]
  heroVisual?: React.ReactNode
  children: React.ReactNode
}

export function BlogLayout({ post, toc, heroVisual, children }: BlogLayoutProps) {
  const formattedDate = new Date(post.datePublished + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {/* Breadcrumbs */}
      <div className="px-6 pt-28 md:px-12 md:pt-32 lg:px-24">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
            </li>
            <li><ChevronRight className="h-3 w-3" /></li>
            <li>
              <Link href="/blog" className="transition-colors hover:text-foreground">Blog</Link>
            </li>
          </ol>
        </nav>
      </div>

      {/* Hero */}
      <motion.section
        variants={stagger}
        initial="initial"
        animate="animate"
        className="px-6 pt-12 pb-8 md:px-12 md:pt-16 md:pb-12 lg:px-24"
      >
        <div className="mx-auto max-w-3xl">
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, ease }}
            className="guide-definition font-heading text-3xl leading-[1.15] font-bold tracking-tight md:text-5xl lg:text-[3.25rem]"
          >
            {post.title}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease }}
            className="guide-summary mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            {post.teaser}
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60"
          >
            <span>By Chris Hornak</span>
            <span>&middot;</span>
            <time dateTime={post.datePublished}>{formattedDate}</time>
            <span>&middot;</span>
            <span>{post.readingMinutes} min read</span>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured visual */}
      {heroVisual && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="px-6 pb-12 md:px-12 md:pb-16 lg:px-24"
        >
          <div className="mx-auto max-w-3xl">{heroVisual}</div>
        </motion.section>
      )}

      {/* Contents */}
      {toc.length > 0 && (
        <section className="px-6 pb-12 md:px-12 md:pb-16 lg:px-24">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl border border-border/20 bg-muted/10 px-6 py-5 md:px-8">
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                In this piece
              </p>
              <nav className="mt-3 space-y-1.5">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </section>
      )}

      {/* Reading line */}
      <div className="px-6 md:px-12 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
        </div>
      </div>

      {/* Body */}
      <section className="px-6 pt-12 pb-8 md:px-12 md:pt-16 md:pb-12 lg:px-24">
        <div className="guide-prose mx-auto max-w-3xl">{children}</div>
      </section>

      {/* FAQ */}
      {post.faq.length > 0 && (
        <section className="px-6 pb-16 md:px-12 md:pb-20 lg:px-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Questions people ask
            </h2>
            <div className="mt-8 space-y-4">
              {post.faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-border/20 bg-muted/5 px-6 py-4"
                >
                  <summary className="cursor-pointer list-none">
                    <h3 className="inline font-heading text-base font-bold md:text-lg">
                      {item.question}
                    </h3>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back */}
      <section className="px-6 pb-20 md:px-12 md:pb-28 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            More posts
          </Link>
        </div>
      </section>
    </>
  )
}
