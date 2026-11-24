// Gera a semana seguinte da automação social (textos da IA + revisão) e guarda
// em social_conteudos. As artes saem desse conteúdo na hora de postar.
//   GET /api/cron/social-semana?secret=CRON_SECRET
// Chamado pelo cron-job.org no domingo (ex.: 10h). Gera de segunda a domingo
// seguintes; dia que já tem conteúdo é pulado, então dá pra chamar 2x (a 2ª
// preenche o que tiver falhado). Responde na hora e gera em segundo plano
// (after); 7 dias em paralelo, ~2 chamadas de IA por dia.
// Opcionais (teste manual): &inicio=AAAA-MM-DD &dias=1..14 &refazer=1 &esperar=1
// Não depende de SOCIAL_AUTOMACAO: gerar não publica nada.

import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hojeBrasilia, proximaSegunda, dataValida } from '@/lib/social';
import { gerarSemana, avisarErro } from '@/lib/socialServidor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function rodar(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const inicio = dataValida(searchParams.get('inicio')) ? searchParams.get('inicio') : proximaSegunda(hojeBrasilia());
  const dias = Math.min(14, Math.max(1, Number(searchParams.get('dias')) || 7));
  const refazer = searchParams.get('refazer') === '1';

  const gerar = async () => {
    const t0 = Date.now();
    try {
      const r = await gerarSemana({ supabase, inicio, dias, refazer });
      const porFonte = r.gerados.reduce((a, g) => ({ ...a, [g.fonte]: (a[g.fonte] || 0) + 1 }), {});
      console.log(`📝 social semana ${inicio}: ${JSON.stringify(porFonte)}, ${r.pulados} pulado(s), ${Math.round((Date.now() - t0) / 1000)}s`);
      return r;
    } catch (err) {
      console.error('❌ social semana:', err);
      await avisarErro(inicio, [{ rede: 'geração', tipo: 'semana', erro: String(err?.message || err).slice(0, 800) }], 'Geração da semana falhou');
      return { erro: String(err?.message || err) };
    }
  };

  if (searchParams.get('esperar') === '1') return NextResponse.json({ inicio, dias, ...(await gerar()) });
  after(gerar);
  return NextResponse.json({ ok: true, agendado: true, inicio, dias });
}

export const GET = rodar;
export const POST = rodar;
