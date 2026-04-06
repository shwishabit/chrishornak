'use client'

export function StrategyFirstDiagram() {
  // Numbers scattered out of order — the wrong sequence
  const numbers = [
    { n: '4', x: 200, y: 180, rotate: -15, size: 73, o: 0.75 },
    { n: '1', x: 820, y: 420, rotate: 12, size: 67, o: 0.7 },
    { n: '6', x: 350, y: 420, rotate: 8, size: 62, o: 0.65 },
    { n: '2', x: 950, y: 180, rotate: -8, size: 70, o: 0.72 },
    { n: '5', x: 180, y: 340, rotate: 20, size: 56, o: 0.6 },
    { n: '3', x: 980, y: 340, rotate: -12, size: 64, o: 0.68 },
  ]

  // The correct sequence — subtle, near center
  const correct = [
    { n: '1', y: 145 },
    { n: '2', y: 225 },
    { n: '3', y: 305 },
    { n: '4', y: 385 },
    { n: '5', y: 465 },
    { n: '6', y: 545 },
  ]

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
        {/* Scattered numbers — the wrong order */}
        {numbers.map((item, i) => (
          <text
            key={`s-${i}`}
            x={item.x}
            y={item.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fillOpacity={item.o}
            fontSize={item.size}
            fontFamily="system-ui, sans-serif"
            fontWeight={700}
            transform={`rotate(${item.rotate}, ${item.x}, ${item.y})`}
          >
            {item.n}
          </text>
        ))}

        {/* Center vertical line — the correct path */}
        <line
          x1={600}
          y1={120}
          x2={600}
          y2={570}
          stroke="#2dd4a8"
          strokeOpacity={0.2}
          strokeWidth={1.5}
        />

        {/* Correct sequence — small, aligned, teal-tinted */}
        {correct.map((item, i) => (
          <g key={`c-${i}`}>
            {/* Small dot on the line */}
            <circle cx={600} cy={item.y} r={5} fill="#2dd4a8" fillOpacity={0.4} />
            {/* Number */}
            <text
              x={624}
              y={item.y + 1}
              dominantBaseline="middle"
              fill="#2dd4a8"
              fillOpacity={0.55}
              fontSize={22}
              fontFamily="system-ui, sans-serif"
              fontWeight={600}
            >
              {item.n}
            </text>
          </g>
        ))}

        {/* The signal dot — at the top of the correct sequence */}
        <circle cx={600} cy={90} r={48} fill="#2dd4a8" fillOpacity={0.04} />
        <circle cx={600} cy={90} r={28} fill="#2dd4a8" fillOpacity={0.1} />
        <circle cx={600} cy={90} r={12} fill="#2dd4a8" />
      </svg>
    </div>
  )
}
