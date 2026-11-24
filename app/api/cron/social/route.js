// Post automático do dia no Instagram e no TikTok.
//   GET /api/cron/social?secret=CRON_SECRET   (ou Authorization: Bearer CRON_SECRET)
// Chamado pelo cron-job.org às 7h de Brasília. Faz (lib/socialServidor.js → postarDia):
//   - story "Energia de hoje" no Instagram;
//   - carrossel do tema do dia no Instagram e as mesmas fotos no TikTok
//     (rascunho, ou Direct Post se aprovado em /admin/tiktok);
//   - começa o Reels (SOCIAL_REELS=on), terminado aqui ou pelo cron da hora.
// O texto vem de social_conteudos (gerado no domingo pela IA); sem ele, gera na hora.
// Idempotente: no máximo 1 story e 1 post por rede por dia (trava em
// social_posts, migração 0024), mesmo se o cron rodar 2 vezes; erro é tentado
// de novo no próximo disparo do dia (até 3x) e vai por e-mail.
// Responde NA HORA ({ ok: true, agendado: true }) e posta em segundo plano
// com after() (o cron-job.org desiste em 30s; gerar as artes e esperar o
// Instagram processar passa disso). A trava e o e-mail de erro continuam os
// mesmos, dentro do postarDia; erro inesperado fora dele também vira e-mail.
// ?esperar=1 roda tudo antes de responder e devolve o resumo (pra testar à mão
// no navegador; não use no cron).
// Liga/desliga: SOCIAL_AUTOMACAO = off | on | instagram | tiktok
// (ver lib/social.js → redesLigadas). Nada de query string pra escolher a data:
// sempre o dia de hoje em Brasília.

import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hojeBrasilia, redesLigadas } from '@/lib/social';
import { postarDia, avisarErro } from '@/lib/socialServidor';
import { getBaseUrl } from '@/lib/baseUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// O after() roda dentro do mesmo limite da function. Pior caso da postagem:
// 2 artes (~1–5s cada a frio) + 2 containers do Instagram esperando até 40s
// cada + TikTok ≈ 100s. 300s dá folga de sobra (mesmo teto do
// gerar-manual-completo).
export const maxDuration = 300;

async function rodar(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const redes = redesLigadas(process.env.SOCIAL_AUTOMACAO);
  if (!redes.length) return NextResponse.json({ ok: true, desligada: true, dica: 'SOCIAL_AUTOMACAO=on liga (ou instagram / tiktok)' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const data = hojeBrasilia();
  const baseUrl = getBaseUrl();

  const postar = async () => {
    const inicio = Date.now();
    try {
      const r = await postarDia({ supabase, data, redes, baseUrl, segredo: cronSecret });
      console.log(`📣 social ${data}: ${r.resultado.filter((x) => x.ok).length} ok, ${r.erros.length} erro(s), ${r.resultado.filter((x) => x.pulado).length} pulado(s), ${Math.round((Date.now() - inicio) / 1000)}s`);
      return r;
    } catch (err) {
      // postarDia já trata o erro de cada post; isto é o que escapar dele.
      const erro = String(err?.message || err).slice(0, 800);
      console.error(`❌ social ${data}: erro geral`, err);
      await avisarErro(data, [{ rede: 'todas', tipo: '-', erro }]);
      return { resultado: [], erros: [{ rede: 'todas', tipo: '-', erro }] };
    }
  };

  if (searchParams.get('esperar') === '1') {
    const r = await postar();
    return NextResponse.json({ ok: r.erros.length === 0, data, redes, ...r }, { status: r.erros.length ? 207 : 200 });
  }

  after(postar);
  return NextResponse.json({ ok: true, agendado: true });
}

export const GET = rodar;
export const POST = rodar;
