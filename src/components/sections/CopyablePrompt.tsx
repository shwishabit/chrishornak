'use client'

import { useState } from 'react'

type Props = {
  /** The text to copy and display. Preserved verbatim including newlines. */
  text: string
  /** Visual treatment. "prompt" = teal/primary tinted (AI prompt). "terminal" = neutral muted (shell command). */
  kind?: 'prompt' | 'terminal'
  /** Small label above the box, e.g. "Paste into Cline" or "Or in the terminal". Optional. */
  label?: string
}

export function CopyablePrompt({ text, kind = 'prompt', label }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API unavailable — fail silently rather than throw.
      // Users can still select the text manually.
    }
  }

  const isPrompt = kind === 'prompt'

  return (
    <div className="mt-4">
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
          {label}
        </p>
      )}
      <div
        className={[
          'group relative overflow-hidden rounded-lg border',
          isPrompt
            ? 'border-primary/30 bg-primary/5'
            : 'border-border/30 bg-muted/20',
        ].join(' ')}
      >
        <pre
          className={[
            'whitespace-pre-wrap break-words px-4 py-3.5 pr-14 font-mono text-sm leading-relaxed md:text-[0.95rem]',
            isPrompt ? 'text-primary' : 'text-foreground',
          ].join(' ')}
          style={{ overflowWrap: 'anywhere' }}
        >
          {text}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
          className={[
            'absolute right-2 top-2 inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all',
            copied
              ? 'border-primary/60 bg-primary/20 text-primary'
              : 'border-border/40 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
          ].join(' ')}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M2.5 6.5L4.5 8.5L9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Copied</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <rect
                  x="3.5"
                  y="3.5"
                  width="6"
                  height="6"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
                <path
                  d="M2 8.5V2.5C2 1.94772 2.44772 1.5 3 1.5H8"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
