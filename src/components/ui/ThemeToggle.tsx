'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { THEME_KEY, type Theme } from '@/lib/theme'

/* ── Light / dark switch ──────────────────────────────────────────────────
 * The first theme is set before paint by THEME_SCRIPT (lib/theme.ts). The
 * switch saves the visitor's pick; until they pick, the site follows device
 * changes live.
 * ─────────────────────────────────────────────────────────────────────── */

function read(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}

/** The current theme. Server render and first hydration read "dark". */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => 'dark')
}

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t
  try {
    localStorage.setItem(THEME_KEY, t)
  } catch {}
}

/** Until the visitor picks, follow the device if it changes mid-visit. */
function useFollowDevice() {
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(THEME_KEY)
    } catch {}
    if (saved === 'light' || saved === 'dark') return
    const mq = matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      try {
        if (localStorage.getItem(THEME_KEY)) return
      } catch {}
      document.documentElement.dataset.theme = mq.matches ? 'light' : 'dark'
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
}

/** Desktop menu: one icon button. */
export function ThemeToggle() {
  const theme = useTheme()
  useFollowDevice()
  const next: Theme = theme === 'light' ? 'dark' : 'light'
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
    >
      {theme === 'light' ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}

/** Phone menu: a labelled two-way switch, so the words say what it does. */
export function ThemeSwitchRow() {
  const theme = useTheme()
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="m-0 text-xs font-medium tracking-widest text-muted-foreground uppercase">Theme</p>
      <div className="inline-flex gap-0.5 rounded-full border border-line-strong p-[3px]" role="group" aria-label="Theme">
        {(['dark', 'light'] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={theme === t}
            onClick={() => setTheme(t)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium capitalize ${
              theme === t ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'dark' ? <Moon className="h-3.5 w-3.5" aria-hidden="true" /> : <Sun className="h-3.5 w-3.5" aria-hidden="true" />}
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
