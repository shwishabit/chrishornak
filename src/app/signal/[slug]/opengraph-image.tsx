import { ImageResponse } from 'next/og'
import { getGuideBySlug } from '@/lib/guides'

export const alt = 'The Signal — Guide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const surfaceLabels = ['Search', 'AI', 'Social', 'Maps', 'Reviews', 'Referrals']

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  const headline = guide?.headline ?? 'The Signal'
  const number = guide?.number ?? '01'

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
          {/* Teal dot */}
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
            The Signal &middot; Guide {number}
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#f0f0f0',
              margin: 0,
              maxWidth: '900px',
            }}
          >
            {headline}
          </h1>
        </div>

        {/* Bottom: surface labels + author */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          {/* 6 surfaces */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {surfaceLabels.map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Author */}
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
            chrishornak.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
