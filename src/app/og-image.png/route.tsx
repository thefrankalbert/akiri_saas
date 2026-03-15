import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 80, fontWeight: 700, marginBottom: 20 }}>Akiri</div>
      <div style={{ fontSize: 32, opacity: 0.9, textAlign: 'center', maxWidth: 800 }}>
        Marketplace de transport de colis pour la diaspora africaine
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
