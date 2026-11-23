// lib/minhaArea.js — monta a lista de leituras pagas da Minha Área a partir das
// análises do e-mail logado. Puro (sem banco): a rota /api/seu-dia/produtos
// busca as linhas e chama `agruparProdutos`. Testado em tests/minhaArea.test.js.
//
// Regras:
// - Uma pessoa = primeiro nome + data de nascimento. Quem refez o quiz pra si
//   mesma aparece uma vez só: vale a análise com Manual pago; sem pago, a que
//   tem algum extra pago; senão, a mais recente.
// - Análise recebida de presente (presente_email = e-mail logado) também entra.
// - "Suas leituras" x "Outras leituras neste e-mail": é sua quem tem o mesmo
//   primeiro nome (sem acento/caixa) E a mesma data de nascimento do perfil.
//   Sem data no perfil, ninguém é marcado como outra pessoa (melhor não rotular
//   errado). Presente recebido segue a mesma regra.
// - Ocultar: só leituras de outra pessoa; a chave é a pessoa (nome + data), não
//   a análise — refazer o quiz pra mesma pessoa continua oculto. Nada é apagado.
// - Previsão/HD/Compatibilidade abrem inteiras se foram pagas ou se há
//   assinatura ativa (mesma regra das páginas); Compatibilidade também é grátis
//   pra quem comprou o Manual. Senão, abrem na parte grátis.

const pago = (v) => v === 'paid';
const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || '';
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Chave estável de uma pessoa: primeiro nome normalizado + data de nascimento. */
export function chavePessoa(nome, dataNascimento) {
  return `${norm(primeiroNome(nome))}|${dataNascimento}`;
}

/** Valida uma chave vinda do browser (rota de ocultar). */
export function chaveValida(chave) {
  // Nome pode ter hífen/apóstrofo ("ana-clara", "d'avila") ou vir vazio.
  return typeof chave === 'string' && chave.length <= 80 && /^[^|]{0,60}\|\d{4}-\d{2}-\d{2}$/.test(chave);
}

function prioridade(r) {
  if (pago(r.payment_status)) return 3;
  if (pago(r.tier2_payment_status) || pago(r.hd_payment_status) || pago(r.compat_payment_status)) return 2;
  return 1;
}

/**
 * @param {Array<object>} rows linhas de `analises`
 * @param {{ email: string, assinaturaAtiva?: boolean, dataNascimentoPerfil?: string|null,
 *   nomePerfil?: string|null, ocultas?: string[] }} ctx
 * @returns {Array<object>} pessoas, cada uma com `chave`, `propria` (é a dona
 *   do perfil) e `oculta` (outra pessoa escondida da Minha Área).
 */
