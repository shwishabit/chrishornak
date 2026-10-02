/**
 * Featured visual for "Your content workflow needs a publishing checklist".
 *
 * Same field as the other heroes: 1200x630, teal gradient, grain, vignette,
 * content drawn in SVG. Same picture as the post's share card
 * (brand/og-article-publishing-checklist/og.html), so the card and the page match.
 *
 * The idea, drawn: a checklist with 4 rows ticked in teal and the 5th still
 * empty, with the cursor on it: the last check before Publish. No words: the
 * ARTICLE card rule.
 */
const TEAL = '#2dd4a8'
const DEEP = '#0c2822'

const ROWS = [
  { y: 170, bar: 330, done: true },
  { y: 246, bar: 270, done: true },
  { y: 322, bar: 360, done: true },
  { y: 398, bar: 240, done: true },
  { y: 474, bar: 300, done: false },
]

export function PublishingChecklistDiagram() {
  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-xl shadow-black/20"
      style={{ aspectRatio: '1200 / 630' }}
      role="img"
      aria-label="A checklist with five rows. The first four boxes are ticked in teal, and a mouse cursor rests on the fifth, still empty: the last check before a post is published."
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
        {/* the checklist panel and its header bar */}
        <rect x={330} y={60} width={540} height={510} rx={30} fill="#1f403a" stroke="white" strokeOpacity={0.2} strokeWidth={2} />
        <rect x={380} y={104} width={240} height={24} rx={12} fill="white" fillOpacity={0.82} />

        {ROWS.map(({ y, bar, done }) => (
          <g key={y}>
            {done ? (
              <>
                <rect x={380} y={y} width={44} height={44} rx={11} fill={TEAL} fillOpacity={0.85} />
                <path
                  d={`M391 ${y + 22} L399 ${y + 30} L413 ${y + 14}`}
                  stroke={DEEP}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              <rect x={381} y={y + 1} width={42} height={42} rx={10} stroke="white" strokeOpacity={0.55} strokeWidth={2.5} />
            )}
            <rect x={452} y={y + 14} width={bar} height={16} rx={8} fill="white" fillOpacity={0.3} />
          </g>
        ))}

        {/* cursor on the last box: the moment before Publish */}
        <g transform="translate(404 494) scale(1.5)">
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
