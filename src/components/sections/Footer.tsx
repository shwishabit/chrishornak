import { Linkedin, Youtube, Twitter, AtSign, MessageCircle, Newspaper, BookOpen, PenLine, Mic, Wrench } from 'lucide-react'
import { siteConfig, toolLinks } from '@/lib/data'
import { Logo } from '@/components/ui/Logo'
import { PartnerBadges } from '@/components/sections/PartnerBadges'

// Lucide has no Bluesky mark, so this is the butterfly (Simple Icons path).
function Bluesky({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  )
}

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/chrishornak/', icon: Linkedin },
  { label: 'YouTube', href: 'https://www.youtube.com/@chrishornak', icon: Youtube },
  { label: 'X', href: 'https://twitter.com/chrishornak', icon: Twitter },
  { label: 'Threads', href: 'https://www.threads.net/@chornak', icon: AtSign },
  { label: 'Bluesky', href: 'https://bsky.app/profile/chrishornak.bsky.social', icon: Bluesky },
  { label: 'Reddit', href: 'https://www.reddit.com/user/chris-hornak/', icon: MessageCircle },
]

const contentLinks = [
  { label: 'Newsletter', href: 'https://www.linkedin.com/newsletters/7140458992799002627/', icon: Newspaper },
  { label: 'Blog Hands Blog', href: 'https://bloghands.com/blog', icon: PenLine },
  { label: 'Swift Growth Blog', href: 'https://swiftgrowth.marketing/blog', icon: PenLine },
  { label: 'Blog Hands Tools', href: 'https://bloghands.com/tools', icon: Wrench },
  { label: 'Swift Growth Tools', href: 'https://swiftgrowth.marketing/tools', icon: Wrench },
  { label: 'Blog Genius (Book)', href: 'https://www.amazon.com/Blog-Genius-Ultimate-How-Effective-ebook/dp/B01FECRGPK', icon: BookOpen },
  { label: 'Content Brief Podcast', href: 'https://podcasters.spotify.com/pod/show/content-brief', icon: Mic },
]

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <a href="/" className="text-foreground">
              <Logo className="h-8 w-auto" />
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Marketing strategist for business owners who are done guessing and ready to grow.
            </p>
            <PartnerBadges className="mt-6" />
          </div>

          {/* Free tools (this site) */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Free tools</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {toolLinks.map((t) => (
                <li key={t.href}>
                  <a
                    href={t.href}
                    className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/tools"
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  All free tools
                </a>
              </li>
            </ul>
          </div>

          {/* Content */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Content</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {contentLinks.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Connect</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/50 pt-6">
          <p className="text-xs text-muted-foreground">
            &copy; {siteConfig.copyrightYear} {siteConfig.brandName}. All rights reserved.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            Offices in Pittsburgh, PA and Wheeling, WV &mdash; Serving businesses nationwide
            <span className="mx-2">&middot;</span>
            <a href="/privacy" className="hover:text-muted-foreground transition-colors duration-200">Privacy Policy</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
