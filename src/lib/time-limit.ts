import vm from 'node:vm'

/* ── A time limit for reading a page (code audit 2026-11-19) ───────────────
 * The page checks read HTML with regexes. On a page built to be slow (tens of
 * thousands of unclosed <img, <script or <title> tags) some of them take
 * seconds per 200 KB, and a 2 MB page could run past the route's 25 s.
 * A plain timer can't stop a running regex; node:vm's timeout can (it
 * interrupts whatever JavaScript is running, regex included). Tested: a
 * stuck regex stops at the limit; a normal call costs ~0.15 ms.
 * Server only (node:vm). Pages that hit the limit count as not readable.
 * ─────────────────────────────────────────────────────────────────────── */

export class TimeLimitError extends Error {
  constructor(ms: number) {
    super(`Reading the page took longer than ${ms} ms`)
    this.name = 'TimeLimitError'
  }
}

const context = vm.createContext({ run: (): unknown => undefined })
const script = new vm.Script('run()')

/** Runs fn and returns its value, or throws TimeLimitError when it runs past ms. */
export function withinTime<T>(ms: number, fn: () => T): T {
  const limit = Math.max(1, Math.floor(ms))
  context.run = fn
  try {
    return script.runInContext(context, { timeout: limit }) as T
  } catch (e) {
    // The timeout error can come from the vm's side, so match its message, not its class.
    if (!(e instanceof TimeLimitError) && /Script execution timed out/.test(String((e as { message?: unknown })?.message))) throw new TimeLimitError(limit)
    throw e
  } finally {
    context.run = () => undefined
  }
}

/** A shared allowance for one site: every timed step takes from the same few seconds. */
export function timeBudget(ms: number) {
  const until = Date.now() + ms
  return <T>(fn: () => T): T => {
    const left = until - Date.now()
    if (left <= 0) throw new TimeLimitError(ms)
    return withinTime(left, fn)
  }
}
