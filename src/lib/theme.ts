/* ── Light / dark: shared by layout.tsx (server) and ThemeToggle.tsx ─────
 * <html data-theme> is set before first paint by THEME_SCRIPT: the saved
 * pick, else the device setting, else dark (the site as designed).
 * Colours: the light token block in styles/globals.css.
 * ─────────────────────────────────────────────────────────────────────── */

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'theme'

/** Runs inline in <head>, before paint. Keep it tiny and dependency-free. */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.dataset.theme=t}catch(e){d.dataset.theme='dark'}})()`
