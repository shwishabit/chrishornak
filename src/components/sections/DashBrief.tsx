'use client'

import { useEffect, useState } from 'react'
import { onFeedCounts, type FeedCounts } from '@/lib/dash-wins'

/* The one-line brief under the date (v5, 2026-10-15). Starts from the server's counts,
 * then follows the Feed live as items are done, snoozed or skipped. */

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`

export function DashBrief({ initial, findability7d }: { initial: FeedCounts; findability7d: number | null }) {
  const [c, setC] = useState(initial)
  useEffect(() => onFeedCounts(setC), [])
  const b = (s: string) => <b className="font-medium text-foreground">{s}</b>
  return (
    <>
      {c.urgent > 0 ? <>{b(plural(c.urgent, 'thing'))} {c.urgent === 1 ? 'is' : 'are'} urgent. </> : 'Nothing urgent today. '}
      {c.email > 0 && <>{b(plural(c.email, 'email'))} to answer. </>}
      {c.sales > 0 && <>{b(plural(c.sales, 'sales lead'))} {c.sales === 1 ? 'needs' : 'need'} you. </>}
      {findability7d !== null && findability7d > 0 && <>{b(`${findability7d} sites`)} ran the Findability tool this week.</>}
    </>
  )
}
