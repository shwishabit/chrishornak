'use client'

import { useState } from 'react'
import type { Catalog } from '@/lib/admin-dashboard'
import { ago } from '@/lib/dash-format'
import { AdminCatalog } from './AdminCatalog'
import { Chip, CopyButton, Updated } from './DashParts'

/* Claude tab (2026-10-15, was "Skills & agents"): the whole Claude Code setup in
 * one place — what you can say, agents (the map), skills, hooks, connections
 * (MCP servers), scheduled jobs and memory. One search box looks through all of
 * it. Read hourly from the workspace by dash-refresh.mjs. */

type View = 'say' | 'agents' | 'skills' | 'hooks' | 'connections' | 'schedules' | 'memory'

const HOOK_WHEN: Record<string, string> = {
  SessionStart: 'When a chat starts',
  UserPromptSubmit: 'When you send a message',
  PreToolUse: 'Before Claude uses a tool',
  PostToolUse: 'After Claude uses a tool',
  Stop: 'When Claude finishes',
  Notification: 'When Claude needs you',
}
const MCP_PLAIN: Record<string, string> = {
  supabase: 'Runs database changes for Blog Hands and chrishornak.com.',
  'pixel-art': 'Makes pixel art for the games.',
  context7: 'Looks up current docs for any library.',
  stitch: 'Google Stitch: makes UI design screens.',
  Sanity: 'Edits Sanity content (needs sign-in).',
}

