// Prévia da automação do Instagram/TikTok: as artes e as legendas de hoje e
// dos próximos 7 dias, sem postar nada.
//   GET /api/social/previa?secret=CRON_SECRET[&inicio=AAAA-MM-DD][&dias=8]
// As séries começam de onde o banco parou (social_series); sem a migração
// 0024, começam do primeiro item. As imagens usam as mesmas URLs assinadas
// que o Instagram e o TikTok vão baixar.

import { createClient } from '@supabase/supabase-js';
import {
  hojeBrasilia, dataValida, energiaDoDia, postDoDia, montarLegenda, caminhoImagem, redesLigadas, diaDaSemana, dataCurta,
} from '@/lib/social';
import { planoDaPrevia } from '@/lib/socialServidor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const NOME_TEMA = {
  numero: 'Número de vida (série)', ponto_cego: 'Ponto cego do signo (série)', anjo: 'Anjo da guarda (série)',
  animal: 'Animal chinês (série)', selo: 'Selo do Kin (série)', comenta: '"Comenta sua data de nascimento"', semana: 'A energia da semana',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const segredo = process.env.CRON_SECRET;
  if (!segredo || searchParams.get('secret') !== segredo) return new Response('Não autorizado', { status: 401 });

  const inicio = dataValida(searchParams.get('inicio')) ? searchParams.get('inicio') : hojeBrasilia();
  const n = Math.min(15, Math.max(1, Number(searchParams.get('dias')) || 8));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  const { dias, aviso } = await planoDaPrevia(supabase, inicio, n);

  const redes = redesLigadas(process.env.SOCIAL_AUTOMACAO);
  const blocos = dias.map((d) => {
    const e = energiaDoDia(d.data);
    const p = d.tema ? postDoDia(d.data, d.indice ?? 0) : null;
    const story = caminhoImagem({ data: d.data, formato: 'story' }, segredo);
    const feed = p ? caminhoImagem({ data: d.data, formato: 'feed', indice: d.indice }, segredo) : null;
    const serie = p?.serie ? ` · item ${p.posicao} de ${p.total}` : '';
    return `
    <section class="dia" id="d-${d.data}">
      <h2>${DIAS[diaDaSemana(d.data)]} ${dataCurta(d.data)} <small>${d.tema ? esc(NOME_TEMA[d.tema]) + esc(serie) : 'sem post automático no feed (você posta à mão)'}</small></h2>
      <div class="artes">
        <figure><img src="${esc(story)}" width="270" height="480" alt="Story ${d.data}" loading="lazy"><figcaption>Story · Instagram</figcaption></figure>
        ${feed ? `<figure><img src="${esc(feed)}" width="384" height="480" alt="Feed ${d.data}" loading="lazy"><figcaption>Feed · Instagram + rascunho do TikTok</figcaption></figure>` : ''}
        <div class="textos">
          <h3>Story</h3>
          <pre>${esc([e.kicker, e.titulo, e.frase, ...e.linhas.map((l) => `${l.rotulo}: ${l.valor} — ${l.nota}`), e.cta].join('\n'))}</pre>
          ${p ? `<h3>Legenda do feed</h3><pre>${esc(montarLegenda(p.legenda))}</pre>` : ''}
        </div>
      </div>
    </section>`;
  }).join('');

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Prévia dos posts</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #07040d; color: #f3e9da; font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 1200px; margin: 0 auto; padding: 24px 16px 80px; }
  h1 { font-weight: 400; font-size: 28px; margin: 0 0 6px; color: #f2c77b; }
  .meta { color: #b9a9c9; margin: 0 0 4px; font-size: 14px; }
  .aviso { color: #ffdca0; border: 1px solid rgba(242,199,123,.3); padding: 10px 12px; border-radius: 10px; }
  .dia { border-top: 1px solid rgba(242,199,123,.2); padding: 22px 0; }
  h2 { font-weight: 400; font-size: 22px; margin: 0 0 14px; }
  h2 small { display: block; color: #b9a9c9; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; }
  .artes { display: flex; flex-wrap: wrap; gap: 18px; align-items: flex-start; }
  figure { margin: 0; } figure img { display: block; border-radius: 8px; max-width: 100%; height: auto; background: #140c22; }
  figcaption { color: #b9a9c9; font-size: 12px; margin-top: 6px; }
  .textos { flex: 1 1 320px; min-width: 0; }
  h3 { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #f2c77b; margin: 0 0 6px; font-weight: 500; }
  pre { white-space: pre-wrap; word-break: break-word; background: rgba(255,255,255,.04); padding: 12px; border-radius: 8px; margin: 0 0 16px; font: 13px/1.5 ui-monospace, monospace; }
</style></head><body><main>
<h1>Prévia dos posts automáticos</h1>
<p class="meta">${dataCurta(dias[0].data)} a ${dataCurta(dias[dias.length - 1].data)} · nada aqui é postado.</p>
<p class="meta">Automação: ${redes.length ? `ligada (${redes.join(' + ')})` : 'desligada (SOCIAL_AUTOMACAO)'} · Instagram: ${process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID ? 'configurado' : 'falta token/ID'}</p>
${aviso ? `<p class="aviso">${esc(aviso)}</p>` : ''}
${blocos}
</main></body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
