const platforms = [
  {
    name: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    name: 'Bing',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M5 3v16.5l4.06 2.3 8.44-3.96v-3.94L11.27 11V5.27L5 3zm4.06 11.38l4.83 2.27-4.83 2.27v-4.54z" />
      </svg>
    ),
  },
  {
    name: 'ChatGPT',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M22.28 9.37a6.2 6.2 0 0 0-.54-5.1 6.28 6.28 0 0 0-6.78-3.03A6.23 6.23 0 0 0 10.28 0a6.28 6.28 0 0 0-6 4.38 6.2 6.2 0 0 0-4.15 3.04 6.28 6.28 0 0 0 .78 7.36 6.2 6.2 0 0 0 .54 5.1 6.28 6.28 0 0 0 6.78 3.03A6.23 6.23 0 0 0 13.72 24a6.28 6.28 0 0 0 6-4.38 6.2 6.2 0 0 0 4.15-3.04 6.28 6.28 0 0 0-.78-7.36zM13.72 22.44a4.68 4.68 0 0 1-3-.1l.04-.02 5-2.88a.81.81 0 0 0 .41-.71v-7.04l2.11 1.22a.07.07 0 0 1 .04.06v5.83a4.7 4.7 0 0 1-4.6 3.64zM3.53 18.3a4.67 4.67 0 0 1-.56-3.15l.04.02 5 2.89a.81.81 0 0 0 .82 0l6.1-3.53v2.44a.08.08 0 0 1-.03.06l-5.06 2.92a4.7 4.7 0 0 1-6.31-1.65zM2.27 7.87a4.67 4.67 0 0 1 2.44-2.05v5.94a.81.81 0 0 0 .41.71l6.1 3.52-2.12 1.22a.07.07 0 0 1-.07 0L3.97 14.3A4.7 4.7 0 0 1 2.27 7.87zm17.19 4 L13.36 8.35l2.11-1.22a.07.07 0 0 1 .07 0l5.06 2.92a4.7 4.7 0 0 1-.73 8.49v-5.96a.81.81 0 0 0-.41-.71zm2.1-3.17-.04-.02-5-2.89a.81.81 0 0 0-.82 0l-6.1 3.53V6.88a.08.08 0 0 1 .03-.06l5.06-2.92a4.7 4.7 0 0 1 6.87 4.8zM9.57 13.27 7.46 12.05a.07.07 0 0 1-.04-.06V6.16a4.7 4.7 0 0 1 7.6-3.64l-.04.02-5 2.88a.81.81 0 0 0-.41.71v7.04zm1.15-2.47L12 10l1.29.75v1.5L12 13l-1.29-.75v-1.45z" />
      </svg>
    ),
  },
  {
    name: 'Perplexity',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
      </svg>
    ),
  },
  {
    name: 'Gemini',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" />
      </svg>
    ),
  },
  {
    name: 'Copilot',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M1 1h10v10H1zM13 1h10v10H13zM1 13h10v10H1zM13 13h10v10H13z" />
      </svg>
    ),
  },
]

export function PlatformBar() {
  return (
    <div className="mt-10">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
        Where your next customer is already looking
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-1.5 text-muted-foreground/40 transition-colors duration-200 hover:text-primary"
          >
            {p.icon}
            <span className="text-xs font-medium">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
