'use client'

export function ContentStructureDiagram() {
  // Document cards — overlapping, all similar, competing
  const docs = [
    { x: 310, y: 100, rotate: -8, o: 0.55 },
    { x: 400, y: 80, rotate: -3, o: 0.6 },
    { x: 490, y: 70, rotate: 2, o: 0.7 },
    { x: 580, y: 75, rotate: 6, o: 0.65 },
    { x: 670, y: 90, rotate: 10, o: 0.55 },
  ]

  const docW = 216
  const docH = 288
  const titleW = 144
  const lineW1 = 168
  const lineW2 = 132
  const lineW3 = 156

  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-xl shadow-black/20"
      style={{ aspectRatio: '1200 / 630' }}
    >
      {/* Background */}
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
        {/* Document cards — all similar, piled up */}
        {docs.map((doc, i) => (
          <g
            key={i}
            transform={`translate(${doc.x}, ${doc.y}) rotate(${doc.rotate}, ${docW / 2}, ${docH / 2})`}
            opacity={doc.o}
          >
            {/* Page */}
            <rect
              width={docW}
              height={docH}
              rx={8}
              fill="white"
              fillOpacity={0.1}
              stroke="white"
              strokeOpacity={0.25}
              strokeWidth={1.5}
            />

            {/* Title bar — same on every doc (the repeated keyword) */}
            <rect x={18} y={22} width={titleW} height={12} rx={4} fill="white" fillOpacity={0.7} />

            {/* Date line */}
            <rect x={18} y={44} width={72} height={6} rx={2} fill="white" fillOpacity={0.35} />

            {/* Body text lines */}
            <rect x={18} y={68} width={lineW1} height={6} rx={2} fill="white" fillOpacity={0.35} />
            <rect x={18} y={84} width={lineW2} height={6} rx={2} fill="white" fillOpacity={0.35} />
            <rect x={18} y={100} width={lineW3} height={6} rx={2} fill="white" fillOpacity={0.35} />
            <rect x={18} y={116} width={lineW1 - 20} height={6} rx={2} fill="white" fillOpacity={0.28} />

            {/* Second paragraph */}
            <rect x={18} y={142} width={lineW3} height={6} rx={2} fill="white" fillOpacity={0.28} />
            <rect x={18} y={158} width={lineW1} height={6} rx={2} fill="white" fillOpacity={0.28} />
            <rect x={18} y={174} width={lineW2 - 10} height={6} rx={2} fill="white" fillOpacity={0.22} />
          </g>
        ))}

        {/* The signal dot — at the collision center where docs overlap */}
        <circle cx={600} cy={300} r={48} fill="#2dd4a8" fillOpacity={0.04} />
        <circle cx={600} cy={300} r={28} fill="#2dd4a8" fillOpacity={0.1} />
        <circle cx={600} cy={300} r={12} fill="#2dd4a8" />

        {/* Subtle "vs" marks between docs — the competition */}
        {[390, 500, 610].map((x, i) => (
          <text
            key={i}
            x={x + 50}
            y={440}
            textAnchor="middle"
            fill="white"
            fillOpacity={0.2}
            fontSize={20}
            fontFamily="system-ui, sans-serif"
            fontWeight={600}
          >
            vs
          </text>
        ))}
      </svg>
    </div>
  )
}
