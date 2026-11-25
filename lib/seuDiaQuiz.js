// lib/seuDiaQuiz.js — "Quero receber meu dia às 7h por e-mail" na etapa 4 do
// quiz. Marcado (vem marcado), o gerar-analise cria o perfil do Seu Dia com os
// dados do quiz e começa o teste de 7 dias, sem a pessoa passar pelo login.
// O e-mail das 7h vai pra quem tem verificado_em OU cadastro_quiz_em
// (migração 0027) e o link dele já entra logado (token "dia", 3 dias; ver
// tokenLinkDia em lib/seuDiaServidor.js).
//
// Regras:
//   - Perfil novo: dados do quiz (primeiro nome, data, hora, cidade do
//     autocomplete; texto livre fica sem cidade = Brasília) + teste_inicio.
//   - Perfil que já existe: NÃO troca os dados de nascimento (pode ser de
//     outra pessoa usando o mesmo e-mail; a Minha Área pergunta "Esta é
//     você?"). Só preenche se estiverem vazios. Não recomeça um teste que já
//     começou. Marcar o checkbox de novo religa o e-mail das 7h.
// Puro, menos `cadastrarSeuDiaDoQuiz` (Supabase injetado nos testes).

/** Primeiro nome com só a 1ª letra maiúscula, até 60 caracteres. */
function primeiroNome(nome) {
  const p = String(nome || '').trim().split(/\s+/)[0] || '';
  return p ? (p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).slice(0, 60) : null;
}

/**
 * Dados de nascimento do quiz no formato de seu_dia_perfis.
 * @param {{ nome: string, data: string, hora?: string|null, municipio?: { ibge: number, lat: number, lon: number, tz: string } | null, localTexto?: string|null }} q
 */
export function dadosDoQuiz({ nome, data, hora = null, municipio = null, localTexto = null }) {
  const [cidadeNome, uf] = String(localTexto || '').split(',').map((x) => x.trim());
  return {
    nome: primeiroNome(nome),
    data_nascimento: data,
    hora_nascimento: /^([01]\d|2[0-3]):[0-5]\d$/.test(hora || '') ? hora : null,
    cidade_nome: municipio ? (cidadeNome || null) : null,
    cidade_uf: municipio && /^[A-Za-z]{2}$/.test(uf || '') ? uf.toUpperCase() : null,
    municipio_ibge: municipio?.ibge ?? null,
    latitude: municipio?.lat ?? null,
    longitude: municipio?.lon ?? null,
    fuso_iana: municipio?.tz ?? null,
  };
}

/**
 * O que gravar: { inserir } pra perfil novo, { atualizar } pra perfil que existe.
 * @param {object|null} existente  linha atual (email, data_nascimento, teste_inicio) ou null
 */
export function planoDoCadastro({ email, dados, existente, testeAtivo, agora = Date.now() }) {
  const quando = new Date(agora).toISOString();
  if (!existente) {
    return { inserir: { email, ...dados, teste_inicio: testeAtivo ? quando : null } };
  }
  const atualizar = {};
  if (!existente.data_nascimento) Object.assign(atualizar, dados);
  if (!existente.teste_inicio && testeAtivo) atualizar.teste_inicio = quando;
  return { atualizar };
}

/**
 * Cria/atualiza o perfil do Seu Dia a partir do quiz. Best effort: devolve
 * { ok, motivo } e nunca lança (o quiz não pode falhar por causa disso).
 * A preferência (email_diario, 0022) e o consentimento do quiz
 * (cadastro_quiz_em, 0027) vão num update separado, pra criar o perfil mesmo
 * sem essas migrações.
 */
export async function cadastrarSeuDiaDoQuiz({ sb, email, dados, testeAtivo, agora = Date.now() }) {
  try {
    const { data: existente, error: eLer } = await sb.from('seu_dia_perfis')
      .select('email, data_nascimento, teste_inicio').eq('email', email).maybeSingle();
    if (eLer) return { ok: false, motivo: eLer.message };
    const plano = planoDoCadastro({ email, dados, existente, testeAtivo, agora });
    if (plano.inserir) {
      const { error } = await sb.from('seu_dia_perfis').insert(plano.inserir);
      if (error) return { ok: false, motivo: error.message };
    } else if (Object.keys(plano.atualizar).length) {
      const { error } = await sb.from('seu_dia_perfis').update(plano.atualizar).eq('email', email);
      if (error) return { ok: false, motivo: error.message };
    }
    const { error: eConsent } = await sb.from('seu_dia_perfis')
      .update({ email_diario: true, cadastro_quiz_em: new Date(agora).toISOString() }).eq('email', email);
    const comecouTeste = !!(plano.inserir?.teste_inicio || plano.atualizar?.teste_inicio);
    if (eConsent) return { ok: true, novo: !!plano.inserir, comecouTeste, aviso: `consentimento não gravado (migrações 0022/0027?): ${eConsent.message}` };
    return { ok: true, novo: !!plano.inserir, comecouTeste };
  } catch (e) {
    return { ok: false, motivo: String(e?.message || e) };
  }
}
