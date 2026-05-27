import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { VibeCodingSidebar } from '@/components/sections/VibeCodingSidebar'
import { VibeCodingTopBar } from '@/components/sections/VibeCodingTopBar'

const sidebarSections = [
  { id: 'tracks', label: 'Pick a track' },
  { id: 'free-setup', label: 'Free Starter setup' },
  { id: 'recommended-setup', label: 'Recommended setup' },
  { id: 'clone', label: 'Clone the starter' },
  { id: 'first-conversation', label: 'First conversation' },
  { id: 'pick-a-project', label: 'Pick your first project' },
  { id: 'ship-it', label: 'Ship it' },
  { id: 'domain', label: 'Buy a domain' },
  { id: 'stack', label: 'The stack' },
]

const sidebarExternalLinks = [
  { href: 'https://github.com/shwishabit/vibe-coding-starter', label: 'Starter repo' },
  { href: 'https://github.com/shwishabit/vibe-coding-starter/blob/main/OPTIONAL-SKILLS.md', label: 'Optional skills' },
  { href: 'https://github.com/shwishabit/vibe-coding-starter/blob/main/TROUBLESHOOTING.md', label: 'Troubleshooting' },
]

export const metadata: Metadata = {
  title: 'Vibe Coding — Start Here',
  description: 'A clone-and-go starter for learning to code with an AI agent. Two tracks: free and recommended.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: '/learn/vibe-coding' },
}

const ideationOrder = [
  {
    title: 'Website for yourself or a side project',
    body: 'Portfolio, club site, event page, a "here&rsquo;s what I do" page for the side hustle. Easiest first ship. You learn HTML, components, routing, deployment — and you end up with a real URL people can click.',
  },
  {
    title: 'Web app with login and a database',
    body: 'Anything where users sign in and the app remembers their stuff. Habit tracker, study log, recipe box, gym journal. Adds two big concepts (auth + database) but the AI handles 80% of the boilerplate.',
  },
  {
    title: 'Game',
    body: 'A small browser game — Snake, a platformer, a card matcher. Hardest of the seven for a first project (game loops + state) but the most fun if you stick with it.',
  },
  {
    title: 'Scratch-your-own-itch tool',
    body: 'A thing you personally want to exist. A spreadsheet replacement for the one thing the spreadsheet is bad at. A converter, a formatter, a tracker. These are the best learning projects because you actually use them.',
  },
  {
    title: 'LLM wrapper',
    body: 'A tool that calls an AI in the middle. Resume rewriter, code reviewer, study-flashcard maker. The "wrapper" gets a bad rap but for a first project it teaches you how the AI parts of modern apps actually work.',
  },
  {
    title: 'Discord bot',
    body: 'If you live in Discord, build a bot for your server. /roll, /remindme, fetch-a-stat, etc. Fast feedback loop, low stakes, instantly shareable.',
  },
  {
    title: 'Browser extension',
    body: 'A button that does something on every page (or on one specific site you use a lot). Tab manager, link saver, page summarizer. Distribution is harder than the build — the Chrome store has a review process — but the actual code is small.',
  },
]

function Sidebar() {
  return <VibeCodingSidebar sections={sidebarSections} externalLinks={sidebarExternalLinks} />
}

