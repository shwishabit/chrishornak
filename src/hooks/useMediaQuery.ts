// src/hooks — Custom React Hooks (Client Components only)
// Place reusable hooks here. All files in this directory must use 'use client'.
//
// Suggested hooks:
// - useMediaQuery.ts   → Responsive breakpoint detection
// - useScrollPosition.ts → Scroll-based animations
// - useLocalStorage.ts → Persistent client state
// - useDebounce.ts     → Debounced values for search inputs

'use client'

import { useState, useEffect } from 'react'

/**
 * Detect if a CSS media query matches.
 * @example const isMobile = useMediaQuery('(max-width: 768px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}
