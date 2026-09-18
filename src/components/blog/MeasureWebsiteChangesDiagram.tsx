'use client'

/**
 * Featured visual for "Measure website changes, or you didn't improve them".
 *
 * Same treatment as ShopifyThemeDiagram: 1200x630, teal gradient field, grain,
 * vignette, content drawn in SVG so it stays crisp at any width.
 *
 * The idea, drawn: the same "after" twice. Left, there is no before, so the
 * after cannot be compared with anything. Right, the before was recorded, so
 * the change has a size.
 */
const WARN = '#f59e6b'
const TEAL = '#2dd4a8'
const SANS = 'system-ui, sans-serif'

export function MeasureWebsiteChangesDiagram() {
  const base = 470
  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-xl shadow-black/20"
      style={{ aspectRatio: '1200 / 630' }}
      role="img"
      aria-label="The same after result shown twice. On the left there is no before bar, only a dashed outline and a question mark, so the after cannot be compared with anything. On the right the before was recorded, so the change from before to after has a size."
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
        {/* ---- left: no before ---- */}
        <text x={150} y={148} fill="white" fillOpacity={0.45} fontSize={19} fontFamily={SANS} fontWeight={700} letterSpacing={3.4}>
          NO BEFORE
        </text>
        <text x={150} y={196} fill="white" fillOpacity={0.92} fontSize={35} fontFamily={SANS} fontWeight={700}>
          Better than what?
        </text>

        <rect x={200} y={300} width={110} height={base - 300} rx={8} stroke={WARN} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="8 8" />
        <text x={255} y={400} textAnchor="middle" fill={WARN} fontSize={44} fontFamily={SANS} fontWeight={800}>
          ?
        </text>
        <rect x={350} y={250} width={110} height={base - 250} rx={8} fill="white" fillOpacity={0.14} />
        <line x1={180} y1={base} x2={490} y2={base} stroke="white" strokeOpacity={0.2} />
        <text x={255} y={502} textAnchor="middle" fill="white" fillOpacity={0.5} fontSize={17} fontFamily={SANS}>
          before
        </text>
        <text x={405} y={502} textAnchor="middle" fill="white" fillOpacity={0.5} fontSize={17} fontFamily={SANS}>
          after
        </text>
        <text x={150} y={552} fill="white" fillOpacity={0.5} fontSize={20} fontFamily={SANS}>
          An opinion with a chart.
        </text>

        {/* ---- divider ---- */}
        <line x1={600} y1={120} x2={600} y2={560} stroke="white" strokeOpacity={0.14} strokeWidth={1} />

        {/* ---- right: before recorded ---- */}
        <text x={680} y={148} fill={TEAL} fontSize={19} fontFamily={SANS} fontWeight={700} letterSpacing={3.4}>
          BEFORE RECORDED
        </text>
        <text x={680} y={196} fill="white" fillOpacity={0.96} fontSize={35} fontFamily={SANS} fontWeight={700}>
          The change has a size
        </text>

        <rect x={730} y={300} width={110} height={base - 300} rx={8} fill="white" fillOpacity={0.14} />
        <rect x={880} y={250} width={110} height={base - 250} rx={8} fill={TEAL} fillOpacity={0.7} />
        <line x1={730} y1={300} x2={990} y2={250} stroke={TEAL} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 6" />
        <line x1={710} y1={base} x2={1020} y2={base} stroke="white" strokeOpacity={0.2} />
        <text x={785} y={502} textAnchor="middle" fill="white" fillOpacity={0.5} fontSize={17} fontFamily={SANS}>
          before
        </text>
        <text x={935} y={502} textAnchor="middle" fill="white" fillOpacity={0.5} fontSize={17} fontFamily={SANS}>
          after
        </text>
        <text x={680} y={552} fill="white" fillOpacity={0.5} fontSize={20} fontFamily={SANS}>
          A result you can defend.
        </text>
      </svg>
    </div>
  )
}
