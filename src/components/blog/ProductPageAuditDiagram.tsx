'use client'

/**
 * Featured visual for "Product page audit: is your page arguing with itself?".
 *
 * Same treatment as ShopifyThemeDiagram: 1200x630, teal gradient field, grain,
 * vignette, content drawn in SVG so it stays crisp at any width.
 *
 * The idea, drawn: one product page whose banner and hero make opposite
 * claims about the same subject, with the two lines pulled out side by side.
 */
const WARN = '#f59e6b'
const TEAL = '#2dd4a8'
const SANS = 'system-ui, sans-serif'

export function ProductPageAuditDiagram() {
  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-xl shadow-black/20"
      style={{ aspectRatio: '1200 / 630' }}
      role="img"
      aria-label="A product page whose banner says We're sold out while the hero just below it says Ships same day. The two lines are pulled out side by side and marked as one subject with two versions."
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
        {/* ---- left: the page ---- */}
        <rect x={150} y={90} width={340} height={450} rx={18} fill="white" fillOpacity={0.06} stroke="white" strokeOpacity={0.14} />

        {/* banner */}
        <rect x={150} y={90} width={340} height={52} rx={18} fill={WARN} fillOpacity={0.2} />
        <rect x={150} y={124} width={340} height={18} fill={WARN} fillOpacity={0.2} />
        <text x={320} y={123} textAnchor="middle" fill={WARN} fontSize={19} fontFamily={SANS} fontWeight={700} letterSpacing={1.5}>
          WE&apos;RE SOLD OUT
        </text>

        {/* hero image block */}
        <rect x={178} y={166} width={284} height={150} rx={10} fill="white" fillOpacity={0.07} />

        {/* hero claim */}
        <rect x={178} y={336} width={284} height={46} rx={8} fill={WARN} fillOpacity={0.12} stroke={WARN} strokeOpacity={0.6} />
        <text x={198} y={366} fill="white" fillOpacity={0.92} fontSize={21} fontFamily={SANS} fontWeight={700}>
          Ships same day
        </text>

        {/* body lines */}
        <rect x={178} y={402} width={230} height={10} rx={5} fill="white" fillOpacity={0.12} />
        <rect x={178} y={422} width={190} height={10} rx={5} fill="white" fillOpacity={0.12} />

        {/* buy button */}
        <rect x={178} y={458} width={284} height={52} rx={26} fill={TEAL} fillOpacity={0.85} />
        <text x={320} y={491} textAnchor="middle" fill="#0c2822" fontSize={20} fontFamily={SANS} fontWeight={700}>
          Buy now
        </text>

        {/* connectors */}
        <path d="M490 116 C 560 116, 590 230, 668 262" stroke={WARN} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="6 6" />
        <path d="M462 359 C 560 359, 590 340, 668 344" stroke={WARN} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="6 6" />

        {/* ---- right: the finding ---- */}
        <text x={680} y={148} fill={TEAL} fontSize={19} fontFamily={SANS} fontWeight={700} letterSpacing={3.4}>
          ONE SUBJECT
        </text>
        <text x={680} y={196} fill="white" fillOpacity={0.96} fontSize={35} fontFamily={SANS} fontWeight={700}>
          Two versions
        </text>

        <rect x={680} y={232} width={390} height={64} rx={10} fill={WARN} fillOpacity={0.1} stroke={WARN} strokeOpacity={0.45} />
        <text x={704} y={270} fill="white" fillOpacity={0.55} fontSize={17} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          banner
        </text>
        <text x={1046} y={270} textAnchor="end" fill="white" fillOpacity={0.92} fontSize={21} fontFamily={SANS} fontWeight={600}>
          Sold out
        </text>

        <rect x={680} y={312} width={390} height={64} rx={10} fill={WARN} fillOpacity={0.1} stroke={WARN} strokeOpacity={0.45} />
        <text x={704} y={350} fill="white" fillOpacity={0.55} fontSize={17} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          hero
        </text>
        <text x={1046} y={350} textAnchor="end" fill="white" fillOpacity={0.92} fontSize={21} fontFamily={SANS} fontWeight={600}>
          Ships same day
        </text>

        <text x={680} y={432} fill="white" fillOpacity={0.7} fontSize={21} fontFamily={SANS}>
          Both were true once.
        </text>
        <text x={680} y={466} fill="white" fillOpacity={0.7} fontSize={21} fontFamily={SANS}>
          Only one is true today.
        </text>

        <text x={680} y={552} fill="white" fillOpacity={0.5} fontSize={20} fontFamily={SANS}>
          The reader can&apos;t tell which.
        </text>
      </svg>
    </div>
  )
}
