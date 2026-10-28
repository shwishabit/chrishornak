'use client'

import { useState } from 'react'
import { followupKeys, type ReviewContent, type ReviewFollowup, type ReviewQuestion, type ReviewTakeaway } from '@/content/reviews/types'
import type { ReviewState } from '@/lib/review-store'
import { useReviewSave, type Comments, type SaveState, type Update } from './useReviewSave'

/* A follow-up page after a design review: confirm each takeaway, read the
 * answers to the client's questions, answer ours, then send. One scrolling page. */
export function FollowupShell({ token, content, initial }: { token: string; content: ReviewContent & { followup: ReviewFollowup }; initial: ReviewState }) {
  const { comments, locked, saveState, update, finalize, sending, sendError } = useReviewSave(token, initial)
  const [confirming, setConfirming] = useState(false)
  const f = content.followup
  const keys = followupKeys(f)
  const total = keys.length
  const done = keys.filter((k) => comments[k]?.reaction || comments[k]?.note.trim()).length
  const anySaving = Object.values(saveState).includes('saving')
  const anyError = Object.values(saveState).includes('error')

  const send = async () => {
    if (await finalize()) setConfirming(false)
  }

  return (
    <div className="rv-shell rq-shell">
      <header className="rv-header">
        <div className="rv-header-in">
          <div className="rv-header-l">
            <span className="rv-brand">
              <img src="/images/wordmark-light.svg" alt="Chris Hornak" width={137} height={30} /> <span>Follow-up</span>
            </span>
            <h1 className="rv-title">{content.title}</h1>
            <p className="rv-for">For {content.client}</p>
          </div>
          <div className="rv-header-r">
            <span className="rv-status" aria-live="polite">
              {locked ? 'Sent to Chris' : anyError ? 'Not saved, retrying when you type' : anySaving ? 'Saving…' : `${done} of ${total} answered · saved`}
            </span>
          </div>
        </div>
        <p className="rv-intro">{content.intro}</p>
      </header>

      <main id="main-content" className="rv-main rq-main">
        {locked && <p className="rv-locked">Thank you. Your answers were sent to Chris. They are below, read-only.</p>}

        <section className="rq-group" aria-labelledby="rq-heard">
          <div className="rq-group-h">
            <h2 id="rq-heard">What we took from your notes</h2>
            <p>Tap “That’s right”, or “Not quite” and tell us what to change.</p>
          </div>
          {f.takeaways.map((t) => (
            <Takeaway key={t.key} t={t} comments={comments} save={saveState[t.key]} locked={locked} update={update} />
          ))}
        </section>

        {f.answers && f.answers.length > 0 && (
          <section className="rq-group" aria-labelledby="rq-answers">
            <div className="rq-group-h">
              <h2 id="rq-answers">Your questions, answered</h2>
            </div>
            <dl className="rq-answers">
              {f.answers.map((a) => (
                <div key={a.q}>
                  <dt>{a.q}</dt>
                  <dd>{a.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {f.groups.map((g, i) => (
          <section key={g.title} className="rq-group" aria-labelledby={`rq-g${i}`}>
            <div className="rq-group-h">
              <h2 id={`rq-g${i}`}>{g.title}</h2>
              {g.intro && <p>{g.intro}</p>}
            </div>
            {g.questions.map((q) => (
              <Question key={q.key} q={q} comments={comments} save={saveState[q.key]} locked={locked} update={update} />
            ))}
          </section>
        ))}

        <section className="rq-group" aria-labelledby="rq-send">
          <label className="rv-general">
            <b id="rq-send">Anything else?</b>
            <span>Questions for Chris, or anything we missed.</span>
            <textarea value={comments.general?.note ?? ''} disabled={locked} rows={4} onChange={(e) => update('general', { note: e.target.value })} />
            <SaveNote state={saveState.general} />
          </label>
          {!locked && (
            <div className="rv-send">
              <span className="rq-count">
                {done} of {total} answered. You can send with some left blank.
              </span>
              <button type="button" className="rv-btn rv-btn-main rv-btn-big" onClick={() => setConfirming(true)}>
                Send to Chris
              </button>
            </div>
          )}
        </section>
        {content.fineprint && <p className="rv-fine">{content.fineprint}</p>}
      </main>

      {confirming && (
        <div className="rv-modal" role="dialog" aria-modal="true" aria-labelledby="rv-modal-h">
          <div className="rv-modal-card">
            <h2 id="rv-modal-h">Send your answers to Chris?</h2>
            <p>
              You answered {done} of {total}. After you send, your answers are locked. Chris can open it again if you want to add more.
            </p>
            {sendError && <p className="rv-err">{sendError}</p>}
            <div className="rv-modal-btns">
              <button type="button" className="rv-btn" onClick={() => setConfirming(false)} disabled={sending}>
                Keep going
              </button>
              <button type="button" className="rv-btn rv-btn-main" onClick={send} disabled={sending}>
                {sending ? 'Sending…' : 'Send to Chris'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type ItemProps = { comments: Comments; save: SaveState | undefined; locked: boolean; update: Update }

function Takeaway({ t, comments, save, locked, update }: ItemProps & { t: ReviewTakeaway }) {
  const c = comments[t.key]
  const reaction = c?.reaction ?? ''
  const toggle = (r: 'like' | 'change') => update(t.key, { reaction: reaction === r ? '' : r })
  return (
    <article className="rq-card" aria-labelledby={`rq-${t.key}`}>
      <h3 id={`rq-${t.key}`}>{t.title}</h3>
      <div className="rq-heard">
        <div>
          <span className="rq-k">What we heard</span>
          <p>{t.heard}</p>
        </div>
        <div>
          <span className="rq-k">What we’ll do</span>
          <p>{t.plan}</p>
        </div>
      </div>
      <div className="rq-reacts" role="group" aria-label="Is this right?">
        <button type="button" className="rv-react rv-react-like" aria-pressed={reaction === 'like'} disabled={locked} onClick={() => toggle('like')}>
          That’s right
        </button>
        <button type="button" className="rv-react rv-react-change" aria-pressed={reaction === 'change'} disabled={locked} onClick={() => toggle('change')}>
          Not quite
        </button>
      </div>
      {(reaction === 'change' || c?.note) && (
        <textarea
          aria-label={`What to change: ${t.title}`}
          placeholder="What should change?"
          value={c?.note ?? ''}
          disabled={locked}
          rows={2}
          onChange={(e) => update(t.key, { note: e.target.value })}
        />
      )}
      <SaveNote state={save} />
    </article>
  )
}

function Question({ q, comments, save, locked, update }: ItemProps & { q: ReviewQuestion }) {
  const note = comments[q.key]?.note ?? ''
  return (
    <article className="rq-card">
      <label className="rq-q" htmlFor={`rq-${q.key}`}>
        {q.q}
      </label>
      {q.why && <p className="rq-why">{q.why}</p>}
      {q.choices && (
        <div className="rq-choices" role="group" aria-label="Quick answers">
          {q.choices.map((ch) => (
            <button key={ch} type="button" className="rq-choice" aria-pressed={note === ch} disabled={locked} onClick={() => update(q.key, { note: note === ch ? '' : ch })}>
              {ch}
            </button>
          ))}
        </div>
      )}
      <textarea
        id={`rq-${q.key}`}
        placeholder={q.choices ? 'Or type your answer' : 'Your answer'}
        value={note}
        disabled={locked}
        rows={2}
        onChange={(e) => update(q.key, { note: e.target.value })}
      />
      <SaveNote state={save} />
    </article>
  )
}

function SaveNote({ state }: { state: SaveState | undefined }) {
  const text = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Not saved. Keep typing to retry.' : ''
  return (
    <span className={`rv-save ${state === 'error' ? 'is-err' : ''}`} aria-live="polite">
      {text}
    </span>
  )
}
