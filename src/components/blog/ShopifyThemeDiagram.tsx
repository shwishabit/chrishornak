'use client'

/**
 * Featured visual for "A small team moves fast if the Shopify theme allows it".
 *
 * Same treatment as the Be The Signal diagrams: 1200x630, teal gradient field,
 * grain, vignette, content drawn in SVG so it stays crisp at any width.
 *
 * The idea, drawn: the same page as one sealed block on the left, and as named
 * sections with visible settings on the right.
 */
export function ShopifyThemeDiagram() {
  const sections = [
    { name: 'product-hero', settings: '4 settings', y: 250 },
    { name: 'kit-products', settings: '3 settings', y: 340 },
    { name: 'comparison-table', settings: '6 settings', y: 430 },
  ]

  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-xl shadow-black/20"
      style={{ aspectRatio: '1200 / 630' }}
      role="img"
      aria-label="Two versions of the same Shopify product page. On the left it is one sealed block with nothing named. On the right it is three named sections, product-hero, kit-products and comparison-table, each showing how many settings it exposes."
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
        {/* ---- left: one sealed block ---- */}
        <text
          x={150}
          y={148}
          fill="white"
          fillOpacity={0.45}
          fontSize={19}
          fontFamily="system-ui, sans-serif"
          fontWeight={700}
          letterSpacing={3.4}
        >
          ONE BLOCK
        </text>
        <text
          x={150}
          y={196}
          fill="white"
          fillOpacity={0.92}
          fontSize={35}
          fontFamily="system-ui, sans-serif"
          fontWeight={700}
        >
          Nothing has a name
        </text>

        <rect x={150} y={232} width={370} height={120} rx={10} fill="white" fillOpacity={0.07} />
        <rect x={150} y={366} width={370} height={64} rx={10} fill="white" fillOpacity={0.07} />
        <rect x={150} y={444} width={370} height={64} rx={10} fill="white" fillOpacity={0.07} />

        <text
          x={150}
          y={552}
          fill="white"
          fillOpacity={0.5}
          fontSize={20}
          fontFamily="system-ui, sans-serif"
        >
          Every change is a ticket.
        </text>

        {/* ---- divider ---- */}
        <line x1={600} y1={120} x2={600} y2={560} stroke="white" strokeOpacity={0.14} strokeWidth={1} />

        {/* ---- right: named sections ---- */}
        <text
          x={680}
          y={148}
          fill="#2dd4a8"
          fontSize={19}
          fontFamily="system-ui, sans-serif"
          fontWeight={700}
          letterSpacing={3.4}
        >
          NAMED SECTIONS
        </text>
        <text
          x={680}
          y={196}
          fill="white"
          fillOpacity={0.96}
          fontSize={35}
          fontFamily="system-ui, sans-serif"
          fontWeight={700}
        >
          Everything has an address
        </text>

        {sections.map((s) => (
          <g key={s.name}>
            <rect
              x={680}
              y={s.y - 34}
              width={390}
              height={64}
              rx={10}
              fill="#2dd4a8"
              fillOpacity={0.12}
              stroke="#2dd4a8"
              strokeOpacity={0.45}
              strokeWidth={1}
            />
            <text
              x={704}
              y={s.y + 4}
              fill="white"
              fillOpacity={0.9}
              fontSize={21}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {s.name}
            </text>
            <text
              x={1046}
              y={s.y + 4}
              textAnchor="end"
              fill="#2dd4a8"
              fontSize={17}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {s.settings}
            </text>
          </g>
        ))}

        <text
          x={680}
          y={552}
          fill="white"
          fillOpacity={0.5}
          fontSize={20}
          fontFamily="system-ui, sans-serif"
        >
          A person or an agent can find the same thing.
        </text>
      </svg>
    </div>
  )
}
