'use client'

import type { Sorter } from '@/hooks/useSort'

/** A table header you can click to sort by. Pairs with useSort. */
export function SortTh<K extends string>({
  label,
  k,
  sort,
  className = '',
}: {
  label: string
  k: NoInfer<K>
  sort: Sorter<K>
  className?: string
}) {
  const on = sort.key === k
  return (
    <th scope="col" aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={className}>
      <button
        type="button"
        onClick={() => sort.toggle(k)}
        className={`group inline-flex items-center gap-1 [letter-spacing:inherit] [text-transform:inherit] transition-colors hover:text-foreground ${on ? 'text-foreground' : ''}`}
      >
        {label}
        <span aria-hidden className={on ? '' : 'opacity-0 transition-opacity group-hover:opacity-50 group-focus-visible:opacity-50'}>
          {on ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  )
}
