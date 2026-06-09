// src/lib/types.ts — Chris Hornak personal brand hub

export interface NavLink {
  label: string
  href: string
}

export interface Testimonial {
  quote: string
  name: string
  title: string
  company: string
  initials: string
  image?: string
}

export interface Project {
  slug: string
  name: string
  /** Grouping — client work leads, owned brands close the page */
  kind: 'client' | 'owned'
  /** Live URL — external (https://) or internal (/audit) */
  url: string
  /** Short eyebrow, e.g. "SaaS · Built & owned" */
  category: string
  /** What I did, e.g. "Strategy · Brand · Build" */
  role: string
  /** Outcome-led description — leads with the thinking, not the deliverable */
  outcome: string
  /** Screenshot in /public/images/work */
  image: string
}

export interface SiteConfig {
  brandName: string
  supportEmail: string
  copyrightYear: number
  defaultTitle: string
  defaultDescription: string
  domain: string
}
