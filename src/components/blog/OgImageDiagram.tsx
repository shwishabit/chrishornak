'use client'

/**
 * Featured visual for "What to put in an OG image so the right people click".
 *
 * Same field as the other heroes: 1200x630, teal gradient, grain, vignette,
 * content drawn in SVG. Same picture as the post's share card
 * (brand/og-article-og-image/B-proposed/og.html), so the card and the page match.
 *
 * The idea, drawn: a link preview inside a chat bubble, its image in teal, grey
 * bars for the title and description, and a cursor resting on it before the
 * click. No words: the ARTICLE card rule.
 */
const TEAL = '#2dd4a8'
const DEEP = '#0c2822'

export function OgImageDiagram() {
  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-xl shadow-black/20"
      style={{ aspectRatio: '1200 / 630' }}
      role="img"
      aria-label="A chat message holding a link preview: a large teal image of a sun and hills, grey bars standing in for the title and description, and a mouse cursor resting on it before the click."
    >
      <div className="absolute inset-0 bg-linear-to-br from-[#143d35] via-[#10322b] to-[#0c2822]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.4)]" />

      <svg
        viewBox="0 0 1200 630"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="og-image-slot">
            <rect x={342} y={86} width={516} height={270} rx={16} />
          </clipPath>
        </defs>

        {/* chat bubble: tail first, opaque bubble drawn over it */}
        <path
          d="M346 468 C 344 500, 330 518, 300 530 C 346 534, 378 518, 394 496 Z"
          fill="#1f403a"
          stroke="white"
          strokeOpacity={0.2}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <rect x={320} y={64} width={560} height={444} rx={30} fill="#1f403a" stroke="white" strokeOpacity={0.2} strokeWidth={2} />

        {/* the preview image: the one accent */}
        <rect x={342} y={86} width={516} height={270} rx={16} fill={TEAL} fillOpacity={0.85} />
        <g clipPath="url(#og-image-slot)" fill={DEEP}>
          <circle cx={444} cy={162} r={30} fillOpacity={0.5} />
          <path d="M342 356 L500 220 L588 300 L690 196 L858 356 Z" fillOpacity={0.5} />
        </g>

        {/* title, two description lines, domain */}
        <rect x={342} y={382} width={400} height={24} rx={12} fill="white" fillOpacity={0.82} />
        <rect x={342} y={424} width={480} height={15} rx={7.5} fill="white" fillOpacity={0.3} />
        <rect x={342} y={451} width={330} height={15} rx={7.5} fill="white" fillOpacity={0.3} />
        <rect x={342} y={482} width={140} height={10} rx={5} fill="white" fillOpacity={0.16} />

        {/* cursor on the preview: the moment before the click */}
        <g transform="translate(772 252) scale(1.7)">
          <path
            d="M0 0 L0 46 L11 35 L19 53 L27 49.5 L19 32 L34 32 Z"
            fill="white"
            stroke={DEEP}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  )
}
