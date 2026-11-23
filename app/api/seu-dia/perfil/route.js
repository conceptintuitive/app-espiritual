import { NextResponse } from 'next/server';
import { admin, emailDaSessao, marcarConfirmado, perfilParaFront, validarDados } from '@/lib/seuDiaServidor';

export const runtime = 'nodejs';

// GET → perfil + nível de acesso de quem está logado (401 se não está).
export async function GET(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });
  try {
    return NextResponse.json({ logado: true, perfil: await perfilParaFront(admin(), email) });
  } catch (e) {
    console.error('[seu-dia/perfil GET]', e);
    return NextResponse.json({ error: 'Erro ao carregar' }, { status: 500 });
  }
}

// POST { nome, dataNascimento, hora, cidade } → salva os dados de nascimento.
// A 1ª vez que salva começa o teste de 7 dias do Seu Dia Completo. Salvar
// também confirma o perfil (perfil_confirmado_em).
export async function POST(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });

  let dados;
  try {
    dados = validarDados(await request.json());
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }
  if (dados.erro) return NextResponse.json({ error: dados.erro }, { status: 400 });

  try {
    const sb = admin();
    const { data: atual } = await sb.from('seu_dia_perfis').select('teste_inicio').eq('email', email).maybeSingle();
    const { cidade } = dados;
    const { error } = await sb.from('seu_dia_perfis').upsert({
      email,
      nome: dados.nome,
      data_nascimento: dados.dataNascimento,
      hora_nascimento: dados.hora,
      cidade_nome: cidade?.nome ?? null,
      cidade_uf: cidade?.uf ?? null,
      municipio_ibge: cidade?.ibge ?? null,
      latitude: cidade?.lat ?? null,
      longitude: cidade?.lon ?? null,
      fuso_iana: cidade?.tz ?? null,
      teste_inicio: atual?.teste_inicio ?? new Date().toISOString(),
    }, { onConflict: 'email' });
    if (error) throw error;
    // Quem salvou os próprios dados já conferiu: não precisa ver "Esta é você?".
    // Update separado e best effort (migração 0021 opcional).
    await marcarConfirmado(sb, email);
    return NextResponse.json({ logado: true, perfil: await perfilParaFront(sb, email) });
  } catch (e) {
    console.error('[seu-dia/perfil POST]', e);
    return NextResponse.json({ error: 'Não conseguimos salvar agora.' }, { status: 500 });
  }
}
