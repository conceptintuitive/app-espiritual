// Prévia da automação social: story, carrossel, Reels e legenda de hoje e dos
// próximos dias, mais exemplos da resposta automática a comentários. Não
// posta nada.
//   GET /api/social/previa?secret=CRON_SECRET[&inicio=AAAA-MM-DD][&dias=8]
// Mostra o conteúdo já gerado (social_conteudos, da IA); dia ainda não gerado
// aparece com o texto de reserva, andando as séries a partir do banco. As
// imagens usam as mesmas URLs assinadas que as redes vão baixar.

import { createClient } from '@supabase/supabase-js';
import {
  hojeBrasilia, dataValida, energiaDoDia, montarLegenda, caminhoImagem, redesLigadas, chaveLigada, diaDaSemana, dataCurta, TEMAS,
} from '@/lib/social';
import { planoDaPrevia, limiteRespostasPorHora } from '@/lib/socialServidor';
import { modoInstagram } from '@/lib/instagram';
import { decidirResposta } from '@/lib/socialComentarios';
import { trilhaDoDia } from '@/lib/socialReels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Comentários de exemplo (inventados, só pra mostrar o comportamento).
const EXEMPLOS = [
  { id: 'ex1', texto: 'Nasci em 14/07/1990!' },
  { id: 'ex2', texto: '12.03.85 aqui' },
  { id: 'ex3', texto: 'a minha é 3 de outubro de 1988' },
  { id: 'ex4', texto: '29/02/1996 e a do meu marido 05/06/1994' },
  { id: 'ex5', texto: 'isso é golpe, 01/01/1990' },
  { id: 'ex6', texto: 'amei esse post' },
  { id: 'ex7', texto: '31/02/1990' },
];

// Uma rodada da revisão (ou a lista de rodadas) em uma linha.
function textoRevisao(r) {
  if (!r) return '';
  const rodadas = [].concat(r);
  const uma = (x) => {
    if (typeof x === 'string') return x;
    if (x.aprovado === true) return 'aprovado';
    const p = (x.problemas || []).join('; ');
    return `reescrito${p ? ` (${p})` : ''}`;
  };
  if (rodadas.length === 1 && rodadas[0]?.aprovado === true) return 'Revisão da IA: aprovado de primeira';
  return `Revisão da IA: ${rodadas.map((x, k) => `${rodadas.length > 1 ? `${k + 1}ª rodada ` : ''}${uma(x)}`).join(' → ')}`;
}

