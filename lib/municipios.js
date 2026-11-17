// lib/municipios.js
// Busca de municípios brasileiros sobre public/data/municipios-br.json
// (gerado por scripts/gerar-municipios.mjs).
//
// O JSON (~83 KB gzip) só é baixado quando alguém foca o campo de cidade —
// `carregarMunicipios()` faz o fetch uma vez e cacheia a promise.
// As funções de busca são puras (recebem a lista), então dá pra testar no Node.

import { fusoIANA } from './fusoBR.js';

/**
 * @typedef {{ ibge: number, nome: string, uf: string, lat: number, lon: number,
 *   capital: boolean, tz: string, _n?: string }} Municipio
 */

/** Minúsculas, sem acento, sem pontuação, espaços colapsados. */
export function normalizar(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converte o JSON compacto em objetos (com o fuso já resolvido).
 * @param {{ m: Array<[number, string, string, number, number, number]> }} json
 * @returns {Municipio[]}
 */
export function expandirMunicipios(json) {
  return json.m.map(([ibge, nome, uf, lat, lon, flags]) => ({
    ibge, nome, uf, lat, lon,
    capital: (flags & 1) === 1,
    tz: fusoIANA({ uf, ibge, lon, oesteAM: (flags & 2) === 2 }),
    _n: normalizar(nome),
  }));
}

let _cache = null;
/** @returns {Promise<Municipio[]>} */
export function carregarMunicipios() {
  if (!_cache) {
    _cache = fetch('/data/municipios-br.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(expandirMunicipios)
      .catch((e) => {
        _cache = null; // deixa tentar de novo no próximo foco
        throw e;
      });
  }
  return _cache;
}

const UFS = new Set(['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb',
  'pe', 'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to']);

/**
 * Separa "Vitória, ES" / "vitoria-es" / "Vitória ES" / "Vitória/ES" em nome + UF.
 * @returns {{ nome: string, uf: string|null }} nome já normalizado
 */
export function separarUF(texto) {
  const n = normalizar(texto);
  const m = n.match(/^(.*\S)\s+([a-z]{2})$/);
  if (m && UFS.has(m[2])) return { nome: m[1], uf: m[2].toUpperCase() };
  return { nome: n, uf: null };
}

/**
 * Sugestões pro autocomplete. Ordem: nome exato → começa com → alguma palavra
 * começa com → contém; dentro de cada grupo, capitais primeiro, depois nome
 * mais curto (ex.: "sao" sugere São Paulo antes de São Paulo de Olivença).
 * @param {Municipio[]} lista
 * @param {string} texto
 * @param {number} [limite]
 * @returns {Municipio[]}
 */
export function buscarMunicipios(lista, texto, limite = 6) {
  const { nome, uf } = separarUF(texto);
  if (nome.length < 2) return [];
  const pontuados = [];
  for (const m of lista) {
    if (uf && m.uf !== uf) continue;
    const n = m._n ?? normalizar(m.nome);
    let p;
    if (n === nome) p = 0;
    else if (n.startsWith(nome)) p = 1;
    else if (n.includes(' ' + nome)) p = 2;
    else if (n.includes(nome)) p = 3;
    else continue;
    pontuados.push([p, m]);
  }
  pontuados.sort(([pa, a], [pb, b]) =>
    pa - pb || Number(b.capital) - Number(a.capital) || a.nome.length - b.nome.length
    || a.nome.localeCompare(b.nome, 'pt-BR'));
  return pontuados.slice(0, limite).map(([, m]) => m);
}

/**
 * Resolve um texto livre já salvo (ex.: `local_nascimento` antigo, digitado à
 * mão) pra um município. Só aceita nome exato (sem acento/caixa); com mais de
 * um homônimo e sem UF, prefere a capital, senão devolve null — melhor não
 * mostrar a cidade errada.
 * @param {Municipio[]} lista
 * @param {string} texto
 * @returns {Municipio|null}
 */
export function resolverMunicipio(lista, texto) {
  const { nome, uf } = separarUF(texto);
  if (!nome) return null;
  const exatos = lista.filter((m) => (m._n ?? normalizar(m.nome)) === nome && (!uf || m.uf === uf));
  if (exatos.length === 1) return exatos[0];
  if (exatos.length > 1) return exatos.find((m) => m.capital) || null;
  return null;
}

/**
 * Município mais próximo de um ponto (pra achar o fuso de registros que só
 * têm lat/long do geocoding antigo).
 * @param {Municipio[]} lista
 * @returns {Municipio|null}
 */
export function municipioMaisProximo(lista, lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  let melhor = null;
  let dMin = Infinity;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const m of lista) {
    const d = (m.lat - lat) ** 2 + ((m.lon - lon) * k) ** 2;
    if (d < dMin) { dMin = d; melhor = m; }
  }
  return melhor;
}

/** "Vitória, ES" */
export function rotuloMunicipio(m) {
  return `${m.nome}, ${m.uf}`;
}