export function DashClaude({ catalog, updated }: { catalog: Catalog | null; updated?: string }) {
  const [view, setView] = useState<View>('say')
  const [q, setQ] = useState('')
  if (!catalog) return <p className="mt-6 text-sm text-muted-foreground">No setup data yet. It fills in on the next hourly refresh.</p>

  const needle = q.trim().toLowerCase()
  const hit = (...t: (string | undefined)[]) => !needle || t.join(' ').toLowerCase().includes(needle)

  // Trigger rows often say only "see .agent/commands/x.md"; prefer the command's own plain description.
  const plainDoes = (t: { say: string[]; does: string }) => {
    const own = SAY_PLAIN[t.say[0]]
    if (own) return own
    const cmd = (catalog.commands ?? []).find((c) => t.say.includes(c.id))
    if (cmd?.description) return cmd.description
    const rest = t.does.replace(/^[`.]?[\w./ -]+\.(md|json|ps1)\s*(\+[^—]*)?(—\s*)?/i, '').trim()
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : t.does
  }
  const say = [
    // auto = CLAUDE.md row with no quoted phrase (e.g. "Project name in a work request"): it fires by itself.
    ...(catalog.triggers ?? []).map((t) => ({ key: t.label, phrases: t.say, does: plainDoes(t), auto: t.say.length === 1 && t.say[0] === t.label && !t.say[0].startsWith('/') })),
    ...(catalog.commands ?? []).filter((c) => !(catalog.triggers ?? []).some((t) => t.say.some((p) => p === c.id || p.startsWith(c.id + ' ')))).map((c) => ({ key: c.id, phrases: [c.id], does: c.description, auto: false })),
  ].filter((x) => hit(x.phrases.join(' '), x.does))
  const agents = catalog.agents.filter((a) => hit(a.id, a.description, a.group))
  const skills = catalog.skills.filter((s) => hit(s.id, s.description))
  const hooks = (catalog.hooks ?? []).filter((h) => hit(h.event, h.script, h.description, h.matcher))
  const mcp = (catalog.mcp ?? []).filter((m) => hit(m.name, MCP_PLAIN[m.name]))
  const schedules = (catalog.schedules ?? []).filter((x) => hit(x.name, x.description))
  const hubs = (catalog.memory?.hubs ?? []).filter((h) => hit(h.name, h.hint))

  const VIEWS: { id: View; label: string; n: number }[] = [
    { id: 'say', label: 'Say this', n: say.length },
    { id: 'agents', label: 'Agents', n: agents.length },
    { id: 'skills', label: 'Skills', n: skills.length },
    { id: 'hooks', label: 'Hooks', n: hooks.length },
    { id: 'connections', label: 'Connections', n: mcp.length },
    { id: 'schedules', label: 'Scheduled jobs', n: schedules.length },
    { id: 'memory', label: 'Memory', n: hubs.length },
  ]

  return (
    <div className="mt-6 grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search everything: a phrase, agent, skill, hook…"
          aria-label="Search the Claude setup"
          className="min-w-0 flex-1 basis-64 rounded-lg border border-border bg-well px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none"
        />
        <Updated iso={updated} staleHours={48} />
      </div>
      <div role="group" aria-label="Section" className="flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => setView(v.id)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${view === v.id ? 'border-primary-line bg-primary-deep text-primary' : 'border-border text-muted-foreground hover:text-foreground'} ${needle && v.n === 0 ? 'opacity-40' : ''}`}
          >
            {v.label} <span className="tabular-nums opacity-60">{v.n}</span>
          </button>
        ))}
      </div>

      {view === 'say' && (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">Words that switch Claude into a set routine. Click a phrase to copy it, then paste it into Claude Code.</p>
          {say.length === 0 && <p className="text-sm text-muted-foreground">Nothing matches.</p>}
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {SAY_GROUPS.map((g) => {
              const rows = say.filter((x) => sayGroup(x) === g.id)
              if (!rows.length) return null
              return (
                <section key={g.id} className="min-w-0 rounded-xl border border-border bg-panel p-4">
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {g.label} <span className="tabular-nums opacity-60">{rows.length}</span>
                  </h3>
                  <ul className="mt-1">
                    {rows.map((x) => (
                      <li key={x.key} className="grid gap-x-4 gap-y-1 border-t border-border py-2.5 first:border-t-0 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
                        <div className="min-w-0">
                          {g.id === 'auto' ? (
                            <span className="text-[13px] font-medium">{x.phrases[0]}</span>
                          ) : (
                            <SayButton text={x.phrases[0]} />
                          )}
                          {x.phrases.length > 1 && <p className="mt-1 text-[11px] text-muted-foreground">also: {x.phrases.slice(1, 4).join(' · ')}</p>}
                        </div>
                        <p className="line-clamp-2 text-[13px] text-muted-foreground" title={x.does}>{x.does}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </div>
      )}

      {view === 'agents' && (needle ? (
        <Cards empty={agents.length === 0}>
          {agents.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 font-medium">{a.id}</p>
                <Chip>{a.model}</Chip>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{a.description}</p>
              <div className="mt-2"><CopyButton text={a.say} /></div>
            </Card>
          ))}
        </Cards>
      ) : (
        <div className="-mt-6">
          <AdminCatalog catalog={catalog} updated={updated} />
        </div>
      ))}

      {view === 'skills' && (
        <Cards empty={skills.length === 0}>
          {skills.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 font-medium">{s.id}</p>
                <Chip>{s.type}</Chip>
              </div>
              <p className="mt-1 line-clamp-3 text-[13px] text-muted-foreground">{s.description || 'No description.'}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s.usedBy.length ? `Used by ${s.usedBy.join(', ')}` : 'You use it straight from chat.'}</p>
              {s.type === 'skill' && <div className="mt-2"><CopyButton text={`use the ${s.id} skill`} /></div>}
            </Card>
          ))}
        </Cards>
      )}

      {view === 'hooks' && (
        <Cards empty={hooks.length === 0}>
          <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">Small scripts that run by themselves at set moments. You don&apos;t call these. They guard and nudge every chat.</p>
          {hooks.map((h, i) => (
            <Card key={i}>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{HOOK_WHEN[h.event] ?? h.event}{h.matcher && !/\|/.test(h.matcher) ? ` · ${h.matcher}` : ''}</p>
              <p className="mt-1 text-[13.5px]">{h.description || h.script}</p>
              <p className="mt-1.5 text-xs text-muted-foreground"><code>{h.script}</code> · set for {h.scope}</p>
            </Card>
          ))}
        </Cards>
      )}

      {view === 'connections' && (
        <Cards empty={mcp.length === 0}>
          <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">MCP servers: outside tools Claude can use. Gmail, Drive and Calendar connect through claude.ai and are not listed here.</p>
          {mcp.map((m) => (
            <Card key={m.name}>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 font-medium">{m.name}</p>
                <Chip>{m.where === 'you' ? 'all projects' : 'this workspace'}</Chip>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{MCP_PLAIN[m.name] ?? 'No note yet.'}</p>
            </Card>
          ))}
        </Cards>
      )}

      {view === 'schedules' && (
        <Cards empty={schedules.length === 0}>
          {schedules.map((x) => (
            <Card key={x.name}>
              <div className="flex items-center gap-2">
                <i className={`h-2 w-2 rounded-full ${x.ok ? 'bg-primary' : 'bg-danger'}`} aria-hidden="true" />
                <p className="min-w-0 flex-1 font-medium">{x.name}</p>
                <Chip level={x.ok ? 'green' : 'red'}>{x.ok ? 'last run OK' : 'last run failed'}</Chip>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{x.description || 'No note yet.'}</p>
              <p className="mt-2 text-xs text-muted-foreground">Last ran {ago(x.last)} · next {x.next ? new Date(x.next).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : 'not set'}</p>
            </Card>
          ))}
        </Cards>
      )}

      {view === 'memory' && (
        <Cards empty={hubs.length === 0}>
          <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
            {catalog.memory?.files ?? 0} memory files, grouped into these themes. Claude reads the list at the start of every chat.
          </p>
          {hubs.map((h) => (
            <Card key={h.name}>
              <p className="font-medium">{h.name}</p>
              {h.hint && <p className="mt-1 text-[13px] text-muted-foreground">{h.hint.replace(/^⚠\s*/, '')}</p>}
            </Card>
          ))}
        </Cards>
      )}
    </div>
  )
}

