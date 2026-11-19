// lib/perfilLocal.js — perfil de nascimento salvo SÓ neste aparelho
// (localStorage `ic_perfil`), pra pessoa digitar a data uma vez e todas as
// ferramentas grátis (anjo, Kin, BaZi…) já abrirem com o resultado dela.
//
// Diferente de lib/ceuDados.js (repasse de 24h pro quiz, com `abrirQuiz`):
// este não expira e não abre nada sozinho. Nunca vai pra URL nem pro servidor.
// Quem grava: quiz (ao gerar a análise), /resultado, /ceu, /anjo-da-guarda,
// /kin-maia, /astrologia-chinesa e o Seu Dia (perfil da conta).

export const CHAVE_PERFIL = 'ic_perfil';
const EVENTO = 'ic-perfil';

/**
 * @typedef {{ v: 1, nome: string, dataNascimento: string, hora: string|null,
 *   cidade: { ibge: number, nome: string, uf: string, lat: number, lon: number, tz: string } | null,
 *   salvoEm: number }} PerfilLocal
 */

const dataValida = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const horaValida = (s) => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);

function cidadeLimpa(c) {
  if (!c || typeof c !== 'object' || typeof c.lat !== 'number' || typeof c.lon !== 'number' || !c.tz) return null;
  return { ibge: c.ibge ?? null, nome: c.nome || '', uf: c.uf || '', lat: c.lat, lon: c.lon, tz: c.tz };
}

/** @returns {PerfilLocal|null} */
export function lerPerfil() {
  try {
    const raw = window.localStorage.getItem(CHAVE_PERFIL);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p?.v !== 1 || !dataValida(p.dataNascimento)) return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Grava (ou atualiza) o perfil. Campos vazios não apagam os que já existem
 * quando é a mesma data de nascimento — ex.: o Kin não pede cidade, então não
 * deve sumir com a cidade que o quiz salvou.
 * @param {{ nome?: string, dataNascimento: string, hora?: string|null, cidade?: object|null }} dados
 */
export function salvarPerfil(dados) {
  if (!dados || !dataValida(dados.dataNascimento)) return;
  try {
    const atual = lerPerfil();
    const mesma = atual && atual.dataNascimento === dados.dataNascimento;
    const novo = {
      v: 1,
      nome: (dados.nome || '').trim() || (mesma ? atual.nome : ''),
      dataNascimento: dados.dataNascimento,
      hora: horaValida(dados.hora) ? dados.hora : (mesma && dados.hora === undefined ? atual.hora : null),
      cidade: cidadeLimpa(dados.cidade) || (mesma ? atual.cidade : null),
      salvoEm: Date.now(),
    };
    window.localStorage.setItem(CHAVE_PERFIL, JSON.stringify(novo));
    window.dispatchEvent(new Event(EVENTO));
  } catch {}
}

export function limparPerfil() {
  try {
    window.localStorage.removeItem(CHAVE_PERFIL);
    window.dispatchEvent(new Event(EVENTO));
  } catch {}
}

/** Avisa quando o perfil muda (nesta aba ou em outra). Devolve a função de desligar. */
export function ouvirPerfil(cb) {
  const h = () => cb(lerPerfil());
  const s = (e) => { if (e.key === CHAVE_PERFIL) h(); };
  window.addEventListener(EVENTO, h);
  window.addEventListener('storage', s);
  return () => { window.removeEventListener(EVENTO, h); window.removeEventListener('storage', s); };
}

/**
 * Grava só se não houver perfil ou se for a mesma pessoa (mesma data de
 * nascimento) — calcular o mapa de uma amiga não troca o seu perfil.
 * @returns {boolean} true se gravou
 */
export function salvarSeForMeu(dados) {
  const atual = lerPerfil();
  if (atual && atual.dataNascimento !== dados?.dataNascimento) return false;
  salvarPerfil(dados);
  return true;
}
