import { NextResponse } from 'next/server';
import { admin, emailDaSessao } from '@/lib/seuDiaServidor';
import { cancelarRecorrentes, acessoPorEmail } from '@/lib/assinatura';

export const runtime = 'nodejs';

// POST → cancela a renovação automática (cartão) de quem está logado no Seu
// Dia. O acesso já pago continua até o fim do período.
export async function POST(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });
  try {
    const sb = admin();
    const canceladas = await cancelarRecorrentes(sb, email);
    return NextResponse.json({ canceladas, ...(await acessoPorEmail(sb, email)) });
  } catch (e) {
    console.error('[assinatura/cancelar]', e?.message);
    return NextResponse.json({ error: 'Não conseguimos cancelar agora. Escreva pra conceptintuitive@gmail.com que cancelamos na hora.' }, { status: 500 });
  }
}
