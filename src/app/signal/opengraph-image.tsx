import { ImageResponse } from 'next/og'

export const alt = 'Be The Signal — Guides from Chris Hornak'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const guideLabels = [
  { number: '01', title: 'Findability' },
  { number: '02', title: 'Search Visibility' },
  { number: '03', title: 'AI Readiness' },
  { number: '04', title: 'Website Trust' },
  { number: '05', title: 'Content Structure' },
  { number: '06', title: 'Strategy First' },
]

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0a0a0a',
          padding: '60px 72px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top: label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#2dd4a8',
            }}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#2dd4a8',
            }}
          >
            Be The Signal
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <h1
            style={{
              fontSize: '52px',
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#f0f0f0',
              margin: 0,
              maxWidth: '800px',
            }}
          >
            Your signal is either working for you or against you
          </h1>
        </div>

        {/* Bottom: 6 guide pills + author */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {guideLabels.map((guide) => (
              <div
                key={guide.number}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(45,212,168,0.15)',
                  backgroundColor: 'rgba(45,212,168,0.05)',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(45,212,168,0.6)' }}>
                  {guide.number}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  {guide.title}
                </span>
              </div>
            ))}
          </div>

          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
            chrishornak.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