export default function VibeCodingPage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <VibeCodingTopBar />

      <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 md:px-10 md:pt-12 md:pb-32 lg:px-12">
        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </aside>

          {/* Mobile: collapsed TOC */}
          <details className="mb-8 rounded-lg border border-border/20 bg-muted/10 p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              On this page
            </summary>
            <div className="mt-4">
              <Sidebar />
            </div>
          </details>

          {/* Main content */}
          <article className="min-w-0">
            {/* HERO */}
            <header>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Vibe Coding · Start Here
              </p>
              <h1 className="mt-4 font-heading text-3xl leading-[1.15] font-bold tracking-tight md:text-4xl lg:text-5xl">
                A clone-and-go starter for learning to code with an AI.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                For anyone curious about &ldquo;vibe coding&rdquo; who wants a clean place to
                start that won&rsquo;t bury them in setup. Clone the repo, pick a track, and ship
                something real in a weekend.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Two tracks below. Both clone the same starter repo. Both ship the same paradigm —
                agent, memory, skills, slash commands. The difference is how powerful the AI is
                and whether you&rsquo;re paying.
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                Before you start, read the{' '}
                <Link
                  href="/learn/vibe-coding/principles"
                  className="text-primary underline underline-offset-4 hover:opacity-80"
                >
                  10 principles
                </Link>{' '}
                — five minutes. They&rsquo;ll save you hours.
              </p>
            </header>

            {/* TWO TRACKS */}
            <section id="tracks" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">Pick a track</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {/* Free */}
                <div className="rounded-xl border border-border/20 bg-muted/10 p-6 md:p-7">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-heading text-lg font-bold md:text-xl">Free Starter</h3>
                    <span className="text-sm font-semibold text-primary">$0</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Closest free analog to a paid agent. When you upgrade later, it&rsquo;s a
                    tool swap, not a relearn.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="text-foreground">IDE:</span> VSCode
                    </li>
                    <li>
                      <span className="text-foreground">AI:</span> Cline extension + Google
                      Gemini free API key
                    </li>
                    <li>
                      <span className="text-foreground">Where you&rsquo;ll feel limits:</span>{' '}
                      rate-limited on long sessions, weaker on hard reasoning
                    </li>
                  </ul>
                </div>

                {/* Recommended */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 md:p-7">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-heading text-lg font-bold md:text-xl">Recommended</h3>
                    <span className="text-sm font-semibold text-primary">~$20/mo</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    What I actually use. Worth the upgrade once you&rsquo;ve shipped one thing on
                    the free track and know it&rsquo;s for you.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="text-foreground">IDE:</span> VSCodium (VSCode also works)
                    </li>
                    <li>
                      <span className="text-foreground">AI:</span> Claude Code CLI + Claude Pro
                    </li>
                    <li>
                      <span className="text-foreground">Where you&rsquo;ll feel the upgrade:</span>{' '}
                      multi-file changes, debugging gnarlier bugs, longer focused sessions
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* FREE SETUP */}
            <section id="free-setup" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">Free Starter setup</h2>
              <ol className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                <li>
                  <span className="text-foreground font-semibold">1. Install VSCode.</span>{' '}
                  Download from{' '}
                  <a
                    href="https://code.visualstudio.com"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    code.visualstudio.com
                  </a>
                  . Accept the defaults.
                </li>
                <li>
                  <span className="text-foreground font-semibold">2. Install Cline.</span> Open
                  VSCode → Extensions panel (Cmd/Ctrl+Shift+X) → search &ldquo;Cline&rdquo; →
                  Install.
                </li>
                <li>
                  <span className="text-foreground font-semibold">3. Get a free Gemini key.</span>{' '}
                  Go to{' '}
                  <a
                    href="https://aistudio.google.com"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    aistudio.google.com
                  </a>
                  , sign in with your Google account, click <em>Get API key</em>. Copy it.
                </li>
                <li>
                  <span className="text-foreground font-semibold">4. Paste the key into Cline.</span>{' '}
                  Open the Cline panel → Settings → API Provider: Google Gemini → paste the key.
                  Pick the latest <code>gemini-2.x-pro</code> or whatever&rsquo;s current.
                </li>
                <li>
                  <span className="text-foreground font-semibold">5. Done.</span> Skip to{' '}
                  <a
                    href="#clone"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                  >
                    Clone the starter →
                  </a>
                </li>
              </ol>
            </section>

            {/* RECOMMENDED SETUP */}
            <section id="recommended-setup" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">Recommended setup</h2>
              <ol className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                <li>
                  <span className="text-foreground font-semibold">1. Install VSCodium</span> (or
                  stick with VSCode if you already have it). Download from{' '}
                  <a
                    href="https://vscodium.com"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    vscodium.com
                  </a>
                  . VSCodium is the same editor minus Microsoft&rsquo;s telemetry.
                </li>
                <li>
                  <span className="text-foreground font-semibold">2. Install Claude Code.</span>{' '}
                  Follow the official instructions at{' '}
                  <a
                    href="https://docs.claude.com/claude-code"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    docs.claude.com/claude-code
                  </a>
                  . On a Mac:{' '}
                  <code className="rounded bg-muted/30 px-1.5 py-0.5">npm install -g @anthropic-ai/claude-code</code>
                  .
                </li>
                <li>
                  <span className="text-foreground font-semibold">3. Subscribe to Claude Pro.</span>{' '}
                  Sign up at{' '}
                  <a
                    href="https://claude.ai"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    claude.ai
                  </a>
                  . Pro plan unlocks Claude Code at the included rate.
                </li>
                <li>
                  <span className="text-foreground font-semibold">4. Authenticate.</span> Run{' '}
                  <code className="rounded bg-muted/30 px-1.5 py-0.5">claude login</code> in your
                  terminal. Pick browser auth.
                </li>
                <li>
                  <span className="text-foreground font-semibold">5. Done.</span> On to the
                  repo.
                </li>
              </ol>
            </section>

            {/* CLONE */}
            <section id="clone" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">Clone the starter</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                A <em>repo</em> is a folder of code with a memory of every change ever made
                (that&rsquo;s the &ldquo;git&rdquo; part). When you clone it, you get a copy you
                can modify without affecting the original.
              </p>
              <pre className="mt-6 overflow-x-auto rounded-lg border border-border/20 bg-muted/20 p-4 text-sm">
{`git clone https://github.com/shwishabit/vibe-coding-starter.git my-project
cd my-project
rm -rf .git && git init`}
              </pre>
              <p className="mt-4 text-sm text-muted-foreground">
                The last line wipes the starter&rsquo;s history so your new project starts fresh.
                Open the <code>my-project</code> folder in your editor.
              </p>
            </section>

            {/* FIRST CONVERSATION */}
            <section id="first-conversation" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">
                Your first conversation
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Open Cline (or Claude Code) and type:
              </p>
              <pre className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
