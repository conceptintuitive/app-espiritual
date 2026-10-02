import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { idValido, dadosDoCard, SITE_HOST } from '@/lib/cardCompartilhar';

// Node (não edge): a rota importa o manualgenerator pra montar a frase e o
// arquétipo, e ele é grande demais pra valer a pena num bundle edge.
export const runtime = 'nodejs';

// Card 1080x1920 pro story. Recebe só ?id=<uuid da análise>. Número,
// arquétipo e frase são montados no servidor (lib/cardCompartilhar.js) —
// nada da URL vira texto na imagem, e a imagem não carrega nome, data de
// nascimento nem nenhum outro dado pessoal.

const W = 1080;
const H = 1920;
// Safe zone de story: a UI do Instagram cobre o topo (~250px) e a base
// (~270px). Todo texto fica entre y=250 e y=1650.
const SAFE_TOP = 250;
const SAFE_BOTTOM = 1650;
// Faixa vazia entre a frase e o rodapé, pro sticker de link do Instagram.
const FAIXA_STICKER = 200;

// Fontes embutidas (woff, subset latin — cobre acentos do PT-BR). Sem elas o
// ImageResponse usa uma sans padrão. Promise no escopo do módulo = lê do
// disco uma vez por instância.
// Frase em EB Garamond, não Cormorant: o renderizador do next/og desenha
// errado os acentos compostos da Cormorant itálico (ê, ô, é saem deslocados).
// A EB Garamond renderiza certo e tem o mesmo espírito.
const dirFontes = join(process.cwd(), 'app/api/card/fonts');
const fontes = Promise.all([
  readFile(join(dirFontes, 'cinzel-latin-700-normal.woff')),
  readFile(join(dirFontes, 'eb-garamond-latin-500-italic.woff')),
  readFile(join(dirFontes, 'eb-garamond-latin-600-normal.woff')),
]);

const GOLD = '#e8c47a';

async function buscarAnalise(id) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase não configurado');
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from('analises')
    .select('nome, signo, numero_vida, data_nascimento, payment_status, sintese_gerada')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!idValido(id)) {
    return new Response('Parâmetro id inválido', { status: 400 });
  }

  let card;
  try {
    const row = await buscarAnalise(id);
    card = row ? dadosDoCard(row) : null;
  } catch (e) {
    console.error('[card] falhou ao buscar análise:', e?.message);
    return new Response('Erro ao gerar card', { status: 500 });
  }
  if (!card) return new Response('Análise não encontrada', { status: 404 });

  const { numero, arquetipo, frase } = card;
  const [cinzel, garamondItalic, garamond] = await fontes;

  // Número mestre (11/22/33) tem 2 dígitos — fonte menor pra não estourar.
  const tamanhoNumero = numero > 9 ? 300 : 390;

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
            <radialGradient id="halo" cx="50%" cy="34%" r="42%">
              <stop offset="0%" stopColor="rgba(139,92,246,0.35)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#halo)" />
          <circle cx="540" cy="640" r="300" fill="none" stroke="rgba(139,92,246,0.22)" strokeWidth="2" />
          <circle cx="540" cy="640" r="370" fill="none" stroke="rgba(232,196,122,0.14)" strokeWidth="2" />
          <circle cx="540" cy="640" r="440" fill="none" stroke="rgba(139,92,246,0.10)" strokeWidth="1" />
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
          }}
        >
          {/* Topo: marca + rótulo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Filetes em vez de ✦: a Cinzel não tem esse glifo (vira quadradinho) */}
            <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Cinzel', fontSize: 30, letterSpacing: 8, color: 'rgba(232,196,122,0.75)' }}>
              <div style={{ width: 60, height: 1, background: 'rgba(232,196,122,0.5)', marginRight: 24 }} />
              INTUITIVE CONCEPT
              <div style={{ width: 60, height: 1, background: 'rgba(232,196,122,0.5)', marginLeft: 16 }} />
            </div>
            <div style={{ marginTop: 60, fontFamily: 'Cinzel', fontSize: 40, letterSpacing: 10, color: 'rgba(243,232,255,0.85)' }}>
              NÚMERO DE VIDA
            </div>
          </div>

          {/* Miolo: número + arquétipo + frase (a frase é o destaque) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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
            {arquetipo && (
              <div style={{ marginTop: 18, fontFamily: 'Cinzel', fontSize: 42, letterSpacing: 3, color: 'rgba(232,196,122,0.9)' }}>
                {`${numero} · ${arquetipo}`}
              </div>
            )}
            <div style={{ width: 120, height: 2, background: 'rgba(232,196,122,0.6)', marginTop: 44, marginBottom: 40 }} />
            <div
              style={{
                display: 'flex',
                textAlign: 'center',
                fontFamily: 'EB Garamond',
                fontStyle: 'italic',
                fontSize: 99,
                lineHeight: 1.12,
                color: '#f6ecff',
              }}
            >
              “{frase}”
            </div>
          </div>

          {/* Faixa vazia pro sticker de link */}
          <div style={{ display: 'flex', height: FAIXA_STICKER, flexShrink: 0 }} />

          {/* Rodapé */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'EB Garamond', fontWeight: 600, fontSize: 42, color: 'rgba(243,232,255,0.8)' }}>
              Descubra o seu:
            </div>
            <div style={{ marginTop: 6, fontFamily: 'Cinzel', fontSize: 38, letterSpacing: 2, color: GOLD }}>
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
        { name: 'EB Garamond', data: garamondItalic, weight: 500, style: 'italic' },
        { name: 'EB Garamond', data: garamond, weight: 600, style: 'normal' },
      ],
      // O conteúdo só muda quando o manual é pago, e aí a URL muda (v=p).
      // Ainda assim, cache de 1 dia e não "immutable": se a Síntese for
      // regenerada, o card se atualiza sozinho.
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
    }
  );
}
