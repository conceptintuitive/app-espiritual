// lib/fusoPorCoordenada.js — SÓ SERVIDOR (importa a base inteira de municípios).
//
// Fuso IANA a partir de lat/long: pega o município mais próximo da base IBGE
// (public/data/municipios-br.json) e usa o fuso dele (lib/fusoBR.js). Serve pra
// quem digitou a cidade em texto livre: o Nominatim devolve só coordenadas.
// No browser use lib/municipios.js (que baixa a base sob demanda).

import base from '@/public/data/municipios-br.json';
import { expandirMunicipios, municipioMaisProximo } from './municipios.js';

let _lista = null;

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {string} zona IANA (America/Sao_Paulo se não der pra resolver)
 */
export function fusoPorCoordenada(lat, lon) {
  if (!_lista) _lista = expandirMunicipios(base);
  return municipioMaisProximo(_lista, lat, lon)?.tz || 'America/Sao_Paulo';
}
