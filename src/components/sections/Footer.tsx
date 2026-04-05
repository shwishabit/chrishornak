import { Linkedin, Youtube, Twitter, AtSign, MessageCircle, Newspaper, BookOpen, PenLine, Mic, Wrench } from 'lucide-react'
import { siteConfig } from '@/lib/data'
import { Logo } from '@/components/ui/Logo'

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/chrishornak/', icon: Linkedin },
  { label: 'YouTube', href: 'https://www.youtube.com/@chrishornak', icon: Youtube },
  { label: 'X', href: 'https://twitter.com/chrishornak', icon: Twitter },
  { label: 'Threads', href: 'https://www.threads.net/@chornak', icon: AtSign },
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
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <a href="/" className="text-foreground">
              <Logo className="h-8 w-auto" />
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Marketing strategist for business owners who are done guessing and ready to grow.
            </p>
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
          <p className="mt-1 text-xs text-muted-foreground/60">
            Pittsburgh, PA &middot; Wheeling, WV &middot; Serving businesses nationwide
            <span className="mx-2">&middot;</span>
            <a href="/privacy" className="hover:text-muted-foreground transition-colors duration-200">Privacy Policy</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