export function agruparProdutos(rows, { email, assinaturaAtiva = false, dataNascimentoPerfil = null, nomePerfil = null, ocultas = [] }) {
  const eu = String(email || '').toLowerCase();
  const nomeEu = norm(primeiroNome(nomePerfil));
  const setOcultas = new Set(Array.isArray(ocultas) ? ocultas : []);
  const ehPropria = (r) => {
    if (!dataNascimentoPerfil) return true; // sem perfil completo: não rotula ninguém como "outra pessoa"
    if (r.data_nascimento !== dataNascimentoPerfil) return false;
    return !nomeEu || norm(primeiroNome(r.nome)) === nomeEu;
  };
  const porPessoa = new Map();
  for (const r of rows || []) {
    if (!r?.id || !r.data_nascimento) continue;
    const chave = chavePessoa(r.nome, r.data_nascimento);
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
    const propria = ehPropria(r);
    const chave = chavePessoa(r.nome, r.data_nascimento);
    return {
      id: r.id,
      chave,
      propria,
      oculta: !propria && setOcultas.has(chave),
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

  // As da própria pessoa primeiro, depois as mais recentes.
  return pessoas.sort((a, b) => {
    if (a.propria !== b.propria) return a.propria ? -1 : 1;
    return new Date(b.criadoEm) - new Date(a.criadoEm);
  });
}

// ── "Esta é você?" ───────────────────────────────────────────────────────────
// Depois do login, perfil com dados mas sem confirmação mostra a tela de
// confirmar. A confirmação vale no servidor (perfil_confirmado_em, migração
// 0021) ou no aparelho (localStorage, pra quando a migração não rodou ou o
// POST falhou). A marca do aparelho guarda os dados confirmados: se eles
// mudarem em outro lugar, pergunta de novo.

/** Marca do aparelho pra um perfil: e-mail + data + hora + cidade. */
export function marcaConfirmacao(perfil) {
  return [perfil?.email || '', perfil?.dataNascimento || '', perfil?.hora || '', perfil?.cidade?.ibge || '']
    .join('|').toLowerCase();
}

/**
 * @param {object|null} perfil  resposta de /api/seu-dia/perfil (confirmadoEm: string | null | ausente)
 * @param {string|null} marcaLocal  valor guardado no aparelho
 */
export function precisaConfirmar(perfil, marcaLocal = null) {
  if (!perfil || perfil.precisaDados || !perfil.dataNascimento) return false;
  if (perfil.confirmadoEm) return false;
  return marcaLocal !== marcaConfirmacao(perfil);
}

// ── Cartões de "Suas leituras" ───────────────────────────────────────────────
// Ordem e imagem de cada leitura (imagens do Olho Cósmico em /public/olho).
export const CARTOES_LEITURA = {
  manual: { nome: 'Seu Manual', img: '/olho/e3.webp', ordem: 0 },
  compat: { nome: 'Compatibilidade', img: '/olho/e1.webp', ordem: 1 },
  previsao: { nome: 'Previsão do Ano', img: '/olho/e4.webp', ordem: 2 },
  'human-design': { nome: 'Human Design', img: '/olho/e2.webp', ordem: 3 },
};

/**
 * Itens de uma pessoa (agruparProdutos) → cartões com selo "Liberado" ou
 * "Prova grátis". Manual não pago abre a prévia grátis.
 */
export function cartoesLeitura(pessoa) {
  return (pessoa?.itens || [])
    .filter((it) => CARTOES_LEITURA[it.chave])
    .map((it) => {
      const c = CARTOES_LEITURA[it.chave];
      const liberado = it.estado === 'aberto';
      return {
        chave: it.chave,
        nome: c.nome,
        img: c.img,
        href: it.href,
        estado: it.estado,
        liberado,
        selo: liberado ? 'Liberado' : 'Prova grátis',
        acao: liberado ? 'Abrir →' : it.estado === 'travado' ? 'Ver prévia grátis →' : `${it.rotulo} →`,
        ordem: c.ordem,
      };
    })
    .sort((a, b) => a.ordem - b.ordem);
}

// ── Cadeado do Seu Dia (sem acesso Completo) ────────────────────────────────
// O botão do cadeado depende do mapa DA PRÓPRIA PESSOA no e-mail logado:
// mesma data de nascimento do perfil e, se o perfil tiver nome, o mesmo
// primeiro nome (regra de agruparProdutos). Leitura de outra pessoa não conta.
// Entre várias, vale a paga; senão, a mais recente.

/**
 * @param {Array<{ id: string, nome?: string, data_nascimento: string, payment_status?: string, created_at?: string }>} rows
 * @param {{ dataNascimento?: string|null, nome?: string|null }} perfil
 * @returns {{ id: string, pago: boolean } | null}
 */
export function mapaDoPerfil(rows, { dataNascimento = null, nome = null } = {}) {
  if (!dataNascimento) return null;
  const nomeEu = norm(primeiroNome(nome));
  const minhas = (rows || []).filter((r) => r?.id && r.data_nascimento === dataNascimento
    && (!nomeEu || norm(primeiroNome(r.nome)) === nomeEu));
  if (!minhas.length) return null;
  minhas.sort((a, b) => (pago(b.payment_status) - pago(a.payment_status))
    || (new Date(b.created_at || 0) - new Date(a.created_at || 0)));
  return { id: minhas[0].id, pago: pago(minhas[0].payment_status) };
}
