import { NextResponse } from 'next/server';
import { admin } from '@/lib/seuDiaServidor';
import { analiseDoTokenAvaliacao, RESPOSTAS_AVALIACAO } from '@/lib/avaliacao';
import { primeiroNome } from '@/lib/provaSocial';

export const runtime = 'nodejs';

// POST /api/avaliacao { t, resposta, frase?, autoriza? } — grava a avaliação
// do e-mail de 3 dias (lib/avaliacao.js) em manual_avaliacoes (migração 0027).
// O token do link identifica a análise; só Manual pago avalia. O 1º clique
// manda só a resposta; o formulário da página manda a frase e a autorização
// (campos ausentes não apagam o que já foi salvo). Devolve o primeiro nome e
// o signo, pra página mostrar como o depoimento apareceria.
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, erro: 'pedido' }, { status: 400 }); }

  const analiseId = analiseDoTokenAvaliacao(body?.t);
  if (!analiseId) return NextResponse.json({ ok: false, erro: 'link' }, { status: 400 });
  const resposta = String(body?.resposta || '');
  if (!RESPOSTAS_AVALIACAO[resposta]) return NextResponse.json({ ok: false, erro: 'resposta' }, { status: 400 });

  try {
    const sb = admin();
    const { data: analise } = await sb.from('analises').select('id, nome, signo, payment_status').eq('id', analiseId).maybeSingle();
    if (!analise || analise.payment_status !== 'paid') return NextResponse.json({ ok: false, erro: 'link' }, { status: 404 });

    const linha = { analise_id: analiseId, resposta, atualizado_em: new Date().toISOString() };
    if (typeof body?.frase === 'string') linha.frase = body.frase.replace(/\s+/g, ' ').trim().slice(0, 400) || null;
    if (typeof body?.autoriza === 'boolean') linha.autoriza_publicar = body.autoriza;

    const { error } = await sb.from('manual_avaliacoes').upsert(linha, { onConflict: 'analise_id' });
    if (error) {
      console.error('[avaliacao]', error.code, error.message);
      return NextResponse.json({ ok: false, erro: error.code === '42P01' ? 'indisponivel' : 'banco' }, { status: 503 });
    }
    return NextResponse.json({ ok: true, nome: primeiroNome(analise.nome), signo: analise.signo || null });
  } catch (e) {
    console.error('[avaliacao]', e?.message);
    return NextResponse.json({ ok: false, erro: 'banco' }, { status: 500 });
  }
}
