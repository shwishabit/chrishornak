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
  /** Grouping — client work leads, then concepts/motion/social, owned brands close the page */
  kind: 'client' | 'creative' | 'owned'
  /** Live URL — external (https://) or internal (/audit) */
  url: string
  /** Short eyebrow, e.g. "SaaS · Built & owned" */
  category: string
  /** What I did, e.g. "Strategy · Brand · Build" */
  role: string
  /** Outcome-led description — leads with the thinking, not the deliverable */
  outcome: string
  /** Screenshot in /public/images/work (also the video poster) */
  image: string
  /** Optional muted preview loop in /public/media/work, shown instead of the screenshot */
  video?: string
  /** Text in the browser-frame address bar when the URL isn't a site (a video, a PDF) */
  frameLabel?: string
  /** Link label when "Visit site" / "Try it" doesn't fit */
  cta?: string
}

export interface SiteConfig {
  brandName: string
  supportEmail: string
  copyrightYear: number
  defaultTitle: string
  defaultDescription: string
  domain: string
}
