/* ── Audit History (localStorage) ─────────────────────────────────────────
 *
 * Stores past audit results per domain so the UI can show score deltas
 * on re-audit. Capped at 50 domains (FIFO eviction).
 * ─────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'findability-history'
const MAX_ENTRIES = 50

export interface AuditHistoryEntry {
  domain: string
  date: string // ISO 8601
  overall: number
  categories: Record<string, number>
}

function normalizeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')
  }
}

function getHistory(): AuditHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setHistory(entries: AuditHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/** Get the most recent previous result for a domain (before the current session). */
export function getPreviousResult(url: string): AuditHistoryEntry | null {
  const domain = normalizeDomain(url)
  const history = getHistory()
  return history.find((e) => e.domain === domain) ?? null
}

/** Save an audit result. Overwrites existing entry for the same domain. */
export function saveAuditResult(
  url: string,
  overall: number,
  categories: Record<string, number>,
): void {
  const domain = normalizeDomain(url)
  const history = getHistory().filter((e) => e.domain !== domain)

  history.unshift({
    domain,
    date: new Date().toISOString(),
    overall,
    categories,
  })

  // Cap at MAX_ENTRIES — evict oldest
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES
  }

  setHistory(history)
}
