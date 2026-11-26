// De hora em hora: a partir das 7h, dispara o workflow do Reels no GitHub se o
// Reels do dia ainda não saiu (GITHUB_TOKEN_REELS; lib/githubActions.js);
// termina os Reels que ficaram renderizando/processando,
// responde comentários com data de nascimento (SOCIAL_RESPOSTAS=on) e, a partir
// do disparo das 21h, posta o Story da frase do dia (SOCIAL_FRASE_DO_DIA=on).
//   GET /api/cron/social-hora?secret=CRON_SECRET
// Chamado pelo cron-job.org a cada hora (ex.: no minuto 10). Responde na hora
// e trabalha em segundo plano (after). Limite de respostas por disparo:
// SOCIAL_RESPOSTAS_POR_HORA (padrão 20, máx. 50), com 2,5s entre uma e outra.
// E-mail de erro no máximo 1 vez por dia por assunto (social_alertas).
// &esperar=1 roda antes de responder e devolve o resumo (teste manual).

import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hojeBrasilia, redesLigadas } from '@/lib/social';
import { tarefasDaHora } from '@/lib/socialServidor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function rodar(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  if (!redesLigadas(process.env.SOCIAL_AUTOMACAO).includes('instagram')) {
    return NextResponse.json({ ok: true, desligada: true, dica: 'SOCIAL_AUTOMACAO=on (ou instagram) liga' });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const data = hojeBrasilia();

  const trabalhar = async () => {
    try {
      const r = await tarefasDaHora({ supabase, data });
      // Só números no log: nada de texto, data ou usuário dos comentários.
      console.log(`⏱️ social hora ${data}: reels ${r.reels.resultado.filter((x) => x.ok).length} ok/${r.reels.erros.length} erro(s); workflow ${r.disparo ? (r.disparo.disparado ? 'disparado' : r.disparo.erro ? 'erro no disparo' : r.disparo.motivo) : '-'}; comentários ${r.comentarios ? `${r.comentarios.respondidas} respondido(s), ${r.comentarios.erros.length} erro(s)` : 'desligado'}; frase ${r.frase ? (r.frase.ok ? 'postada' : r.frase.pulado || 'erro') : '-'}`);
      return r;
    } catch (err) {
      console.error('❌ social hora:', err?.message || err);
      return { erro: String(err?.message || err) };
    }
  };

  if (searchParams.get('esperar') === '1') return NextResponse.json({ data, ...(await trabalhar()) });
  after(trabalhar);
  return NextResponse.json({ ok: true, agendado: true });
}

export const GET = rodar;
export const POST = rodar;
