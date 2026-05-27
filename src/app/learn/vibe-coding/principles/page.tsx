import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { VibeCodingSidebar } from '@/components/sections/VibeCodingSidebar'
import { VibeCodingTopBar } from '@/components/sections/VibeCodingTopBar'

export const metadata: Metadata = {
  title: 'Vibe Coding 101 — Principles',
  description: 'Ten principles for coding with an AI agent without losing your weekend.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: '/learn/vibe-coding/principles' },
}

type Principle = {
  id: string
  number: string
  title: string
  body: React.ReactNode
}

const principles: Principle[] = [
  {
    id: 'grill-before-you-code',
    number: '01',
    title: 'Grill before you code',
    body: (
      <>
        <p>
          Every bug, miscommunication, and dead-end rewrite traces back to an assumption that
          nobody questioned. Twenty minutes of grilling saves four hours of debugging — or saves
          you from a quietly-derailed project that took two weeks before anyone noticed.
        </p>
        <p>
          Before any non-trivial work: type <code>/grill-me</code>. Your AI will stop, interview
          you one question at a time, surface the ambiguities, name the edge cases, and only then
          restate the plan for your approval.
        </p>
        <p className="text-muted-foreground">
          Always. No exceptions on day one. The instinct to skip ahead is the exact instinct this
          principle exists to override.
        </p>
      </>
    ),
  },
  {
    id: 'verify-before-you-ship',
    number: '02',
    title: 'Verify before you ship',
    body: (
      <>
        <p>
          &ldquo;Should work&rdquo; is not evidence. &ldquo;The AI said it&rsquo;s fixed&rdquo; is
          not evidence. The build output, the test result, the curl response — that&rsquo;s
          evidence.
        </p>
        <p>
          Before you (or your AI) claim something is done, fixed, passing, or shipped: run the
          actual verification command in the current turn. Read the output. Then make the claim,
          and quote the line that proves it.
        </p>
        <p className="text-muted-foreground">
          The starter has this codified as a skill the AI invokes automatically. If you catch it
          skipping, call it out — that&rsquo;s a teaching moment.
        </p>
      </>
    ),
  },
  {
    id: 'name-what-you-want',
    number: '03',
    title: 'Name what you want, not how to build it',
    body: (
      <>
        <p>
          &ldquo;Add a button that opens a modal with the user&rsquo;s last 5 orders&rdquo; is a
          better prompt than &ldquo;create a Modal component using React.createPortal with
          useState for the open state and pass an orders prop.&rdquo;
        </p>
        <p>
          The AI is better at picking the &ldquo;how&rdquo; than you are. Your job is to be crisp
          about the &ldquo;what&rdquo; and the &ldquo;why.&rdquo; When you specify the
          implementation, you trap the AI inside your existing knowledge — you lose the upside
          of working with something that&rsquo;s read more code than you ever will.
        </p>
      </>
    ),
  },
  {
    id: 'small-commits-frequent-runs',
    number: '04',
    title: 'Small commits, frequent runs',
    body: (
      <>
        <p>
          Commit when a thing works, not when the whole project is done. A working repo with 50
          small commits is recoverable. A broken repo with one giant commit is a weekend.
        </p>
        <p>
          Run the app constantly. Every meaningful change → reload the page, click the thing,
          watch the output. The faster you spot a regression, the cheaper it is to fix.
        </p>
      </>
    ),
  },
  {
    id: 'read-the-error-before-you-ask',
    number: '05',
    title: 'Read the error before you ask',
    body: (
      <>
        <p>
          Most errors contain the answer. The line number tells you where. The message tells you
          what. The stack tells you how you got there.
        </p>
        <p>
          Before pasting an error and asking &ldquo;what now,&rdquo; spend 60 seconds: quote the
          first failing line, translate it into plain English, then form a hypothesis. Often
          you&rsquo;ll fix it before you finish the sentence.
        </p>
        <p className="text-muted-foreground">
          If you do paste it: quote the relevant line, not the entire 200-line stack trace. The
          AI works better with focus too.
        </p>
      </>
    ),
  },
  {
    id: 'when-stuck-in-a-loop-reset',
    number: '06',
    title: 'When stuck in a loop, /reset — don\'t push through',
    body: (
      <>
        <p>
          You&rsquo;ll know the loop when you feel it: same file, third or fourth attempt, each
          fix breaks something else. The AI&rsquo;s confidence stays high. Your confidence
          drops. This is the danger zone.
        </p>
        <p>
          Type <code>/reset</code>. The AI will stop, report what&rsquo;s been touched, name the
          last clean checkpoint, and offer three options: revert via git, keep what you have and
          re-grill the plan, or accept the current state and continue.
        </p>
        <p>
          Pushing through almost never works. Resetting feels like losing 20 minutes. It usually
          saves you two hours.
        </p>
      </>
    ),
  },
  {
    id: 'save-what-you-learn',
    number: '07',
    title: 'Save what you learn',
    body: (
      <>
        <p>
          When something surprises you, when a fix took longer than it should have, when you
          realize a preference about how you want the AI to work — type{' '}
          <code>/log &lt;the lesson&gt;</code>. It gets appended verbatim to{' '}
          <code>memory/LESSONS.md</code>.
        </p>
        <p>
          Memory is what turns a beginner setup into your setup. The AI reads it on every
          conversation. Stuff you teach it once, you don&rsquo;t have to teach it again.
        </p>
      </>
    ),
  },
  {
    id: 'explain-the-plan-before-writing-code',
    number: '08',
    title: 'Explain the plan before writing code',
    body: (
      <>
        <p>
          For anything bigger than a one-line change, the AI should state its plan in 1–2
          sentences before writing anything: what it&rsquo;ll change, which files it&rsquo;ll
          touch, and any risk worth flagging. Then pause for your confirmation.
        </p>
        <p>
          The starter has this as a skill. If the AI just starts writing 200 lines without
          telling you what it&rsquo;s doing — that&rsquo;s the bug. Stop it and ask for the plan.
        </p>
      </>
    ),
  },
  {
    id: 'one-file-at-a-time',
    number: '09',
    title: 'One file at a time — don\'t let it touch everything',
    body: (
      <>
        <p>
          A change that spans 12 files for a simple feature is usually a sign the AI got carried
          away or the abstraction is wrong. Both are worth a pause.
        </p>
        <p>
          Push back: &ldquo;Can we do this without touching the routing layer?&rdquo; or
          &ldquo;Why does this need a new config file?&rdquo; Often the answer is &ldquo;you
          don&rsquo;t and it doesn&rsquo;t&rdquo; — but the AI will only catch it if you ask.
        </p>
      </>
    ),
  },
  {
    id: 'build-the-smallest-thing-that-proves-it-works',
    number: '10',
    title: 'Build the smallest thing that proves it works',
    body: (
      <>
        <p>
          The first version of a feature should do one thing on the happy path, with hardcoded
          inputs, no error handling, no edge cases, no styling. The point is to confirm the
          shape is right.
        </p>
        <p>
          Once it works, then add the second case. Then the error handling. Then the styling.
          Each layer is a separate small commit. Each layer is a separate verification.
        </p>
        <p className="text-muted-foreground">
          This is the opposite of how most beginners code. It&rsquo;s also the difference
          between shipping in a weekend and not shipping for six months.
        </p>
      </>
    ),
  },
]

