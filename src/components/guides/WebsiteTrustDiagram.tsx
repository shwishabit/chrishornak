'use client'

export function WebsiteTrustDiagram() {
  // 5-point star path centered at 0,0 with radius ~20
  const starPath = (cx: number, cy: number, outerR: number) => {
    const innerR = outerR * 0.4
    const points = 5
    let d = ''
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const angle = (Math.PI / points) * i - Math.PI / 2
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      d += `${i === 0 ? 'M' : 'L'}${x},${y}`
    }
    return d + 'Z'
  }

  const starY = 280
  const starSpacing = 140
  const starR = 52
  const startX = 600 - 2 * starSpacing // centers 5 stars at 600

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
        {/* Stars 1, 2, 4, 5 — bright, representing strong reputation */}
        {[0, 1, 3, 4].map((i) => (
          <path
            key={i}
            d={starPath(startX + i * starSpacing, starY, starR)}
            fill="white"
            fillOpacity={0.8}
          />
        ))}

        {/* Star 3 (center) — empty outline, the gap */}
        <path
          d={starPath(startX + 2 * starSpacing, starY, starR)}
          fill="none"
          stroke="white"
          strokeOpacity={0.25}
          strokeWidth={2}
        />

        {/* The signal dot — replaces the center star */}
        <circle cx={600} cy={starY} r={48} fill="#2dd4a8" fillOpacity={0.04} />
        <circle cx={600} cy={starY} r={28} fill="#2dd4a8" fillOpacity={0.1} />
        <circle cx={600} cy={starY} r={12} fill="#2dd4a8" />

        {/* Labels */}
        <text
          x={600}
          y={starY + 90}
          textAnchor="middle"
          fill="white"
          fillOpacity={0.35}
          fontSize={15}
          fontFamily="system-ui, sans-serif"
          fontStyle="italic"
        >
          your website
        </text>

        {/* "4.9 stars" floating above — the reputation */}
        <text
          x={600}
          y={starY - 90}
          textAnchor="middle"
          fill="white"
          fillOpacity={0.7}
          fontSize={56}
          fontFamily="system-ui, sans-serif"
          fontWeight={700}
        >
          4.9 ★
        </text>
        <text
          x={600}
          y={starY - 55}
          textAnchor="middle"
          fill="white"
          fillOpacity={0.4}
          fontSize={16}
          fontFamily="system-ui, sans-serif"
        >
          what customers say
        </text>

        {/* Subtext below the stars */}
        <text
          x={600}
          y={starY + 140}
          textAnchor="middle"
          fill="white"
          fillOpacity={0.3}
          fontSize={16}
          fontFamily="system-ui, sans-serif"
        >
          what your website shows
        </text>
      </svg>
    </div>
  )
}
