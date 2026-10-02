'use client'

interface LogoProps {
  variant?: 'wordmark' | 'icon'
  className?: string
}

export function Logo({ variant = 'wordmark', className = '' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <img
        src="/images/icon-dark.png"
        alt="Chris Hornak"
        width={40}
        height={40}
        className={className}
      />
    )
  }

  // Both wordmarks ship; globals.css shows the one for the theme
  // (.logo-on-dark / .logo-on-light). The black one stays lazy, so a dark
  // visit never downloads it; it is in view on a light visit, so it loads at once.
  return (
    <>
      <img
        src="/images/wordmark-dark.svg"
        alt="Chris Hornak"
        width={200}
        height={40}
        fetchPriority="high"
        className={`logo-on-dark ${className}`}
      />
      <img
        src="/images/wordmark-light.svg"
        alt="Chris Hornak"
        width={200}
        height={40}
        loading="lazy"
        className={`logo-on-light ${className}`}
      />
    </>
  )
}
