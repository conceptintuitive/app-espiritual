import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { admin } from '@/lib/seuDiaServidor';
import { montarPerfil, leituraDoDia, hojeNoFuso } from '@/lib/seuDia';
import { TITULO_PUSH } from '@/lib/seuDiaTextos';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Aviso das 7h do Seu Dia. Disparado por cron externo (cron-job.org) às 7h de
// Brasília: GET /api/cron/seu-dia-push?secret=CRON_SECRET (ou Bearer).
// Precisa de NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT
// (ex.: mailto:conceptintuitive@gmail.com). Inscrição que o navegador já
// cancelou (404/410) é apagada.
async function handler(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return NextResponse.json({ error: 'VAPID não configurado' }, { status: 503 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:conceptintuitive@gmail.com', pub, priv);

  const sb = admin();
  const { data: subs, error } = await sb.from('seu_dia_push').select('endpoint, p256dh, auth, email');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs?.length) return NextResponse.json({ enviados: 0 });

  const emails = [...new Set(subs.map((s) => s.email))];
  const { data: perfis } = await sb
    .from('seu_dia_perfis')
    .select('email, nome, data_nascimento, hora_nascimento, longitude, fuso_iana')
    .in('email', emails)
    .not('data_nascimento', 'is', null);

  const payloadPorEmail = new Map();
  for (const p of perfis || []) {
    try {
      const tz = p.fuso_iana || 'America/Sao_Paulo';
      const perfil = montarPerfil({ dataNascimento: p.data_nascimento, hora: p.hora_nascimento, tz, lon: p.longitude });
      const l = leituraDoDia(perfil, hojeNoFuso(tz));
      payloadPorEmail.set(p.email, JSON.stringify({ title: TITULO_PUSH(p.nome, l.titulo), body: l.frase, url: '/seu-dia?aba=hoje' }));
    } catch (e) {
      console.error('[cron/seu-dia-push] perfil', p.email, e);
    }
  }

  let enviados = 0;
  const removidos = [];
  const fila = subs.filter((s) => payloadPorEmail.has(s.email));
  for (let i = 0; i < fila.length; i += 25) {
    const lote = fila.slice(i, i + 25);
    const res = await Promise.allSettled(lote.map((s) => webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      payloadPorEmail.get(s.email),
      { TTL: 6 * 3600 },
    )));
    res.forEach((r, j) => {
      if (r.status === 'fulfilled') enviados += 1;
      else if ([404, 410].includes(r.reason?.statusCode)) removidos.push(lote[j].endpoint);
    });
  }
  if (removidos.length) await sb.from('seu_dia_push').delete().in('endpoint', removidos);

  return NextResponse.json({ enviados, removidos: removidos.length, total: fila.length });
}

export const GET = handler;
export const POST = handler;
