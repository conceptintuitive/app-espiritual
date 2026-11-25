import { NextResponse, after } from 'next/server';
import { TESTE_SEU_DIA_ATIVO } from '@/lib/testeSeuDia';
import { sendMetaStartTrial } from '@/lib/meta';
import { admin, emailDaSessao, gravarEmailDiario, marcarConfirmado, perfilParaFront, validarDados } from '@/lib/seuDiaServidor';
import { gravarUtmNoPerfil } from '@/lib/utmSocialServidor';

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

// POST { nome, dataNascimento, hora, cidade, utm?, meta? } → salva os dados de nascimento.
// `meta` = fbc/fbp do navegador (só com aceite de cookies), pro StartTrial.
// O 1º salvamento começa o teste de 7 dias do Seu Dia Completo (de volta em
// nov/2026, sem cartão). `emailDiario` (opcional) grava o checkbox do e-mail das 7h. Salvar
// também confirma o perfil (perfil_confirmado_em).
export async function POST(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });

  let dados;
  let emailDiario;
  let utm = null;
  let meta = null;
  try {
    const body = await request.json();
    if (typeof body?.emailDiario === 'boolean') emailDiario = body.emailDiario;
    utm = body?.utm ?? null;
    meta = body?.meta ?? null;
    dados = validarDados(body);
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
      // 1º salvamento começa o teste de 7 dias do Seu Dia Completo (de volta em nov/2026).
      teste_inicio: atual?.teste_inicio ?? (TESTE_SEU_DIA_ATIVO ? new Date().toISOString() : null),
    }, { onConflict: 'email' });
    if (error) throw error;
    // Quem salvou os próprios dados já conferiu: não precisa ver "Esta é você?".
    // Update separado e best effort (migração 0021 opcional).
    await marcarConfirmado(sb, email);
    // Checkbox "Quero receber meu dia às 7h por e-mail" (migração 0022, best effort).
    if (emailDiario !== undefined) await gravarEmailDiario(sb, email, emailDiario);
    // Começou o teste agora: guarda de onde veio (só se o perfil ainda não tem; 0031, best effort).
    if (!atual?.teste_inicio && utm) {
      const r = await gravarUtmNoPerfil(sb, email, utm);
      if (!r.ok && r.motivo !== 'sem utm') console.error('[seu-dia/perfil] utm:', r.motivo);
    }
    // O teste de 7 dias começou agora: StartTrial pra Meta (Conversions API,
    // 1x por pessoa), depois da resposta pra não atrasar o cadastro.
    if (!atual?.teste_inicio && TESTE_SEU_DIA_ATIVO) {
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      const userAgent = request.headers.get('user-agent') || null;
      after(() => sendMetaStartTrial({ email, clientIp, userAgent, atribuicao: meta, origem: 'minha-area' }));
    }
    return NextResponse.json({ logado: true, perfil: await perfilParaFront(sb, email) });
  } catch (e) {
    console.error('[seu-dia/perfil POST]', e);
    return NextResponse.json({ error: 'Não conseguimos salvar agora.' }, { status: 500 });
  }
}
