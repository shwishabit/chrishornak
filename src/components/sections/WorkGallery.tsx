'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { projects, workContent } from '@/lib/data'
import { ease } from '@/lib/animations'
import type { Project } from '@/lib/types'

function displayUrl(url: string) {
  if (url.startsWith('/')) return `chrishornak.com${url}`
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease }}
      className="flex items-center gap-4"
    >
      <span className="text-sm font-medium uppercase tracking-widest text-primary">
        {children}
      </span>
      <span className="h-px flex-1 bg-border/60" />
    </motion.div>
  )
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const isInternal = project.url.startsWith('/')
  const flipped = index % 2 === 1

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease }}
      className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
    >
      {/* Screenshot in a live-site browser frame */}
      <a
        href={project.url}
        target={isInternal ? undefined : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
        aria-label={`Visit ${project.name}`}
        className={`group block ${flipped ? 'md:order-2' : ''}`}
      >
        <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/40 shadow-xl transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-glow">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-border/60 bg-background/60 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
              {displayUrl(project.url)}
            </span>
          </div>
          <div className="relative aspect-[1440/900] overflow-hidden">
            <Image
              src={project.image}
              alt={`${project.name} — screenshot`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </a>

      {/* Copy */}
      <div className={flipped ? 'md:order-1' : ''}>
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          {project.category}
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {project.name}
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          {project.outcome}
        </p>
        <p className="mt-5 text-sm text-muted-foreground/80">{project.role}</p>
        <a
          href={project.url}
          target={isInternal ? undefined : '_blank'}
          rel={isInternal ? undefined : 'noopener noreferrer'}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:text-primary"
        >
          {isInternal ? 'Try it' : 'Visit site'}
          {isInternal ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
        </a>
      </div>
    </motion.article>
  )
}

export function WorkGallery() {
  const clientProjects = projects.filter((p) => p.kind === 'client')
  const ownedProjects = projects.filter((p) => p.kind === 'owned')

  return (
    <div className="relative mx-auto max-w-5xl space-y-20 px-6 pb-28 md:space-y-28 md:px-12 lg:px-24">
      <GroupLabel>{workContent.clientLabel}</GroupLabel>
      {clientProjects.map((project, i) => (
        <ProjectRow key={project.slug} project={project} index={i} />
      ))}

      <GroupLabel>{workContent.ownedLabel}</GroupLabel>
      {ownedProjects.map((project, i) => (
        <ProjectRow key={project.slug} project={project} index={i} />
      ))}
    </div>
  )
}
