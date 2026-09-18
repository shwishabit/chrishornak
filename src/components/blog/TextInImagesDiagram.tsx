'use client'

/**
 * Featured visual for "Text in images is a tax you pay forever".
 *
 * Same treatment as ShopifyThemeDiagram: 1200x630, teal gradient field, grain,
 * vignette, content drawn in SVG so it stays crisp at any width.
 *
 * The idea, drawn: the same banner twice. Left, the words are inside the
 * picture and changing one takes five steps. Right, the words sit on top of
 * the picture as fields and changing one takes one edit.
 */
const WARN = '#f59e6b'
const TEAL = '#2dd4a8'
const SANS = 'system-ui, sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

const steps = ['Find the source file', 'Open it', 'Export', 'Upload', 'Rewrite the alt text']

export function TextInImagesDiagram() {
  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl shadow-xl shadow-black/20"
      style={{ aspectRatio: '1200 / 630' }}
      role="img"
      aria-label="The same banner twice. On the left the headline is baked into the image, and changing it takes five steps: find the source file, open it, export, upload, and rewrite the alt text. On the right the headline is a field on top of the image, and changing it takes one edit."
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
        {/* ---- left: words in the picture ---- */}
        <text x={150} y={148} fill="white" fillOpacity={0.45} fontSize={19} fontFamily={SANS} fontWeight={700} letterSpacing={3.4}>
          IN THE IMAGE
        </text>
        <text x={150} y={196} fill="white" fillOpacity={0.92} fontSize={35} fontFamily={SANS} fontWeight={700}>
          5 steps per word
        </text>

        <rect x={150} y={226} width={370} height={120} rx={10} fill="white" fillOpacity={0.07} />
        <text x={174} y={284} fill="white" fillOpacity={0.55} fontSize={26} fontFamily={SANS} fontWeight={800} style={{ filter: 'blur(0.6px)' }}>
          Save 20% this week
        </text>
        <text x={174} y={318} fill={WARN} fontSize={15} fontFamily={MONO}>
          pixels
        </text>

        {steps.map((s, i) => (
          <text key={s} x={150} y={386 + i * 30} fill="white" fillOpacity={0.62} fontSize={19} fontFamily={SANS}>
            {`${i + 1}. ${s}`}
          </text>
        ))}

        {/* ---- divider ---- */}
        <line x1={600} y1={120} x2={600} y2={560} stroke="white" strokeOpacity={0.14} strokeWidth={1} />

        {/* ---- right: words on the picture ---- */}
        <text x={680} y={148} fill={TEAL} fontSize={19} fontFamily={SANS} fontWeight={700} letterSpacing={3.4}>
          ON THE IMAGE
        </text>
        <text x={680} y={196} fill="white" fillOpacity={0.96} fontSize={35} fontFamily={SANS} fontWeight={700}>
          1 edit per word
        </text>

        <rect x={680} y={226} width={390} height={120} rx={10} fill="white" fillOpacity={0.07} />
        <text x={704} y={284} fill="white" fillOpacity={0.96} fontSize={26} fontFamily={SANS} fontWeight={800}>
          Save 20% this week
        </text>
        <text x={704} y={318} fill={TEAL} fontSize={15} fontFamily={MONO}>
          live text
        </text>

        <rect x={680} y={368} width={390} height={56} rx={10} fill={TEAL} fillOpacity={0.12} stroke={TEAL} strokeOpacity={0.45} />
        <text x={704} y={402} fill="white" fillOpacity={0.55} fontSize={17} fontFamily={MONO}>
          heading
        </text>
        <text x={1046} y={402} textAnchor="end" fill="white" fillOpacity={0.92} fontSize={19} fontFamily={SANS} fontWeight={600}>
          Save 20% this week
        </text>

        <text x={680} y={552} fill="white" fillOpacity={0.5} fontSize={20} fontFamily={SANS}>
          Readable, translatable, testable.
        </text>
      </svg>
    </div>
  )
}
