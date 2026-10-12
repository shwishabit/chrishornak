'use server'

import { isAdmin } from '@/lib/admin-auth'
import { JOB_STATUSES, updateJobLead, type JobStatus } from '@/lib/admin-jobs'

export async function setJobLeadStatus(id: string, status: string): Promise<boolean> {
  if (!(await isAdmin())) return false
  if (!(JOB_STATUSES as readonly string[]).includes(status)) return false
  return updateJobLead(id, { status: status as JobStatus })
}

export async function setJobLeadNote(id: string, note: string): Promise<boolean> {
  if (!(await isAdmin())) return false
  return updateJobLead(id, { note: note.slice(0, 4000) })
}
