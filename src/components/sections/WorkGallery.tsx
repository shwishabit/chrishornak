'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
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

// One card: visual, title, description, link (Chris, 2026-10-26: two columns, each one a card).
function ProjectCard({ project, index }: { project: Project; index: number }) {
  // Files (a video, a PDF) open in a new tab like an outside site; internal pages stay in this tab.
  const isFile = /\.(mp4|pdf)$/.test(project.url)
  const isInternal = project.url.startsWith('/') && !isFile
  const reduceMotion = useReducedMotion()
  const showVideo = Boolean(project.video) && !reduceMotion
  const linkProps = isInternal ? {} : { target: '_blank', rel: 'noopener noreferrer' }

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease, delay: (index % 2) * 0.08 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-muted/20 transition-colors duration-500 hover:border-primary/40"
    >
      {/* Screenshot in a live-site browser frame */}
      <a href={project.url} {...linkProps} aria-label={`Visit ${project.name}`} className="block">
        <div className="flex items-center gap-2 border-b border-border/60 bg-background/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
            {project.frameLabel ?? displayUrl(project.url)}
          </span>
        </div>
        <div className="relative aspect-[1440/900] overflow-hidden">
          {showVideo ? (
            <video
              src={project.video}
              poster={project.image}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={`${project.name} — ${project.category}, by Chris Hornak`}
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <Image
              src={project.image}
              alt={`${project.name} — ${project.category}, built by Chris Hornak`}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          )}
        </div>
      </a>

      {/* Copy */}
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h2 className="font-heading text-2xl font-bold tracking-tight">{project.name}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{project.outcome}</p>
        <a
          href={project.url}
          {...linkProps}
          className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:text-primary"
        >
          {project.cta ?? (isInternal ? 'Try it' : 'Visit site')}
          {isInternal ? <ArrowRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </a>
      </div>
    </motion.article>
  )
}

function CardGrid({ items }: { items: Project[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {items.map((project, i) => (
        <ProjectCard key={project.slug} project={project} index={i} />
      ))}
    </div>
  )
}

export function WorkGallery() {
  const clientProjects = projects.filter((p) => p.kind === 'client')
  const creativeProjects = projects.filter((p) => p.kind === 'creative')
  const ownedProjects = projects.filter((p) => p.kind === 'owned')

  return (
    <div className="relative mx-auto max-w-5xl space-y-10 px-6 pb-28 md:space-y-12 md:px-12 lg:px-24">
      <GroupLabel>{workContent.clientLabel}</GroupLabel>
      <CardGrid items={clientProjects} />

      <div className="pt-10 md:pt-14">
        <GroupLabel>{workContent.creativeLabel}</GroupLabel>
      </div>
      <CardGrid items={creativeProjects} />

      <div className="pt-10 md:pt-14">
        <GroupLabel>{workContent.ownedLabel}</GroupLabel>
      </div>
      <CardGrid items={ownedProjects} />
    </div>
  )
}
