import { ImageResponse } from 'next/og';
import { numeroValido, limparFrase, SITE_HOST } from '@/lib/cardCompartilhar';

export const runtime = 'edge';

// Card 1080x1920 pro story. Recebe só ?n=<número de vida>&frase=<até 60
// caracteres> — nada de id da análise, então a imagem não tem como vazar
// nome, data de nascimento ou qualquer outro dado da pessoa.

const W = 1080;
const H = 1920;
// Safe zone de story: a UI do Instagram cobre o topo (~250px) e a base
// (~270px). Todo texto fica entre y=250 e y=1650.
const SAFE_TOP = 250;
const SAFE_BOTTOM = 1650;

// Fontes embutidas no bundle (woff, subset latin — cobre acentos do PT-BR).
// Sem elas o ImageResponse usa uma sans padrão, e a frase precisa ser
// serifada. Promise no escopo do módulo = carrega uma vez por instância.
const fontes = Promise.all([
  fetch(new URL('./fonts/cinzel-latin-700-normal.woff', import.meta.url)).then((r) => r.arrayBuffer()),
  fetch(new URL('./fonts/cormorant-garamond-latin-500-italic.woff', import.meta.url)).then((r) => r.arrayBuffer()),
  fetch(new URL('./fonts/cormorant-garamond-latin-600-normal.woff', import.meta.url)).then((r) => r.arrayBuffer()),
]);

const GOLD = '#e8c47a';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const numero = numeroValido(searchParams.get('n'));
  if (!numero) {
    return new Response('Parâmetro n inválido', { status: 400 });
  }
  const frase = limparFrase(searchParams.get('frase')) || 'Nada no seu mapa é por acaso.';
  const [cinzel, cormorantItalic, cormorant] = await fontes;

  // Número mestre (11/22/33) tem 2 dígitos — reduz a fonte pra não estourar.
  const tamanhoNumero = numero > 9 ? 400 : 520;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(170deg, #1c0638 0%, #12032a 45%, #07010f 100%)',
        }}
      >
        {/* Decoração de fundo (pode passar da safe zone — não é texto) */}
        <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <radialGradient id="halo" cx="50%" cy="42%" r="45%">
              <stop offset="0%" stopColor="rgba(139,92,246,0.35)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#halo)" />
          <circle cx="540" cy="790" r="420" fill="none" stroke="rgba(232,196,122,0.14)" strokeWidth="2" />
          <circle cx="540" cy="790" r="340" fill="none" stroke="rgba(139,92,246,0.22)" strokeWidth="2" />
          <circle cx="540" cy="790" r="490" fill="none" stroke="rgba(139,92,246,0.10)" strokeWidth="1" />
          {[
            [120, 160], [960, 120], [80, 980], [1000, 900], [180, 1780],
            [900, 1820], [300, 420], [800, 380], [540, 90], [540, 1860],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 4 : 2.5} fill="rgba(232,196,122,0.55)" />
          ))}
        </svg>

        {/* Conteúdo: só dentro da safe zone */}
        <div
          style={{
            position: 'absolute',
            top: SAFE_TOP,
            left: 90,
            width: W - 180,
            height: SAFE_BOTTOM - SAFE_TOP,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Filetes em vez de ✦: a Cinzel não tem esse glifo (vira quadradinho) */}
            <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Cinzel', fontSize: 30, letterSpacing: 8, color: 'rgba(232,196,122,0.75)' }}>
              <div style={{ width: 60, height: 1, background: 'rgba(232,196,122,0.5)', marginRight: 24 }} />
              INTUITIVE CONCEPT
              <div style={{ width: 60, height: 1, background: 'rgba(232,196,122,0.5)', marginLeft: 16 }} />
            </div>
            <div style={{ marginTop: 70, fontFamily: 'Cinzel', fontSize: 44, letterSpacing: 10, color: 'rgba(243,232,255,0.85)' }}>
              NÚMERO DE VIDA
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              fontFamily: 'Cinzel',
              fontSize: tamanhoNumero,
              lineHeight: 1,
              color: GOLD,
              textShadow: '0 0 60px rgba(232,196,122,0.35)',
            }}
          >
            {String(numero)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 120, height: 2, background: 'rgba(232,196,122,0.6)', marginBottom: 50 }} />
            <div
              style={{
                display: 'flex',
                textAlign: 'center',
                fontFamily: 'Cormorant Garamond',
                fontStyle: 'italic',
                fontSize: 76,
                lineHeight: 1.2,
                color: '#f6ecff',
              }}
            >
              “{frase}”
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Cormorant Garamond', fontWeight: 600, fontSize: 44, color: 'rgba(243,232,255,0.8)' }}>
              Descubra o seu:
            </div>
            <div style={{ marginTop: 10, fontFamily: 'Cinzel', fontSize: 40, letterSpacing: 2, color: GOLD }}>
              {SITE_HOST}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'Cinzel', data: cinzel, weight: 700, style: 'normal' },
        { name: 'Cormorant Garamond', data: cormorantItalic, weight: 500, style: 'italic' },
        { name: 'Cormorant Garamond', data: cormorant, weight: 600, style: 'normal' },
      ],
      // Mesma URL = mesma imagem, então pode ficar no CDN pra sempre.
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }
  );
}
