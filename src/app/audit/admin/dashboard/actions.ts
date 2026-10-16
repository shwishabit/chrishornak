'use server'

import { isAdmin } from '@/lib/admin-auth'
import { addTodo, deleteTodo, requestRefresh, setFeedMins, setFeedStatus, setGoalsEdits, setItemGoal, updateTodo, type FeedStatus, type Todo, type TodoPatch } from '@/lib/admin-dashboard'
import { UPKEEP, type Goal } from '@/lib/dash-goals'
import { JOB_STATUSES, updateJobLead, type JobStatus } from '@/lib/admin-jobs'
import { FEED_GROUPS, nyTomorrow } from '@/lib/dash-feed'

const STATUSES: FeedStatus[] = ['done', 'snoozed', 'skipped']

/**
 * Done / Snooze to tomorrow / Skip on one Feed item; status null = undo.
 * Job and question items also write their real job_leads status, so the
 * Job hunt tracker stays in sync.
 */
export async function setFeedItemStatus(input: {
  id: string
  status: FeedStatus | null
  title: string
  group: string
  mins: number
  brand?: string
  note?: string
  job?: { id: string; status: string }
}): Promise<{ ok: boolean; until?: string | null }> {
  if (!(await isAdmin())) return { ok: false }
  if (!input.id || input.id.length > 200) return { ok: false }
  if (input.status !== null && !STATUSES.includes(input.status)) return { ok: false }
  if (!FEED_GROUPS.some((g) => g.id === input.group)) return { ok: false }

  if (input.job && !(JOB_STATUSES as readonly string[]).includes(input.job.status)) return { ok: false }

  // Feed status first, then the job tracker. If the tracker write fails, take the feed
  // status back out, so the two never disagree (review 2026-10-15).
  const until = input.status === 'snoozed' ? nyTomorrow() : null
  const ok = await setFeedStatus({
    id: input.id,
    status: input.status,
    until,
    title: input.title.slice(0, 300),
    grp: input.group,
    mins: Math.max(0, Math.min(600, Math.round(input.mins))),
    brand: (input.brand ?? '').slice(0, 60),
    note: (input.note ?? '').trim().slice(0, 1000),
  })
  if (!ok) return { ok: false }
  if (input.job && !(await updateJobLead(input.job.id, { status: input.job.status as JobStatus }))) {
    if (input.status !== null) await setFeedStatus({ id: input.id, status: null })
    return { ok: false }
  }
  return { ok: true, until }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const TODO_LABELS = ['', 'email', 'sales', 'jobs', 'marketing', 'client', 'other']
/** Sites a to-do can be for (migration 0021). */
const TODO_BRANDS = ['', 'Chris Hornak', 'Blog Hands', 'Swift Growth']

/** To-do list: add one line, optionally labeled with a Feed group. */
export async function addTodoItem(text: string, label = '', brand = ''): Promise<Todo | null> {
  if (!(await isAdmin())) return null
  const t = text.trim().slice(0, 300)
  if (!t || !TODO_LABELS.includes(label) || !TODO_BRANDS.includes(brand)) return null
  return addTodo(t, label, brand)
}

/** To-do list: edit text, move to another day, tick, archive (or undo any of them). */
export async function updateTodoItem(id: string, patch: TodoPatch): Promise<boolean> {
  if (!(await isAdmin()) || !UUID.test(id)) return false
  const clean: TodoPatch = {}
  if (patch.text !== undefined) {
    const t = patch.text.trim().slice(0, 300)
    if (!t) return false
    clean.text = t
  }
  if (patch.day !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(patch.day) || Number.isNaN(Date.parse(patch.day))) return false
    clean.day = patch.day
  }
  if (typeof patch.position === 'number' && Number.isFinite(patch.position)) clean.position = patch.position
  if (patch.label !== undefined) {
    if (!TODO_LABELS.includes(patch.label)) return false
    clean.label = patch.label
  }
  if (patch.brand !== undefined) {
    if (!TODO_BRANDS.includes(patch.brand)) return false
    clean.brand = patch.brand
  }
  if (typeof patch.done === 'boolean') clean.done = patch.done
  if (typeof patch.archived === 'boolean') clean.archived = patch.archived
  if (!Object.keys(clean).length) return false
  return updateTodo(id, clean)
}

/** To-do list: remove for good. */
export async function deleteTodoItem(id: string): Promise<boolean> {
  if (!(await isAdmin()) || !UUID.test(id)) return false
  return deleteTodo(id)
}

/** Chris's own time estimate for one Feed item; null = back to the default. */
export async function setFeedItemMins(id: string, mins: number | null): Promise<boolean> {
  if (!(await isAdmin()) || !id || id.length > 200) return false
  if (mins !== null && (!Number.isInteger(mins) || mins < 1 || mins > 600)) return false
  return setFeedMins(id, mins)
}

/** A Due job follow-up was ticked: write the real date on the job lead's note, so the record shows it. */
export async function markJobFollowedUp(id: string, note: string): Promise<boolean> {
  if (!(await isAdmin()) || !id || id.length > 100) return false
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const next = `${note.trim()}
Followed up ${day}`.trim().slice(0, 2000)
  return updateJobLead(id, { note: next })
}

const GOAL_KEY = /^[a-z0-9-]{1,40}$/

/** Chris's goal pick for one Feed item or to-do; null = back to the automatic goal. */
export async function setItemGoalAction(id: string, goal: string | null): Promise<boolean> {
  if (!(await isAdmin()) || !id || id.length > 200) return false
  if (goal !== null && !GOAL_KEY.test(goal)) return false
  return setItemGoal(id, goal)
}

/** Goal edits from the Week tab. The PC writes them into GOALS.md within the hour (the file wins if it changed after). */
export async function saveGoalsAction(goals: Goal[]): Promise<string | null> {
  if (!(await isAdmin()) || !Array.isArray(goals) || goals.length > 8) return null
  const clean: Goal[] = []
  for (const g of goals) {
    const name = String(g?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
    if (!name) continue
    // A new goal gets a key from its name; an old one keeps its key so tags still point at it.
    const key = g.key && GOAL_KEY.test(g.key) ? g.key : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    if (!key || key === UPKEEP.key || clean.some((c) => c.key === key)) return null
    const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 10) : [])
    clean.push({ key, name, why: String(g.why ?? '').replace(/\s+/g, ' ').trim().slice(0, 200), auto: { brands: list(g.auto?.brands), groups: list(g.auto?.groups) } })
  }
  return setGoalsEdits(clean)
}

/** "Refresh now" button: leave a request for the PC job. */
export async function requestDashRefresh(): Promise<string | null> {
  if (!(await isAdmin())) return null
  return requestRefresh()
}
