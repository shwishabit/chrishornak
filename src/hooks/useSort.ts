'use client'

import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'
export type SortValue = string | number | null | undefined

/** One sortable column: how to read its value, and which way the first click sorts. */
export type SortColumn<T> = { get: (row: T) => SortValue; first?: SortDir }

export type Sorter<K extends string> = {
  key: K | null
  dir: SortDir
  toggle: (key: K) => void
  reset: () => void
}

const text = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/**
 * Click-to-sort for admin tables (2026-10-26). Click a header to sort by it, click again to flip.
 * key null = the order the rows came in. Blank values always sort last. The sort is stable,
 * so ties keep the incoming order.
 * @example const sort = useSort(rows, { posted: { get: (r) => r.posted, first: 'desc' } })
 */
export function useSort<T, K extends string>(
  rows: T[],
  columns: Record<K, SortColumn<T>>,
  initial: { key: NoInfer<K>; dir: SortDir } | null = null,
): { sorted: T[]; sort: Sorter<K> } {
  const [key, setKey] = useState<K | null>(initial?.key ?? null)
  const [dir, setDir] = useState<SortDir>(initial?.dir ?? 'desc')

  const sorted = useMemo(() => {
    if (key === null) return rows
    const get = columns[key].get
    const sign = dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const x = get(a)
      const y = get(b)
      const xBlank = x === null || x === undefined || x === ''
      const yBlank = y === null || y === undefined || y === ''
      if (xBlank || yBlank) return xBlank === yBlank ? 0 : xBlank ? 1 : -1
      const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : text.compare(String(x), String(y))
      return cmp * sign
    })
    // columns is a literal rebuilt each render; key + dir are what change the order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, key, dir])

  const sort: Sorter<K> = {
    key,
    dir,
    toggle: (k) => {
      if (k === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      else {
        setKey(k)
        setDir(columns[k].first ?? 'asc')
      }
    },
    reset: () => {
      setKey(initial?.key ?? null)
      setDir(initial?.dir ?? 'desc')
    },
  }
  return { sorted, sort }
}
