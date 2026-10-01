'use client'

interface LogoProps {
  variant?: 'wordmark' | 'icon'
  className?: string
  /** Also ship the black wordmark, for a page that can turn light (the Authority Check). */
  withLight?: boolean
}

export function Logo({ variant = 'wordmark', className = '', withLight = false }: LogoProps) {
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

  // The black wordmark ships only where asked (withLight), stays hidden (and
  // unloaded, lazy) until that page turns on its light theme
  // (the Authority Check: styles/authority-check.css). Elsewhere it would be
  // two extra images on every page for nothing.
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
      {withLight && (
        <img
          src="/images/wordmark-light.svg"
          alt="Chris Hornak"
          width={200}
          height={40}
          loading="lazy"
          className={`logo-on-light hidden ${className}`}
        />
      )}
    </>
  )
}
