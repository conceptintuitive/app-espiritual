import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Intuitive Concept — Seu Mapa de Numerologia e Astrologia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'linear-gradient(135deg, #0a0118 0%, #1a0535 50%, #0d0125 100%)',
          overflow: 'hidden',
          fontFamily: 'serif',
        }}
      >
        {/* SVG geométrico de fundo — mesmo estilo de /api/og/[id] */}
        <svg
          width="1200"
          height="630"
          style={{ position: 'absolute', inset: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="600" cy="315" r="280" fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="1" />
          <circle cx="600" cy="315" r="220" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="1" />
          <circle cx="600" cy="315" r="160" fill="none" stroke="rgba(212,168,83,0.1)" strokeWidth="1" />
          <circle cx="600" cy="315" r="100" fill="none" stroke="rgba(212,168,83,0.12)" strokeWidth="1" />

          <line x1="600" y1="35" x2="600" y2="595" stroke="rgba(139,92,246,0.08)" strokeWidth="1" />
          <line x1="320" y1="315" x2="880" y2="315" stroke="rgba(139,92,246,0.08)" strokeWidth="1" />
          <line x1="402" y1="117" x2="798" y2="513" stroke="rgba(139,92,246,0.06)" strokeWidth="1" />
          <line x1="798" y1="117" x2="402" y2="513" stroke="rgba(139,92,246,0.06)" strokeWidth="1" />

          <polygon points="600,160 480,350 720,350" fill="none" stroke="rgba(212,168,83,0.12)" strokeWidth="1" />
          <polygon points="600,470 480,280 720,280" fill="none" stroke="rgba(212,168,83,0.1)" strokeWidth="1" />

          {[
            [120, 80], [1080, 80], [60, 550], [1140, 550],
            [200, 200], [1000, 200], [200, 430], [1000, 430],
            [600, 60], [600, 570],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2" fill="rgba(212,168,83,0.5)" />
          ))}

          <path d="M 200 0 Q 600 120 1000 0" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="1" />
          <path d="M 200 630 Q 600 510 1000 630" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="1" />
        </svg>

        {/* Conteúdo principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            textAlign: 'center',
            padding: '0 80px',
          }}
        >
          <div
            style={{
              fontSize: 15,
              letterSpacing: '0.25em',
              color: 'rgba(212,168,83,0.7)',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            Numerologia · Astrologia
          </div>

          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#f0eff4',
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: '-0.01em',
            }}
          >
            Intuitive Concept
          </div>

          <div
            style={{
              width: 180,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.6), transparent)',
              marginBottom: 24,
            }}
          />

          <div
            style={{
              fontSize: 32,
              color: '#f0c870',
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            Seu Mapa de Numerologia e Astrologia
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 28,
            fontSize: 13,
            color: 'rgba(152,150,168,0.5)',
            letterSpacing: '0.08em',
          }}
        >
          intuitiveconcept.com.br
        </div>
      </div>
    ),
    { ...size }
  );
}
