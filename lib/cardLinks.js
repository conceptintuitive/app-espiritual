// lib/cardLinks.js
// Parte do card de story que roda no browser (BotaoCompartilharStory): links
// e URL da imagem. Separada de lib/cardCompartilhar.js, que importa o
// manualgenerator inteiro e só deve rodar no servidor (/api/card).

export const SITE_URL = 'https://intuitiveconcept.com.br';
export const SITE_HOST = 'intuitiveconcept.com.br';

// Link que vai no texto do share (WhatsApp etc.). Não vai impresso na imagem:
// texto dentro de story não é clicável, então UTM impressa não rastreia nada.
export const LINK_QUIZ = `${SITE_URL}/?utm_source=share&utm_medium=card`;

// Mesma ideia, mas pros cards de Ponto Cego/Mantra (card "Seu Manual
// Completo"): UTM própria por tipo, pra medir cada um separado no GA4.
export function linkStoryTipo(tipo) {
  return `${SITE_URL}/?utm_source=story&utm_medium=share&utm_content=${tipo}`;
}

export const TIPOS_CARD = new Set(['numero', 'ponto_cego', 'mantra']);
export function tipoCardValido(t) {
  return TIPOS_CARD.has(String(t ?? '')) ? String(t) : 'numero';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idValido(id) {
  return UUID_RE.test(String(id ?? ''));
}

// `v` só serve pra furar o cache do CDN quando o manual é pago (aí entram
// arquétipo e Síntese). A rota ignora o valor.
export function urlDoCard(id, pago, tipo = 'numero') {
  if (!idValido(id)) return null;
  const params = new URLSearchParams({ id, v: pago ? 'p' : 'f', tipo: tipoCardValido(tipo) });
  return `/api/card?${params.toString()}`;
}
