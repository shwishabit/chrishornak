'use client'

export function SearchVisibilityDiagram() {
  const bx = 260
  const by = 70
  const bw = 680
  const bh = 480
  const chromeH = 44
  const r = 12
  const cx = bx + 60 // content left margin
  const cw = bw - 120 // content width

  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-xl shadow-black/20"
      style={{ aspectRatio: '1200 / 630' }}
    >
      {/* Background — deep teal-green (matches Guide 01 range) */}
      <div className="absolute inset-0 bg-linear-to-br from-[#143d35] via-[#10322b] to-[#0c2822]" />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.4)]" />

      <svg
        viewBox="0 0 1200 630"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Browser window frame */}
        <rect
          x={bx} y={by} width={bw} height={bh} rx={r} ry={r}
          stroke="white" strokeOpacity={0.5} strokeWidth={2}
          fill="white" fillOpacity={0.09}
        />

        {/* Chrome bar */}
        <line x1={bx} y1={by + chromeH} x2={bx + bw} y2={by + chromeH} stroke="white" strokeOpacity={0.35} strokeWidth={1.5} />
        <circle cx={bx + 24} cy={by + chromeH / 2} r={5} fill="white" fillOpacity={0.5} />
        <circle cx={bx + 44} cy={by + chromeH / 2} r={5} fill="white" fillOpacity={0.4} />
        <circle cx={bx + 64} cy={by + chromeH / 2} r={5} fill="white" fillOpacity={0.4} />
        <rect x={bx + 90} y={by + 12} width={bw - 130} height={20} rx={10} fill="white" fillOpacity={0.2} />
        <rect x={bx + 108} y={by + 19} width={120} height={6} rx={3} fill="white" fillOpacity={0.4} />

        {/* === WIREFRAME WEBSITE === */}

        {/* Nav bar */}
        <rect x={cx} y={by + chromeH + 18} width={cw} height={20} rx={4} fill="white" fillOpacity={0.25} />
        {/* Nav logo placeholder */}
        <rect x={cx + 10} y={by + chromeH + 23} width={50} height={10} rx={3} fill="white" fillOpacity={0.7} />
        {/* Nav links */}
        <rect x={cx + cw - 180} y={by + chromeH + 25} width={30} height={6} rx={3} fill="white" fillOpacity={0.6} />
        <rect x={cx + cw - 138} y={by + chromeH + 25} width={30} height={6} rx={3} fill="white" fillOpacity={0.6} />
        <rect x={cx + cw - 96} y={by + chromeH + 25} width={30} height={6} rx={3} fill="white" fillOpacity={0.6} />
        <rect x={cx + cw - 54} y={by + chromeH + 25} width={44} height={6} rx={3} fill="white" fillOpacity={0.6} />

        {/* Hero section */}
        <rect x={cx} y={by + chromeH + 52} width={cw} height={120} rx={6} fill="white" fillOpacity={0.12} />
        {/* Hero headline */}
        <rect x={cx + 30} y={by + chromeH + 72} width={260} height={12} rx={4} fill="white" fillOpacity={0.75} />
        <rect x={cx + 30} y={by + chromeH + 92} width={200} height={8} rx={3} fill="white" fillOpacity={0.55} />
        <rect x={cx + 30} y={by + chromeH + 106} width={170} height={8} rx={3} fill="white" fillOpacity={0.55} />
        {/* Hero CTA button */}
        <rect x={cx + 30} y={by + chromeH + 128} width={80} height={22} rx={6} fill="#2dd4a8" fillOpacity={0.7} />
        <rect x={cx + 44} y={by + chromeH + 135} width={52} height={8} rx={3} fill="white" fillOpacity={0.75} />
        {/* Hero image placeholder */}
        <rect x={cx + cw - 220} y={by + chromeH + 68} width={190} height={88} rx={6} fill="white" fillOpacity={0.18} />
        {/* X for image */}
        <line x1={cx + cw - 220} y1={by + chromeH + 68} x2={cx + cw - 30} y2={by + chromeH + 156} stroke="white" strokeOpacity={0.2} />
        <line x1={cx + cw - 30} y1={by + chromeH + 68} x2={cx + cw - 220} y2={by + chromeH + 156} stroke="white" strokeOpacity={0.2} />

        {/* Three column cards */}
        {[0, 1, 2].map((i) => {
          const cardW = (cw - 24) / 3
          const cardX = cx + i * (cardW + 12)
          const cardY = by + chromeH + 186
          return (
            <g key={i}>
              <rect x={cardX} y={cardY} width={cardW} height={90} rx={5} fill="white" fillOpacity={0.12} />
              {/* Card icon circle */}
              <circle cx={cardX + 20} cy={cardY + 20} r={8} fill="white" fillOpacity={0.55} />
              {/* Card title */}
              <rect x={cardX + 12} y={cardY + 38} width={cardW - 24} height={7} rx={3} fill="white" fillOpacity={0.65} />
              {/* Card text */}
              <rect x={cardX + 12} y={cardY + 52} width={cardW - 30} height={5} rx={2} fill="white" fillOpacity={0.45} />
              <rect x={cardX + 12} y={cardY + 62} width={cardW - 40} height={5} rx={2} fill="white" fillOpacity={0.45} />
            </g>
          )
        })}

        {/* Footer bar */}
        <rect x={cx} y={by + chromeH + 292} width={cw} height={24} rx={4} fill="white" fillOpacity={0.12} />
        <rect x={cx + 12} y={by + chromeH + 300} width={80} height={5} rx={2} fill="white" fillOpacity={0.5} />

        {/* === THE SIGNAL DOT — same triple-ring as Guide 01, overlaying the wireframe center === */}
        <circle cx={600} cy={315} r={48} fill="#2dd4a8" fillOpacity={0.04} />
        <circle cx={600} cy={315} r={28} fill="#2dd4a8" fillOpacity={0.1} />
        <circle cx={600} cy={315} r={12} fill="#2dd4a8" />
      </svg>
    </div>
  )
}
