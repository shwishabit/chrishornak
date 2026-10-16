/* Dashboard goals (2026-10-16). Plain module: used by the server view and the client
 * Feed / Week tab. The goals come from GOALS.md in the workspace, pushed hourly by
 * .agent/scripts/dash-refresh.mjs into dash_state 'goals'. Per-item picks live in
 * dash_item_goals (migration 0020). Anything that matches no goal is Upkeep. */
import { nyDate } from './dash-feed'

export interface Goal {
  /** Stable id from the file's `Key:` line. Tags point at it, so a rename keeps them. */
  key: string
  name: string
  why: string
  auto: { brands: string[]; groups: string[] }
}

export const UPKEEP: Goal = { key: 'upkeep', name: 'Upkeep', why: 'Games, f0rmless, client upkeep: work that serves no goal on purpose.', auto: { brands: [], groups: [] } }

/** Goals + the fixed Upkeep bucket, last. */
export const withUpkeep = (goals: Goal[]) => [...goals.filter((g) => g.key !== UPKEEP.key), UPKEEP]

/** Which goal an item serves: Chris's own pick, else a brand rule, else a group rule, else Upkeep. */
export function goalFor(item: { id: string; brand?: string; group?: string }, goals: Goal[], picks: Record<string, string>): string {
  const pick = picks[item.id]
  if (pick && (pick === UPKEEP.key || goals.some((g) => g.key === pick))) return pick
  // Email: the inbox's brand says whose inbox, not what the mail is for (a bill in the SGM inbox
  // is not SGM sales), so mail only gets a goal from Chris's pick or a group rule.
  const b = item.group === 'email' ? '' : (item.brand ?? '').toLowerCase()
  const byBrand = b && goals.find((g) => g.auto.brands.some((x) => x.toLowerCase() === b))
  if (byBrand) return byBrand.key
  const byGroup = item.group && goals.find((g) => g.auto.groups.includes(item.group!))
  return byGroup ? byGroup.key : UPKEEP.key
}

/** Monday of this New York week (YYYY-MM-DD). Noon avoids DST edges. */
export function nyWeekStart(today: string = nyDate()): string {
  const d = new Date(today + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

/** More open red items than this and the Feed warns (the old "P0: max 3" rule). */
export const URGENT_CAP = 3
