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

  return (
    <img
      src="/images/wordmark-dark.svg"
      alt="Chris Hornak"
      width={200}
      height={40}
      fetchPriority="high"
      className={className}
    />
  )
}