const principleSections = [
  ...principles.map((p) => ({
    id: p.id,
    label: `${p.number}. ${p.title}`,
  })),
  { id: 'working-with-your-ai', label: 'Working with your AI' },
]

const principleExternalLinks = [
  { href: 'https://github.com/shwishabit/vibe-coding-starter', label: 'Starter repo' },
  { href: 'https://github.com/shwishabit/vibe-coding-starter/blob/main/OPTIONAL-SKILLS.md', label: 'Optional skills' },
  { href: 'https://github.com/shwishabit/vibe-coding-starter/blob/main/TROUBLESHOOTING.md', label: 'Troubleshooting' },
]

function Sidebar() {
  return <VibeCodingSidebar sections={principleSections} externalLinks={principleExternalLinks} />
}

export default function PrinciplesPage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <VibeCodingTopBar />

      <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 md:px-10 md:pt-12 md:pb-32 lg:px-12">
        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <Sidebar />
            </div>
          </aside>

          {/* Mobile TOC */}
          <details className="mb-8 rounded-lg border border-border/20 bg-muted/10 p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              On this page
            </summary>
            <div className="mt-4">
              <Sidebar />
            </div>
          </details>

          <article className="min-w-0">
            <header>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Vibe Coding 101
              </p>
              <h1 className="mt-4 font-heading text-3xl leading-[1.15] font-bold tracking-tight md:text-4xl lg:text-5xl">
                Ten principles for coding with an AI without losing your weekend.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                These are the rules that separate a good session from a frustrating one.
                They&rsquo;re also the rules the starter repo enforces — via skills, commands,
                and the <code>CLAUDE.md</code> your AI loads on every conversation. Read them
                once. Come back when something feels wrong.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                New here?{' '}
                <Link
                  href="/learn/vibe-coding"
                  className="text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Start with the setup walkthrough →
                </Link>
              </p>
            </header>

            <h2 className="mt-16 font-heading text-xs font-bold uppercase tracking-widest text-primary">
              The ten principles
            </h2>
            <ol className="mt-6 space-y-16 md:space-y-20">
              {principles.map((p) => (
                <li key={p.id} id={p.id} className="scroll-mt-20">
                  <div className="flex items-baseline gap-4">
                    <span className="font-heading text-sm font-bold tracking-widest text-primary">
                      {p.number}
                    </span>
                    <h2 className="font-heading text-xl font-bold leading-snug md:text-2xl">
                      {p.title}
                    </h2>
                  </div>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                    {p.body}
                  </div>
                  <div className="mt-4">
                    <a
                      href={`#${p.id}`}
                      className="text-xs uppercase tracking-wider text-primary/60 transition-colors hover:text-primary"
                      aria-label={`Anchor link to ${p.title}`}
                    >
                      # {p.id}
                    </a>
                  </div>
                </li>
              ))}
            </ol>

            {/* WORKING WITH YOUR AI */}
            <section id="working-with-your-ai" className="mt-20 scroll-mt-20 md:mt-24">
              <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
                Working with your AI
              </h2>
              <p className="mt-3 font-heading text-2xl font-bold leading-snug md:text-3xl">
                Four disciplines, one filter, two modes.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                The principles above are rules for <em>you</em>. The four below are rules for how
                <em> you and the AI</em> work together. Each one is also baked into the starter
                — as a skill the AI loads automatically, or a slash command you can invoke.
              </p>

              {/* Karpathy filter */}
              <div className="mt-12 border-l-2 border-primary/40 pl-5">
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
                  Filter
                </p>
                <h3 className="mt-2 font-heading text-xl font-bold md:text-2xl">
                  The Karpathy filter
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  Before any non-trivial change, the AI runs four checks: <strong>Think
                  first</strong> (state assumptions, surface ambiguity), <strong>Simplicity
                  first</strong> (minimum code that solves it — no speculative flexibility),{' '}
                  <strong>Surgical changes</strong> (touch only what the request requires,
                  don&rsquo;t refactor adjacent code), <strong>Goal-driven</strong> (know the
                  success criterion before starting).
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  Type <code>/karpathy</code> any time to make the AI run this audit out loud. If
                  it&rsquo;s drifting toward a 200-line rewrite when you asked for a 3-line fix,
                  this is the brake.
                </p>
              </div>

              {/* Caveman mode */}
              <div className="mt-12 border-l-2 border-primary/40 pl-5">
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
                  Mode
                </p>
                <h3 className="mt-2 font-heading text-xl font-bold md:text-2xl">
                  Caveman mode
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  An ultra-compressed response style. Cuts token usage by roughly 75% — all
                  technical substance stays, only the filler dies. Especially useful on the free
                  Gemini track (rate limits hit you faster) and during long sessions.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  Type <code>/caveman</code> to turn it on. Stays on until you type{' '}
                  <code>stop caveman</code>. The AI drops articles, fillers, and pleasantries —
                  keeps file paths, errors, and code exact. Reads tight, ships fast.
                </p>
              </div>

              {/* Fresh chats */}
              <div className="mt-12 border-l-2 border-primary/40 pl-5">
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
                  Mode
                </p>
                <h3 className="mt-2 font-heading text-xl font-bold md:text-2xl">
                  Fresh chats
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  Every message you send includes the entire conversation history. The longer the
                  history, the slower the response, the more tokens you burn, and the more
                  likely the AI loses the thread on something important from earlier.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  When you shift acts — designing → building, building → debugging — start a
                  fresh chat. Type <code>/fresh</code> first and the AI produces a paste-ready
                  handoff summary (goal, where we are, next step, files in flight). Paste it into
                  the new conversation. Continue.
                </p>
              </div>

              {/* Approval gates */}
              <div className="mt-12 border-l-2 border-primary/40 pl-5">
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
                  Safety
                </p>
                <h3 className="mt-2 font-heading text-xl font-bold md:text-2xl">
                  Approval gates
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  The AI never does these without asking first: pushing to a remote repo,
                  deploying to production, deleting files you authored, installing paid packages
                  or services, sending email or messages from your account.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  The cost of asking once is low. The cost of a wrong destructive action is high.
                  If your AI ever does any of those without confirmation, that&rsquo;s a bug —
                  add it to <code>memory/feedback_*.md</code> so it doesn&rsquo;t happen again.
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>

      <Footer />
    </main>
  )
}
