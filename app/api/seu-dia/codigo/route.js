import { NextResponse } from 'next/server';
import { emailValido } from '@/lib/emailValidacao';
import { admin, checarCodigo, tokenSessao, COOKIE_SESSAO, OPCOES_COOKIE } from '@/lib/seuDiaServidor';

export const runtime = 'nodejs';

const MENSAGEM = {
  sem: 'Peça um código primeiro.',
  vencido: 'Esse código venceu. Peça um novo.',
  bloqueado: 'Muitas tentativas erradas. Peça um código novo.',
  errado: 'Código errado. Confira no e-mail e tente de novo.',
};

// POST { email, codigo } → confere o código de 6 dígitos e grava o cookie de
// sessão (o mesmo do link). Cada erro conta tentativa; 5 erradas invalidam o
// código. O código vale uma vez só.
export async function POST(request) {
  let email;
  let codigo;
  try {
    const body = await request.json();
    email = String(body?.email || '').trim().toLowerCase();
    codigo = String(body?.codigo || '').replace(/\D/g, '');
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }
  if (!emailValido(email)) return NextResponse.json({ error: 'Confira o e-mail.' }, { status: 400 });

  try {
    const sb = admin();
    const { data: row, error } = await sb
      .from('seu_dia_perfis')
      .select('codigo_hash, codigo_expira, codigo_tentativas, verificado_em')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;

    const r = checarCodigo(row, email, codigo);
    if (r !== 'ok') {
      if (r === 'errado') {
        // Condicionado ao valor lido: duas tentativas ao mesmo tempo não contam como uma.
        await sb.from('seu_dia_perfis')
          .update({ codigo_tentativas: (row.codigo_tentativas || 0) + 1 })
          .eq('email', email)
          .eq('codigo_tentativas', row.codigo_tentativas || 0);
      }
      return NextResponse.json({ error: MENSAGEM[r], motivo: r }, { status: r === 'bloqueado' ? 429 : 400 });
    }

    await sb.from('seu_dia_perfis')
      .update({ codigo_hash: null, codigo_expira: null, codigo_tentativas: 0, ...(row.verificado_em ? {} : { verificado_em: new Date().toISOString() }) })
      .eq('email', email);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_SESSAO, tokenSessao(email), OPCOES_COOKIE);
    return res;
  } catch (e) {
    console.error('[seu-dia/codigo]', e);
    return NextResponse.json({ error: 'Não conseguimos conferir agora. Tente de novo ou use o link do e-mail.' }, { status: 500 });
  }
}