help me set up my workspace
              </pre>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                The <code>setup-workspace</code> skill will run a short Q&amp;A — name, what
                you&rsquo;re building, whether you want design skills, whether to install a docs
                lookup tool. Your answers get written to <code>memory/user_role.md</code> so the
                AI remembers them across sessions.
              </p>
            </section>

            {/* PICK A PROJECT */}
            <section id="pick-a-project" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">
                Pick your first project
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Roughly in order of how friendly the first project will be. The first two are
                where most people should start.
              </p>
              <ol className="mt-8 space-y-8">
                {ideationOrder.map((idea, i) => (
                  <li key={idea.title} className="border-l-2 border-primary/30 pl-5">
                    <div className="flex items-baseline gap-3">
                      <span className="font-heading text-xs font-bold tracking-widest text-primary">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-heading text-base font-bold md:text-lg">
                        {idea.title}
                      </h3>
                    </div>
                    <p
                      className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base"
                      dangerouslySetInnerHTML={{ __html: idea.body }}
                    />
                  </li>
                ))}
              </ol>
              <p className="mt-10 text-base leading-relaxed text-muted-foreground md:text-lg">
                Once you&rsquo;ve picked: tell the AI &ldquo;I want to build [X],&rdquo; then
                type <code>/grill-me</code>. It&rsquo;ll interview you for 5–10 minutes before
                any code gets written. That&rsquo;s the discipline that makes the rest of the
                project possible.
              </p>
            </section>

            {/* SHIP IT */}
            <section id="ship-it" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">Ship it</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                For most first projects, the easiest host is{' '}
                <a
                  href="https://vercel.com"
                  className="text-primary underline underline-offset-4 hover:opacity-80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel
                </a>
                . Free tier handles small projects. You get a URL like{' '}
                <code>your-project.vercel.app</code>. Ask the AI to walk you through deployment
                — it&rsquo;s usually 3 clicks plus connecting your GitHub.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Send the URL to someone. Watch them use it. That&rsquo;s the loop.
              </p>
            </section>

            {/* DOMAIN */}
            <section id="domain" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">
                When you&rsquo;re ready: buy a domain
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                <code>your-project.vercel.app</code> is fine while you&rsquo;re testing. Once
                it&rsquo;s real and you want to share it with people who aren&rsquo;t
                programmers, buy a domain.
              </p>
              <ul className="mt-5 space-y-3 text-base text-muted-foreground">
                <li>
                  <span className="text-foreground font-semibold">Default:</span>{' '}
                  <a
                    href="https://vercel.com/domains"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Vercel Domains
                  </a>{' '}
                  — buy and connect in the same place. Zero config friction.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Portable alternative:</span>{' '}
                  <a
                    href="https://porkbun.com"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Porkbun
                  </a>{' '}
                  — fair prices, no upsell trap, easy to move to a different host later.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Avoid:</span> GoDaddy. I use
                  them by inertia. New domains shouldn&rsquo;t go there.
                </li>
              </ul>
            </section>

            {/* STACK */}
            <section id="stack" className="mt-16 scroll-mt-20">
              <h2 className="font-heading text-xl font-bold md:text-2xl">
                The stack you&rsquo;ll grow into
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Don&rsquo;t set all of this up on day one. Add each piece when you actually need
                it.
              </p>
              <ul className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                <li>
                  <span className="text-foreground font-semibold">GitHub</span> — where your
                  code lives. Free. Sign up once, never think about it again.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Vercel</span> — where your
                  site gets hosted. Free tier covers everything below paid-product traffic.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Supabase</span> — database +
                  login. You&rsquo;ll need this the first time you build something with user
                  accounts.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Resend</span> — sending email
                  from your app (welcome emails, password resets, notifications). Free for 3,000
                  emails a month.
                </li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                All four are sane defaults that play well together. When you outgrow any of
                them, you&rsquo;ll know.
              </p>
            </section>
          </article>
        </div>
      </div>

      <Footer />
    </main>
  )
}
