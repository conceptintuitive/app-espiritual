// lib/minhaArea.js — monta a lista de leituras pagas da Minha Área a partir das
// análises do e-mail logado. Puro (sem banco): a rota /api/seu-dia/produtos
// busca as linhas e chama `agruparProdutos`. Testado em tests/minhaArea.test.js.
//
// Regras:
// - Uma pessoa = primeiro nome + data de nascimento. Quem refez o quiz pra si
//   mesma aparece uma vez só: vale a análise com Manual pago; sem pago, a que
//   tem algum extra pago; senão, a mais recente.
// - Análise recebida de presente (presente_email = e-mail logado) também entra.
// - Previsão/HD/Compatibilidade abrem inteiras se foram pagas ou se há
//   assinatura ativa (mesma regra das páginas); Compatibilidade também é grátis
//   pra quem comprou o Manual. Senão, abrem na parte grátis.

const pago = (v) => v === 'paid';
const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || '';
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function prioridade(r) {
  if (pago(r.payment_status)) return 3;
  if (pago(r.tier2_payment_status) || pago(r.hd_payment_status) || pago(r.compat_payment_status)) return 2;
  return 1;
}

/**
 * @param {Array<object>} rows linhas de `analises`
 * @param {{ email: string, assinaturaAtiva?: boolean, dataNascimentoPerfil?: string|null }} ctx
 */
export function agruparProdutos(rows, { email, assinaturaAtiva = false, dataNascimentoPerfil = null }) {
  const eu = String(email || '').toLowerCase();
  const porPessoa = new Map();
  for (const r of rows || []) {
    if (!r?.id || !r.data_nascimento) continue;
    const chave = `${norm(primeiroNome(r.nome))}|${r.data_nascimento}`;
    const atual = porPessoa.get(chave);
    if (!atual) { porPessoa.set(chave, r); continue; }
    const pa = prioridade(r);
    const pb = prioridade(atual);
    if (pa > pb || (pa === pb && new Date(r.created_at) > new Date(atual.created_at))) porPessoa.set(chave, r);
  }

  const pessoas = [...porPessoa.values()].map((r) => {
    const manual = pago(r.payment_status);
    const recebido = r.presente_email && String(r.presente_email).toLowerCase() === eu && String(r.email || '').toLowerCase() !== eu;
    const extra = (pagoExtra, rotuloGratis) => (pagoExtra || assinaturaAtiva
      ? { estado: 'aberto', rotulo: pagoExtra ? 'Abrir' : 'Incluso na assinatura' }
      : { estado: 'parcial', rotulo: rotuloGratis });
    return {
      id: r.id,
      nome: primeiroNome(r.nome) || 'Sem nome',
      dataNascimento: r.data_nascimento,
      criadoEm: r.created_at,
      manualPago: manual,
      presenteDe: recebido ? (r.presente_de || 'alguém especial') : null,
      itens: [
        manual
          ? { chave: 'manual', titulo: 'Manual completo', href: `/manual/${r.id}`, estado: 'aberto', rotulo: 'Abrir' }
          : { chave: 'manual', titulo: 'Manual completo', href: `/resultado/${r.id}`, estado: 'travado', rotulo: 'Ver prévia e desbloquear' },
        { chave: 'previsao', titulo: 'Previsão do Ano', href: `/previsao-do-ano/${r.id}`, ...extra(pago(r.tier2_payment_status), 'Mês atual grátis') },
        { chave: 'human-design', titulo: 'Human Design', href: `/human-design/${r.id}`, ...extra(pago(r.hd_payment_status), 'Seu Tipo grátis') },
        {
          chave: 'compat', titulo: 'Compatibilidade Completa', href: `/compatibilidade-completa/${r.id}`,
          ...(manual && !pago(r.compat_payment_status) && !assinaturaAtiva
            ? { estado: 'aberto', rotulo: 'Grátis com o Manual' }
            : extra(pago(r.compat_payment_status), 'Sol × Sol grátis')),
        },
      ],
    };
  });

  // A própria pessoa primeiro (mesma data do perfil), depois as mais recentes.
  return pessoas.sort((a, b) => {
    const ea = a.dataNascimento === dataNascimentoPerfil && !a.presenteDe ? 1 : 0;
    const eb = b.dataNascimento === dataNascimentoPerfil && !b.presenteDe ? 1 : 0;
    if (ea !== eb) return eb - ea;
    return new Date(b.criadoEm) - new Date(a.criadoEm);
  });
}
