import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { idValido, dadosDoCard, fraseDoPontoCego, fraseDoMantra, tipoCardValido, SITE_HOST } from '@/lib/cardCompartilhar';
import { generateManual } from '@/lib/manualgenerator';

// Node (não edge): a rota importa o manualgenerator pra montar a frase e o
// arquétipo, e ele é grande demais pra valer a pena num bundle edge.
export const runtime = 'nodejs';

// Card 1080x1920 pro story. Recebe ?id=<uuid da análise>&tipo=<numero|
// ponto_cego|mantra>. Todo texto é montado no servidor — nada da URL vira
// texto na imagem, e a imagem não carrega nome, data de nascimento nem
// nenhum outro dado pessoal, em nenhum dos 3 tipos.

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

const KICKER_POR_TIPO = {
  ponto_cego: 'SEU PONTO CEGO',
  mantra: 'SEU MANTRA PESSOAL',
};

// Select amplo o bastante pra rodar generateManual() quando tipo exige
// Ponto Cego/Mantra — pros três tipos de card, de propósito: evita duas
// rotas de busca, e o custo extra de colunas é irrelevante (rota já tem
// cache de 1 dia no CDN).
async function buscarAnalise(id) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase não configurado');
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from('analises')
    .select(`
      nome, signo, numero_vida, data_nascimento, payment_status, sintese_gerada,
      objetivo_principal, relacao_status, trabalho_status, local_nascimento,
      diagnostico_gerado, amor_gerado, tipo_pessoa_gerado, plano7_gerado,
      signo_lua, signo_venus, signo_marte, signo_nodo, signo_mercurio, signo_ascendente,
      ano_pessoal, numero_alma, numero_expressao,
      arquetipos_gerado, ponto_cego_gerado, bloqueios_gerado, dinheiro_gerado,
      rituais_gerado, objetivo_gerado, leitura_gerada, calendario_gerado,
      fechamento_gerado, carta_tarot, carta_tarot_interpretacao
    `)
    .eq('id', id)
    .maybeSingle();
  return data;
}

function paramsDoManual(row) {
  return {
    nome: row.nome,
    signo: row.signo,
    numeroVida: row.numero_vida,
    objetivoPrincipal: row.objetivo_principal,
    relacaoStatus: row.relacao_status,
    trabalhoStatus: row.trabalho_status,
    local: row.local_nascimento,
    dataNascimentoISO: row.data_nascimento,
    diagnosticoGerado: row.diagnostico_gerado || null,
    amorGerado: row.amor_gerado || null,
    tipoPessoaGerado: row.tipo_pessoa_gerado || null,
    plano7Gerado: row.plano7_gerado || null,
    signoLua: row.signo_lua || null,
    signoVenus: row.signo_venus || null,
    signoMarte: row.signo_marte || null,
    signoNodo: row.signo_nodo || null,
    signoMercurio: row.signo_mercurio || null,
    signoAscendente: row.signo_ascendente || null,
    anoPessoal: row.ano_pessoal ?? null,
    numeroAlma: row.numero_alma ?? null,
    numeroExpressao: row.numero_expressao ?? null,
    arquetiposGerado: row.arquetipos_gerado || null,
    pontoCegoGerado: row.ponto_cego_gerado || null,
    bloqueiosGerado: row.bloqueios_gerado || null,
    dinheiroGerado: row.dinheiro_gerado || null,
    rituaisGerado: row.rituais_gerado || null,
    objetivoGerado: row.objetivo_gerado || null,
    leituraGerada: row.leitura_gerada || null,
    calendarioGerado: row.calendario_gerado || null,
    fechamentoGerado: row.fechamento_gerado || null,
    sinteseGerada: row.sintese_gerada || null,
    cartaTarot: row.carta_tarot || null,
    cartaTarotInterpretacao: row.carta_tarot_interpretacao || null,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const tipo = tipoCardValido(searchParams.get('tipo'));
  if (!idValido(id)) {
    return new Response('Parâmetro id inválido', { status: 400 });
  }

  let row;
  try {
    row = await buscarAnalise(id);
  } catch (e) {
    console.error('[card] falhou ao buscar análise:', e?.message);
    return new Response('Erro ao gerar card', { status: 500 });
  }
  if (!row) return new Response('Análise não encontrada', { status: 404 });

  const firstName = String(row?.nome || '').trim().split(/\s+/)[0] || '';
  let numero = null;
  let arquetipo = null;
  let frase = null;

  if (tipo === 'numero') {
    const card = dadosDoCard(row);
    if (!card) return new Response('Análise não encontrada', { status: 404 });
    ({ numero, arquetipo, frase } = card);
  } else {
    // Ponto Cego/Mantra só existem no manual completo — card não compra
    // sozinho, por isso não checa payment_status aqui (quem gerou o link já
    // passou pela tela paga; se a análise nem existe, cai no 404 acima).
    let manual;
    try {
      manual = generateManual(paramsDoManual(row));
    } catch (e) {
      console.error('[card] falhou ao gerar manual:', e?.message);
      return new Response('Erro ao gerar card', { status: 500 });
    }
    frase = tipo === 'mantra'
      ? fraseDoMantra({ manual })
      : fraseDoPontoCego({ manual, firstName });
    if (!frase) {
      // Mantra sem fechamento_gerado: não existe fallback estático pra ele
      // (ver nota em lib/cardCompartilhar.js) — melhor 404 do que inventar.
      return new Response('Conteúdo ainda não disponível pra esse card', { status: 404 });
    }
  }

  const [cinzel, garamondItalic, garamond] = await fontes;

  // Número mestre (11/22/33) tem 2 dígitos — fonte menor pra não estourar.
  const tamanhoNumero = numero > 9 ? 300 : 390;
  const kicker = KICKER_POR_TIPO[tipo];

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
            {tipo === 'numero' && (
              <div style={{ marginTop: 60, fontFamily: 'Cinzel', fontSize: 40, letterSpacing: 10, color: 'rgba(243,232,255,0.85)' }}>
                NÚMERO DE VIDA
              </div>
            )}
          </div>

          {/* Miolo */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tipo === 'numero' ? (
              // Satori (o renderizador do next/og) não lida bem com <>...</>
              // dentro de um container flex quando há mais de um filho — o
              // grupo inteiro perde o layout (some ou desalinha). Por isso
              // cada ramo do ternário vira uma <div> de verdade com seu
              // próprio display:flex, nunca um Fragment.
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', textAlign: 'center', fontFamily: 'Cinzel', fontSize: 44, letterSpacing: 6, color: GOLD }}>
                  {kicker}
                </div>
                <div style={{ width: 120, height: 2, background: 'rgba(232,196,122,0.6)', marginTop: 40, marginBottom: 44 }} />
                <div
                  style={{
                    display: 'flex',
                    textAlign: 'center',
                    fontFamily: 'EB Garamond',
                    fontStyle: 'italic',
                    fontSize: 84,
                    lineHeight: 1.25,
                    color: '#f6ecff',
                  }}
                >
                  “{frase}”
                </div>
              </div>
            )}
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
