// src/lib — Shared utilities, helpers, and constants
// Place reusable utility functions, type definitions, and shared logic here.
//
// Suggested structure:
// - utils.ts     → General utility functions (cn, formatDate, etc.)
// - constants.ts → App-wide constants and configuration
// - types.ts     → Shared TypeScript types and interfaces
// - actions/     → Server Actions organized by domain
// - validators/  → Zod schemas for validation

/**
 * Merge class names, filtering out falsy values.
 * For production, consider installing `clsx` + `tailwind-merge` for smarter merging.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

/**
 * Format a date to a human-readable string.
 */
export function formatDate(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
