import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/blog'

export const alt = 'The Chris Hornak blog'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  const headline = post?.title ?? 'Blog'
  const minutes = post?.readingMinutes ?? 5

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
        {/* Top label */}
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
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#2dd4a8',
            }}
          >
            Blog
          </span>
        </div>

        {/* Headline. 92px floor so it stays readable as a phone thumbnail. */}
        <div style={{ display: 'flex' }}>
          <span
            style={{
              fontSize: '92px',
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
              color: '#f0f0f0',
              maxWidth: '1000px',
            }}
          >
            {headline}
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(240,240,240,0.14)',
            paddingTop: '26px',
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 600, color: '#f0f0f0' }}>
            chris hornak
          </span>
          <span style={{ fontSize: '20px', color: 'rgba(240,240,240,0.55)' }}>
            {minutes} min read
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
