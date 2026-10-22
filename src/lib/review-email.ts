/* ── Client review email (server-only) ────────────────────────────────────
 * Sent once, when the client presses Finalize on /review/<token>. Lists every
 * section with its reaction and note, grouped by option. Sends through Resend
 * in production (or with REVIEW_EMAIL_LIVE=1); otherwise writes the email to
 * .review-data/outbox/ so local tests never send real mail.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { promises as fs } from 'fs'
import path from 'path'
import { Resend } from 'resend'
import type { ReviewContent } from '@/content/reviews/types'
import type { ReviewState, Reaction } from '@/lib/review-store'

const TO = process.env.REVIEW_NOTIFY_EMAIL || 'chris@chrishornak.com'
const FROM = 'Chris Hornak <chris@chrishornak.com>'

const REACTION_LABEL: Record<Reaction, string> = { '': '', like: 'Like', dislike: "Don't like", change: 'Change it' }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

interface Row { key: string; label: string; reaction: string; note: string }

function rows(content: ReviewContent, state: ReviewState): { group: string; items: Row[] }[] {
  const pick = (key: string, label: string): Row => {
    const c = state.comments[key]
    return { key, label, reaction: c ? REACTION_LABEL[c.reaction] : '', note: c?.note ?? '' }
  }
  const groups = content.options.map((o) => ({
    group: `Option ${o.key} · ${o.name}`,
    items: [
      pick(`${o.key}0`, 'Overall'),
      ...o.pages.flatMap((p) => p.sections.map((s) => pick(s.key, `${s.key} · ${p.label} · ${s.label}`))),
    ],
  }))
  groups.push({ group: 'General comments', items: [pick('general', 'General')] })
  return groups
}

export function buildReviewEmail(content: ReviewContent, state: ReviewState, link: string) {
  const g = rows(content, state)
  const answered = g.flatMap((x) => x.items).filter((r) => r.reaction || r.note.trim()).length
  const subject = `${content.client} finished the review: ${content.title}`

  const text = [
    `${content.client} pressed Finalize on "${content.title}".`,
    `${answered} sections have a reaction or a note.`,
    '',
    ...g.flatMap((x) => [
      `== ${x.group} ==`,
      ...x.items.map((r) => `${r.label}: ${r.reaction || '(no reaction)'}${r.note.trim() ? `\n  "${r.note.trim()}"` : ''}`),
      '',
    ]),
    `Open the review: ${link}`,
  ].join('\n')

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:680px">
<p><b>${esc(content.client)}</b> pressed Finalize on <b>${esc(content.title)}</b>. ${answered} sections have a reaction or a note.</p>
${g.map((x) => `<h3 style="margin:24px 0 8px;font-size:16px">${esc(x.group)}</h3>
<table cellpadding="6" style="border-collapse:collapse;width:100%">${x.items.map((r) => `<tr style="border-top:1px solid #e5e5e5;vertical-align:top">
<td style="width:44%"><b>${esc(r.label)}</b></td><td style="width:18%">${esc(r.reaction || '—')}</td><td>${r.note.trim() ? esc(r.note.trim()).replace(/\n/g, '<br>') : '<span style="color:#888">no note</span>'}</td></tr>`).join('')}</table>`).join('')}
<p style="margin-top:24px"><a href="${esc(link)}">Open the review</a></p></div>`

  return { subject, text, html }
}

export async function sendReviewEmail(mail: { subject: string; text: string; html: string }): Promise<'sent' | 'outbox'> {
  const live = process.env.NODE_ENV === 'production' || process.env.REVIEW_EMAIL_LIVE === '1'
  if (live && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: FROM, to: TO, subject: mail.subject, text: mail.text, html: mail.html })
    if (error) throw new Error(`resend: ${error.message}`)
    return 'sent'
  }
  const dir = path.join(process.cwd(), '.review-data', 'outbox')
  await fs.mkdir(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  await fs.writeFile(path.join(dir, `${stamp}.html`), `<!-- to: ${TO} | subject: ${mail.subject} -->\n${mail.html}`)
  await fs.writeFile(path.join(dir, `${stamp}.txt`), `To: ${TO}\nSubject: ${mail.subject}\n\n${mail.text}`)
  return 'outbox'
}
