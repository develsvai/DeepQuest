import { ImageResponse } from 'next/og'

export const runtime = 'edge'

/**
 * OG Image Generation API Route
 * Generates dynamic Open Graph images using Vercel's @vercel/og
 *
 * @see https://vercel.com/docs/og-image-generation
 */
export async function GET() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#c96442',
        backgroundImage: 'linear-gradient(135deg, #c96442 0%, #e07856 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
        }}
      ></div>
      <div
        style={{
          fontSize: '72px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        Deep Quest
      </div>
      <div
        style={{
          fontSize: '32px',
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center',
        }}
      >
        AI-Powered Coaching for Developer Tech Interviews
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  )
}