// Plain words for trigger rows whose CLAUDE.md text is only a file path.
const SAY_PLAIN: Record<string, string> = {
  refresh: 'Picks up where you left off: reads the project notes and recent changes first.',
  'refresh my dashboard': 'Refreshes this dashboard now. It also runs by itself every hour.',
  'end session': 'Wraps up: saves where you left off, logs the changes and the next step.',
  'new project': 'Starts a new client project the standard way (asks which model and effort first).',
  'new game': 'Starts a new game with the game-dev process. Games are kept apart from client work.',
  "let's work on / maintain / grow [project]": 'Picks a project back up: continue it, maintain it, grow it, or write its case study.',
  experts: 'Asks the expert panel for one short, agreed second opinion.',
  "what's next": 'Adds an idea or task to the backlog with a date, without asking.',
}

// "Say this" groups. A row with no quoted phrase in CLAUDE.md is a rule that fires by itself.
const SAY_GROUPS = [
  { id: 'session', label: 'Start and finish a session', re: /refresh|leave off|continue from|end session|wrap up|\/status|\/sync|\/reset|dashboard/i },
  { id: 'think', label: 'Think it through first', re: /grill|stress|expert|panel|critique|karpathy|wait-what|\/bro|\/quick|calibrate/i },
  { id: 'work', label: 'Start or continue work', re: /new project|landing|game|work on|maintain|case study|blog/i },
  { id: 'capture', label: 'Capture and tidy', re: /log|backlog|queue|what's next|personalise|health-check/i },
  { id: 'auto', label: 'Happens by itself', re: /$^/ },
] as const
function sayGroup(x: { phrases: string[]; auto: boolean }): (typeof SAY_GROUPS)[number]['id'] {
  if (x.auto) return 'auto'
  return SAY_GROUPS.find((g) => g.re.test(x.phrases.join(' ')))?.id ?? 'capture'
}

/** A phrase that copies itself when clicked. */
function SayButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {}
      }}
      title="Click to copy"
      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-primary-line bg-primary-deep px-2 py-1 text-left text-[13px] font-medium text-primary transition-colors hover:bg-primary/15"
    >
      <span className="truncate">{done ? 'Copied' : text}</span>
    </button>
  )
}

function Cards({ empty, children }: { empty: boolean; children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{empty ? <p className="text-sm text-muted-foreground">Nothing matches.</p> : children}</div>
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 rounded-xl border border-border bg-panel p-4">{children}</div>
}
