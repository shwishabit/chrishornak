'use client'

export function AiReadinessDiagram() {
  // Chat UI layout (centered in 1200×630 viewBox)
  const chatX = 300
  const chatW = 600

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
        {/* User prompt bubble — right-aligned */}
        <rect
          x={chatX + 180}
          y={60}
          width={chatW - 180}
          height={56}
          rx={20}
          fill="white"
          fillOpacity={0.25}
        />
        <text
          x={chatX + 210}
          y={94}
          fill="white"
          fillOpacity={0.85}
          fontSize={18}
          fontFamily="system-ui, sans-serif"
          fontWeight={400}
        >
          Recommend a plumber in Denver
        </text>

        {/* AI response bubble — left-aligned, larger */}
        <rect
          x={chatX}
          y={140}
          width={chatW}
          height={300}
          rx={20}
          fill="white"
          fillOpacity={0.12}
        />

        {/* AI avatar — small circle */}
        <circle cx={chatX + 28} cy={170} r={10} fill="#2dd4a8" fillOpacity={0.7} />
        <text
          x={chatX + 46}
          y={175}
          fill="white"
          fillOpacity={0.75}
          fontSize={14}
          fontFamily="system-ui, sans-serif"
          fontWeight={600}
        >
          AI Assistant
        </text>

        {/* Response intro text */}
        <text
          x={chatX + 28}
          y={210}
          fill="white"
          fillOpacity={0.8}
          fontSize={17}
          fontFamily="system-ui, sans-serif"
        >
          Here are some highly rated plumbers in Denver:
        </text>

        {/* Competitor 1 */}
        <circle cx={chatX + 40} cy={252} r={5} fill="#2dd4a8" fillOpacity={0.85} />
        <text x={chatX + 56} y={257} fill="white" fillOpacity={0.85} fontSize={18} fontFamily="system-ui, sans-serif" fontWeight={600}>
          Mile High Plumbing Co.
        </text>
        <text x={chatX + 56} y={279} fill="white" fillOpacity={0.6} fontSize={14} fontFamily="system-ui, sans-serif">
          Full-service residential and commercial. 4.9 stars, 200+ reviews.
        </text>

        {/* Competitor 2 */}
        <circle cx={chatX + 40} cy={314} r={5} fill="#2dd4a8" fillOpacity={0.85} />
        <text x={chatX + 56} y={319} fill="white" fillOpacity={0.85} fontSize={18} fontFamily="system-ui, sans-serif" fontWeight={600}>
          Front Range Plumbing
        </text>
        <text x={chatX + 56} y={341} fill="white" fillOpacity={0.6} fontSize={14} fontFamily="system-ui, sans-serif">
          Emergency repairs and remodeling. Serving Denver metro since 2008.
        </text>

        {/* Competitor 3 */}
        <circle cx={chatX + 40} cy={376} r={5} fill="#2dd4a8" fillOpacity={0.85} />
        <text x={chatX + 56} y={381} fill="white" fillOpacity={0.85} fontSize={18} fontFamily="system-ui, sans-serif" fontWeight={600}>
          Summit Drain Solutions
        </text>
        <text x={chatX + 56} y={403} fill="white" fillOpacity={0.6} fontSize={14} fontFamily="system-ui, sans-serif">
          Drain cleaning specialists. Same-day service, transparent pricing.
        </text>

        {/* "Your business" — disconnected below, faded out */}
        <line
          x1={600}
          y1={470}
          x2={600}
          y2={510}
          stroke="#2dd4a8"
          strokeOpacity={0.15}
          strokeWidth={1}
          strokeDasharray="3 4"
        />

        {/* The signal dot — same triple-ring, alone, not in the list */}
        <circle cx={600} cy={540} r={48} fill="#2dd4a8" fillOpacity={0.04} />
        <circle cx={600} cy={540} r={28} fill="#2dd4a8" fillOpacity={0.1} />
        <circle cx={600} cy={540} r={12} fill="#2dd4a8" />

        {/* Faint label under the dot */}
        <text
          x={600}
          y={580}
          textAnchor="middle"
          fill="white"
          fillOpacity={0.2}
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          fontStyle="italic"
        >
          your business
        </text>
      </svg>
    </div>
  )
}
