import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request, { params }) {
  const { id } = params;

  // Busca dados da análise
  let nome = 'Seu Mapa';
  let cartaNome = '';
  let cartaInvertida = false;
  let cartaSimbol = '🔮';
  let palavrasChave = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await supabase
      .from('analises')
      .select('nome, carta_tarot')
      .eq('id', id)
      .single();

    if (data?.nome) nome = data.nome.split(' ')[0];
    if (data?.carta_tarot) {
      const carta = JSON.parse(data.carta_tarot);
      cartaNome = carta.nome || '';
      cartaInvertida = carta.invertida || false;
      cartaSimbol = carta.simbolo || '🔮';
      palavrasChave = carta.palavrasChave || [];
    }
  } catch (_) {}

  const fraseChave = palavrasChave.slice(0, 2).join(' · ') || 'Mapa Espiritual';
  const cartaLabel = cartaNome
    ? `${cartaSimbol}  ${cartaNome}${cartaInvertida ? ' — Invertida' : ''}`
    : '🔮  Arcano do Seu Ciclo';

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
        {/* SVG geométrico de fundo */}
        <svg
          width="1200"
          height="630"
          style={{ position: 'absolute', inset: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Círculos concêntricos */}
          <circle cx="600" cy="315" r="280" fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="1" />
          <circle cx="600" cy="315" r="220" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="1" />
          <circle cx="600" cy="315" r="160" fill="none" stroke="rgba(212,168,83,0.1)" strokeWidth="1" />
          <circle cx="600" cy="315" r="100" fill="none" stroke="rgba(212,168,83,0.12)" strokeWidth="1" />

          {/* Linhas diagonais (estrela de 8 pontas) */}
          <line x1="600" y1="35" x2="600" y2="595" stroke="rgba(139,92,246,0.08)" strokeWidth="1" />
          <line x1="320" y1="315" x2="880" y2="315" stroke="rgba(139,92,246,0.08)" strokeWidth="1" />
          <line x1="402" y1="117" x2="798" y2="513" stroke="rgba(139,92,246,0.06)" strokeWidth="1" />
          <line x1="798" y1="117" x2="402" y2="513" stroke="rgba(139,92,246,0.06)" strokeWidth="1" />

          {/* Triângulo superior */}
          <polygon
            points="600,160 480,350 720,350"
            fill="none"
            stroke="rgba(212,168,83,0.12)"
            strokeWidth="1"
          />
          {/* Triângulo inferior (invertido) */}
          <polygon
            points="600,470 480,280 720,280"
            fill="none"
            stroke="rgba(212,168,83,0.1)"
            strokeWidth="1"
          />

          {/* Estrelas/pontos */}
          {[
            [120, 80], [1080, 80], [60, 550], [1140, 550],
            [200, 200], [1000, 200], [200, 430], [1000, 430],
            [600, 60], [600, 570],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="2"
              fill="rgba(212,168,83,0.5)"
            />
          ))}

          {/* Arco decorativo topo */}
          <path
            d="M 200 0 Q 600 120 1000 0"
            fill="none"
            stroke="rgba(139,92,246,0.1)"
            strokeWidth="1"
          />
          {/* Arco decorativo base */}
          <path
            d="M 200 630 Q 600 510 1000 630"
            fill="none"
            stroke="rgba(139,92,246,0.1)"
            strokeWidth="1"
          />
        </svg>

        {/* Conteúdo principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            zIndex: 10,
            textAlign: 'center',
            padding: '0 80px',
          }}
        >
          {/* Label topo */}
          <div
            style={{
              fontSize: 14,
              letterSpacing: '0.2em',
              color: 'rgba(212,168,83,0.7)',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            Intuitive Concept · Mapa Espiritual
          </div>

          {/* Nome da pessoa */}
          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              color: '#f0eff4',
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: '-0.01em',
            }}
          >
            {nome}
          </div>

          {/* Linha divisória dourada */}
          <div
            style={{
              width: 180,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.6), transparent)',
              marginBottom: 24,
            }}
          />

          {/* Carta */}
          <div
            style={{
              fontSize: 28,
              color: '#f0c870',
              fontWeight: 600,
              marginBottom: 12,
              letterSpacing: '0.02em',
            }}
          >
            {cartaLabel}
          </div>

          {/* Frase-chave */}
          {fraseChave && (
            <div
              style={{
                fontSize: 16,
                color: 'rgba(212,168,83,0.65)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {fraseChave}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            fontSize: 13,
            color: 'rgba(152,150,168,0.5)',
            letterSpacing: '0.08em',
          }}
        >
          conceptintuitive.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
