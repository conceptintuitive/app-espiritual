import { NextResponse } from 'next/server';
import { admin, emailDaSessao, emailExato } from '@/lib/seuDiaServidor';
import { acessoPorEmail } from '@/lib/assinatura';
import { agruparProdutos } from '@/lib/minhaArea';

export const runtime = 'nodejs';

const COLUNAS = 'id, created_at, nome, email, data_nascimento, payment_status, tier2_payment_status, hd_payment_status, compat_payment_status, presente_de, presente_email';
const COLUNAS_MIN = 'id, created_at, nome, email, data_nascimento, payment_status';

// GET → leituras pagas (Manual, Previsão, HD, Compatibilidade) das análises do
// e-mail logado, incluindo as recebidas de presente. Só com sessão (cookie):
// nunca por e-mail digitado.
export async function GET(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });

  try {
    const sb = admin();
    const padrao = emailExato(email);
    let { data, error } = await sb
      .from('analises')
      .select(COLUNAS)
      .or(`email.ilike.${padrao},presente_email.ilike.${padrao}`)
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) {
      // Coluna de upsell/presente faltando num banco antigo: cai pro mínimo.
      console.error('[seu-dia/produtos]', error.code, error.message);
      ({ data, error } = await sb.from('analises').select(COLUNAS_MIN).ilike('email', padrao).order('created_at', { ascending: false }).limit(40));
      if (error) throw error;
    }

    const [assinatura, { data: perfil }] = await Promise.all([
      acessoPorEmail(sb, email),
      sb.from('seu_dia_perfis').select('data_nascimento').eq('email', email).maybeSingle(),
    ]);

    return NextResponse.json({
      pessoas: agruparProdutos(data || [], { email, assinaturaAtiva: !!assinatura?.ativa, dataNascimentoPerfil: perfil?.data_nascimento || null }),
    });
  } catch (e) {
    console.error('[seu-dia/produtos]', e);
    return NextResponse.json({ error: 'Erro ao carregar' }, { status: 500 });
  }
}
