import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'

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

export default function PrinciplesPage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />

      <section className="px-6 pt-32 pb-12 md:px-12 md:pt-36 md:pb-16 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Vibe Coding 101
          </p>
          <h1 className="mt-4 font-heading text-3xl leading-[1.15] font-bold tracking-tight md:text-4xl lg:text-5xl">
            Ten principles for coding with an AI without losing your weekend.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            These are the rules that separate a good session from a frustrating one. They&rsquo;re
            also the rules the starter repo enforces — via skills, commands, and the{' '}
            <code>CLAUDE.md</code> your AI loads on every conversation. Read them once. Come back
            when something feels wrong.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            New here?{' '}
            <Link href="/learn/vibe-coding" className="text-primary underline underline-offset-4 hover:opacity-80">
              Start with the setup walkthrough →
            </Link>
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 md:px-12 md:pb-32 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <ol className="space-y-16 md:space-y-20">
            {principles.map((p) => (
              <li key={p.id} id={p.id} className="scroll-mt-32">
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

          <div className="mt-20 rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <h3 className="font-heading text-base font-bold md:text-lg">
              Where to go next
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Back to the setup walkthrough at{' '}
              <Link href="/learn/vibe-coding" className="text-primary underline underline-offset-4 hover:opacity-80">
                /learn/vibe-coding
              </Link>
              , or grab the starter at{' '}
              <a
                href="https://github.com/shwishabit/vibe-coding-starter"
                className="text-primary underline underline-offset-4 hover:opacity-80"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/shwishabit/vibe-coding-starter
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
