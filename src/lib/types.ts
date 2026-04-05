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
}

export interface SiteConfig {
  brandName: string
  supportEmail: string
  copyrightYear: number
  defaultTitle: string
  defaultDescription: string
  domain: string
}
