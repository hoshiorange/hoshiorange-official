import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ほし — hoshiorange official';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(80,70,200,0.55), transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(255,140,42,0.35), transparent 55%), radial-gradient(ellipse at 50% 95%, rgba(40,80,180,0.5), transparent 60%), #060814',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          padding: 80,
          position: 'relative',
        }}
      >
        {/* 星のドット */}
        {[
          [120, 90],
          [240, 180],
          [420, 80],
          [580, 220],
          [720, 130],
          [880, 250],
          [1040, 100],
          [180, 480],
          [340, 540],
          [520, 460],
          [700, 500],
          [880, 470],
          [1060, 520],
          [60, 320],
          [1140, 360],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: i % 3 === 0 ? 4 : 2,
              height: i % 3 === 0 ? 4 : 2,
              borderRadius: 999,
              background: '#ffffff',
              opacity: 0.8,
            }}
          />
        ))}

        {/* 大きな星マーク（オレンジ） */}
        <div
          style={{
            position: 'absolute',
            right: 80,
            top: 80,
            width: 160,
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="160" height="160" viewBox="0 0 64 64">
            <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(-22 32 32)" fill="none" stroke="#ff8c2a" strokeWidth="2" opacity="0.85" />
            <path d="M32 6 L36 28 L58 32 L36 36 L32 58 L28 36 L6 32 L28 28 Z" fill="#ff8c2a" />
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            alignItems: 'flex-start',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: '#ff8c2a',
              letterSpacing: 6,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Official Hub
          </div>
          <div
            style={{
              fontSize: 100,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.1,
              color: '#ffffff',
            }}
          >
            夜空に届け、
            <span style={{ color: '#ff8c2a' }}>ほし</span>
            のつぶやき。
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#c3c9e6',
              marginTop: 16,
            }}
          >
            hoshiorange — game / create / code
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
