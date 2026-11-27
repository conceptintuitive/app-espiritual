import { createClient } from '@supabase/supabase-js';
import { buildDiagnosticoCtx, buildLeituraCtx } from '@/lib/manualgenerator';
import { gerarDiagnosticoIA, gerarLeituraIA } from '@/lib/ia';
import { comCruzado } from '@/lib/manualCruzadoServidor';
import { acharContrastes, contarCitacoes } from '@/lib/manualEstilo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Rota TEMPORÁRIA (nov/2026) — remover antes do merge do PR dos prompts.
// Mostra lado a lado o Diagnóstico e a Leitura integrada que estão SALVOS na
// análise (antes) e os mesmos gerados AGORA com os prompts novos (depois),
// com o contraste "não é X, é Y" marcado e as citações de sistema contadas.
// Não grava nada no banco. Custa 2 chamadas ao Sonnet.
//
//   GET /api/admin/manual-antes-depois?secret=CRON_SECRET&id=<id da análise>
//   GET /api/admin/manual-antes-depois?secret=CRON_SECRET&email=<e-mail>   (a análise mais recente com Diagnóstico)

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function parse(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return { body: String(v) }; }
}

// Mesmo resumo que a Leitura recebe em app/api/gerar-manual-completo/route.js
// (cópia curta: a rota sai junto com esta cópia).
function resumoAnterior({ sintese, diagnostico }) {
  const tema = diagnostico?.frase_diagnostico || '';
  const corta = (t, n) => (t && t.length > n ? `${t.slice(0, n)}…` : t);
  const contexto = [sintese?.body ? corta(sintese.body, 200) : null, diagnostico?.conflito_central ? corta(diagnostico.conflito_central, 200) : null].filter(Boolean).join(' ');
  const partes = [];
  if (tema) partes.push(`TEMA CENTRAL JÁ USADO em outra seção deste manual (PROIBIDO usar como ângulo principal aqui): "${tema}". Se a primeira ideia que vier for uma variação disso, descarte e escolha um mecanismo psicológico estruturalmente diferente.`);
  if (contexto) partes.push(`Contexto de fundo já coberto (não repetir os mesmos exemplos concretos): "${contexto}"`);
  return partes.join('\n');
}

// Texto com os contrastes marcados.
function marcado(texto) {
  let html = esc(texto);
  for (const t of acharContrastes(texto)) {
    const e = esc(t);
    html = html.split(e).join(`<mark>${e}</mark>`);
  }
  return html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
}

function coluna(titulo, texto) {
  if (!texto) return `<div class="col"><h3>${titulo}</h3><p class="vazio">(não existe na análise)</p></div>`;
  const c = acharContrastes(texto).length;
  const s = contarCitacoes(texto);
  const palavras = String(texto).split(/\s+/).filter(Boolean).length;
  return `<div class="col"><h3>${titulo}</h3><p class="meta">${palavras} palavras · <b class="${c ? 'ruim' : 'bom'}">${c} "não é X, é Y"</b> · ${s} citações de sistema</p><p>${marcado(texto)}</p></div>`;
}

const CAMPOS_DIAG = [['frase_diagnostico', 'Frase do diagnóstico'], ['combinacao', 'Combinação'], ['conflito_central', 'Conflito central'], ['diagnostico_objetivo', 'Diagnóstico do objetivo']];

export async function GET(request) {
  const url = new URL(request.url);
  if (!process.env.CRON_SECRET || url.searchParams.get('secret') !== process.env.CRON_SECRET) {
    return new Response('não autorizado', { status: 401 });
  }
  const id = url.searchParams.get('id');
  const email = url.searchParams.get('email');
  if (!id && !email) return new Response('passe ?id=<análise> ou ?email=<e-mail>', { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  let q = supabase.from('analises').select('*');
  q = id ? q.eq('id', id) : q.ilike('email', email.replace(/[%_\\]/g, (c) => `\\${c}`)).not('diagnostico_gerado', 'is', null).order('created_at', { ascending: false }).limit(1);
  const { data: rows, error } = await q;
  const row = rows?.[0];
  if (error || !row) return new Response(`análise não encontrada${error ? `: ${error.message}` : ''}`, { status: 404 });

  const linha = await comCruzado(supabase, row.id, row);
  const diagAntes = parse(row.diagnostico_gerado);
  const leituraAntes = parse(row.leitura_gerada);

  const diagDepois = await gerarDiagnosticoIA(buildDiagnosticoCtx(linha));
  const leituraDepois = await gerarLeituraIA(buildLeituraCtx({
    ...linha,
    __resumoAnterior: resumoAnterior({ sintese: parse(row.sintese_gerada), diagnostico: diagDepois || diagAntes }),
  }));

  const primeiro = String(row.nome || '').split(' ')[0];
  const blocos = [
    ...CAMPOS_DIAG.map(([k, rotulo]) => `<h2>Diagnóstico · ${rotulo}</h2><div class="par">${coluna('Antes (salvo)', diagAntes?.[k])}${coluna('Depois (prompt novo)', diagDepois?.[k])}</div>`),
    `<h2>Leitura integrada</h2><div class="par">${coluna('Antes (salvo)', leituraAntes?.body)}${coluna('Depois (prompt novo)', leituraDepois?.body)}</div>`,
  ].join('');

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Antes e depois dos prompts</title>
<style>
body{margin:0;background:#07040d;color:#f3e9da;font:16px/1.6 system-ui,sans-serif;padding:24px}
h1{font-weight:400;font-size:28px;margin:0 0 4px}h2{font-weight:500;font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:#ffdca0;margin:40px 0 12px;border-top:1px solid rgba(242,199,123,.2);padding-top:20px}
.par{display:grid;grid-template-columns:1fr;gap:20px}@media(min-width:900px){.par{grid-template-columns:1fr 1fr}}
.col{background:#0e0a17;border:1px solid rgba(242,199,123,.14);border-radius:12px;padding:16px 18px}
h3{margin:0 0 6px;font-size:13px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#b9a9c9}
.meta{font-size:13px;color:#b9a9c9;margin:0 0 10px}.bom{color:#9fe0c0}.ruim{color:#fca5a5}.vazio{color:#b9a9c9}
mark{background:rgba(252,165,165,.25);color:#fff;border-radius:3px;padding:0 2px}p{margin:0 0 12px}
</style></head><body>
<h1>Antes e depois · ${esc(primeiro)}</h1>
<p class="meta">Antes = o texto salvo hoje no Manual. Depois = gerado agora com os prompts novos (nada foi gravado). Vermelho = "não é X, é Y" que o detector achou.${linha.__cruzado ? '' : ' Atenção: sem os outros sistemas (análise sem data válida).'}</p>
${diagDepois ? '' : '<p class="ruim">O Diagnóstico novo não voltou (IA fora do ar ou resposta inválida). Recarregue a página.</p>'}
${blocos}
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
