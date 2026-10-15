'use server'

import { isAdmin } from '@/lib/admin-auth'
import { addTodo, deleteTodo, setFeedMins, setFeedStatus, updateTodo, type FeedStatus, type Todo, type TodoPatch } from '@/lib/admin-dashboard'
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
  })
  if (!ok) return { ok: false }
  if (input.job && !(await updateJobLead(input.job.id, { status: input.job.status as JobStatus }))) {
    if (input.status !== null) await setFeedStatus({ id: input.id, status: null })
    return { ok: false }
  }
  return { ok: true, until }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** To-do list: add one line. */
export async function addTodoItem(text: string): Promise<Todo | null> {
  if (!(await isAdmin())) return null
  const t = text.trim().slice(0, 300)
  if (!t) return null
  return addTodo(t)
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