function blocoComentarios() {
  const linhas = EXEMPLOS.map((c, k) => {
    const d = decidirResposta({ id: `exemplo-${k}`, texto: c.texto });
    return `<tr><td>${esc(c.texto)}</td><td>${d.responder ? `<strong>Responde (modelo ${d.modelo + 1}):</strong> ${esc(d.texto)}` : `Não responde: ${esc(d.motivo)}`}</td></tr>`;
  }).join('');
  return `<section class="dia"><h2>Resposta automática a comentários <small>${chaveLigada(process.env.SOCIAL_RESPOSTAS) ? `ligada · até ${limiteRespostasPorHora()} por hora` : 'desligada (SOCIAL_RESPOSTAS)'} · guarda só o id do comentário</small></h2>
  <table><thead><tr><th>Comentário de exemplo</th><th>O que acontece</th></tr></thead><tbody>${linhas}</tbody></table></section>`;
}

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
  const reelsLigado = chaveLigada(process.env.SOCIAL_REELS);
  const img = (d, formato) => esc(caminhoImagem({ data: d.data, formato, indice: d.indice, v: d.versao }, segredo));

  const blocos = dias.map((d) => {
    const e = energiaDoDia(d.data, d.conteudo.story);
    const c = d.conteudo;
    const telas = c.telas.map((_, k) => `<img src="${img(d, `c${k + 1}`)}" width="288" height="360" alt="Tela ${k + 1}" loading="lazy">`).join('');
    const quadros = ['r1', 'r2', 'r3'].map((r) => `<div class="quadro"><img src="${img(d, 'ceu')}" width="180" height="320" alt="" loading="lazy"><img class="sobre" src="${img(d, r)}" width="180" height="320" alt="" loading="lazy"></div>`).join('');
    const rev = textoRevisao(d.revisao?.revisao);
    const trilha = trilhaDoDia(d.data);
    return `
    <section class="dia" id="d-${d.data}">
      <h2>${DIAS[diaDaSemana(d.data)]} ${dataCurta(d.data)} · ${esc(TEMAS[d.tema].rotulo)} <small>${esc(d.dados.item)}${d.dados.posicao ? ` · item ${d.dados.posicao} de ${d.dados.total}` : ''} · texto: ${esc(d.fonte)}${rev ? ` · ${esc(rev)}` : ''}${d.aprovacao?.aprovado ? ' · TikTok: aprovado pra Direct Post' : ''}</small></h2>
      <h3>Carrossel (Instagram + TikTok)</h3>
      <div class="fila">${telas}</div>
      <div class="artes">
        <figure><img src="${img(d, 'story')}" width="270" height="480" alt="Story" loading="lazy"><figcaption>Story · Instagram</figcaption></figure>
        <figure><div class="fila reels">${quadros}</div><figcaption>Reels (9s) ${reelsLigado ? '' : '· desligado (SOCIAL_REELS)'}: céu com zoom lento; gancho 0–4s, virada 4,6–7s, chamada 7,3–9s · trilha: ${trilha ? esc(trilha.split('/').pop()) : 'nenhuma (SOCIAL_TRILHAS)'}</figcaption></figure>
        <div class="textos">
          <h3>Legenda (carrossel e Reels)</h3>
          <pre>${esc(montarLegenda(c.legenda))}</pre>
          <h3>Story</h3>
          <pre>${esc([e.titulo, e.frase, ...e.linhas.map((l) => `${l.rotulo}: ${l.valor} — ${l.nota}`)].join('\n'))}</pre>
        </div>
      </div>
    </section>`;
  }).join('');

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Prévia dos posts</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #07040d; color: #f3e9da; font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 1280px; margin: 0 auto; padding: 24px 16px 80px; }
  h1 { font-weight: 400; font-size: 28px; margin: 0 0 6px; color: #f2c77b; }
  .meta { color: #b9a9c9; margin: 0 0 4px; font-size: 14px; }
  .aviso { color: #ffdca0; border: 1px solid rgba(242,199,123,.3); padding: 10px 12px; border-radius: 10px; }
  .dia { border-top: 1px solid rgba(242,199,123,.2); padding: 22px 0; }
  h2 { font-weight: 400; font-size: 22px; margin: 0 0 14px; }
  h2 small { display: block; color: #b9a9c9; font-size: 13px; letter-spacing: .04em; }
  h3 { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #f2c77b; margin: 0 0 8px; font-weight: 500; }
  .fila { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px; }
  .fila img { flex: 0 0 auto; border-radius: 8px; background: #140c22; }
  .quadro { position: relative; flex: 0 0 auto; width: 180px; height: 320px; }
  .quadro img { position: absolute; inset: 0; border-radius: 8px; }
  .quadro .sobre { background: transparent; }
  .artes { display: flex; flex-wrap: wrap; gap: 18px; align-items: flex-start; }
  figure { margin: 0; } figure > img { display: block; border-radius: 8px; max-width: 100%; height: auto; background: #140c22; }
  figcaption { color: #b9a9c9; font-size: 12px; margin-top: 6px; max-width: 560px; }
  .textos { flex: 1 1 320px; min-width: 0; }
  pre { white-space: pre-wrap; word-break: break-word; background: rgba(255,255,255,.04); padding: 12px; border-radius: 8px; margin: 0 0 16px; font: 13px/1.5 ui-monospace, monospace; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  td, th { text-align: left; vertical-align: top; padding: 8px 10px; border-bottom: 1px solid rgba(242,199,123,.15); }
  th { color: #f2c77b; font-weight: 500; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
</style></head><body><main>
<h1>Prévia dos posts automáticos</h1>
<p class="meta">${dataCurta(dias[0].data)} a ${dataCurta(dias[dias.length - 1].data)} · nada aqui é postado.</p>
<p class="meta">Automação: ${redes.length ? `ligada (${redes.join(' + ')})` : 'desligada (SOCIAL_AUTOMACAO)'} · Reels: ${reelsLigado ? 'ligado' : 'desligado'} · Instagram: ${process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID ? `configurado (${modoInstagram() === 'facebook' ? 'graph.facebook.com' : 'graph.instagram.com'})` : 'falta token/ID'} · TikTok: ${chaveLigada(process.env.TIKTOK_DIRECT_POST) ? 'Direct Post nos dias aprovados, rascunho nos outros' : 'rascunhos'}</p>
${aviso ? `<p class="aviso">${esc(aviso)}</p>` : ''}
${blocoComentarios()}
${blocos}
</main></body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
