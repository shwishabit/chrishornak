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

  // The black wordmark stays hidden (and unloaded, lazy) unless a page turns
  // on its light theme (the Authority Check: styles/authority-check.css).
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
        className={`logo-on-light hidden ${className}`}
      />
    </>
  )
}
