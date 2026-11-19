import { NextResponse } from 'next/server';
import { admin, emailDaSessao } from '@/lib/seuDiaServidor';
import { acessoPorEmail, emailDaAnalise, liberarManualDoAnual } from '@/lib/assinatura';

export const runtime = 'nodejs';

// POST { analiseId? } → acesso do Intuitive Completo.
// Usa o e-mail da análise (páginas de Previsão, Human Design, Compatibilidade,
// Manual) ou, sem analiseId, o da sessão do Seu Dia. Nunca devolve o e-mail.
// Com analiseId e plano anual ativo, libera o Manual dessa análise na hora
// (idempotente) — devolve manualLiberado: true pra página recarregar.
export async function POST(request) {
  let analiseId = null;
  try {
    analiseId = (await request.json())?.analiseId || null;
  } catch {}

  try {
    const sb = admin();
    const email = analiseId ? await emailDaAnalise(sb, analiseId) : emailDaSessao(request);
    const acesso = await acessoPorEmail(sb, email);
    let manualLiberado = false;
    if (analiseId && email && acesso.incluiManual) {
      manualLiberado = (await liberarManualDoAnual(sb, email, analiseId)).liberado;
    }
    return NextResponse.json({ ...acesso, manualLiberado });
  } catch (e) {
    console.error('[assinatura/status]', e?.message);
    return NextResponse.json({ ativa: false, erro: true });
  }
}
