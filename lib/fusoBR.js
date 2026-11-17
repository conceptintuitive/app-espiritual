// lib/fusoBR.js
// Fuso IANA de um município brasileiro. Roda no browser e no servidor.
//
// Por que IANA e não um offset fixo: cada zona IANA brasileira carrega o
// histórico dela (horário de verão por estado e por ano, mudanças de fuso
// como a do oeste do Pará em 2008 e a do Acre/oeste do AM em 2008–2013).
// O Intl do browser/Node aplica esse histórico sozinho — ver lib/sky.js.
//
// A tabela segue os comentários do próprio tzdata (zone1970.tab):
//   America/Noronha     Fernando de Noronha
//   America/Belem       Pará (leste), Amapá
//   America/Fortaleza   MA, PI, CE, RN, PB
//   America/Recife      Pernambuco
//   America/Araguaina   Tocantins
//   America/Maceio      Alagoas, Sergipe
//   America/Bahia       Bahia
//   America/Sao_Paulo   Sudeste, Sul, GO, DF
//   America/Campo_Grande  Mato Grosso do Sul
//   America/Cuiaba      Mato Grosso
//   America/Santarem    Pará (oeste)
//   America/Porto_Velho Rondônia
//   America/Boa_Vista   Roraima
//   America/Manaus      Amazonas (leste)
//   America/Eirunepe    Amazonas (oeste)
//   America/Rio_Branco  Acre

/** @type {Record<string, string>} */
export const FUSO_POR_UF = {
  AC: 'America/Rio_Branco',
  AL: 'America/Maceio',
  AM: 'America/Manaus',
  AP: 'America/Belem',
  BA: 'America/Bahia',
  CE: 'America/Fortaleza',
  DF: 'America/Sao_Paulo',
  ES: 'America/Sao_Paulo',
  GO: 'America/Sao_Paulo',
  MA: 'America/Fortaleza',
  MG: 'America/Sao_Paulo',
  MS: 'America/Campo_Grande',
  MT: 'America/Cuiaba',
  PA: 'America/Belem',
  PB: 'America/Fortaleza',
  PE: 'America/Recife',
  PI: 'America/Fortaleza',
  PR: 'America/Sao_Paulo',
  RJ: 'America/Sao_Paulo',
  RN: 'America/Fortaleza',
  RO: 'America/Porto_Velho',
  RR: 'America/Boa_Vista',
  RS: 'America/Sao_Paulo',
  SC: 'America/Sao_Paulo',
  SE: 'America/Maceio',
  SP: 'America/Sao_Paulo',
  TO: 'America/Araguaina',
};

/** Todos os fusos que este módulo pode devolver (whitelist pra validar input). */
export const FUSOS_BR = new Set([
  ...Object.values(FUSO_POR_UF),
  'America/Noronha',
  'America/Santarem',
  'America/Eirunepe',
]);

const IBGE_FERNANDO_DE_NORONHA = 2605459;

// Oeste do Pará (America/Santarem): pelo decreto de 1913, a parte do estado a
// oeste do rio Xingu (e, ao norte do Amazonas, a oeste do rio Jari). Não há
// lista oficial por município; aproximamos pela longitude da sede (-52°, que
// separa Almeirim/Porto de Moz/Altamira/Vitória do Xingu de Gurupá/Senador
// José Porfírio/São Félix do Xingu). A diferença só existe antes de jun/2008
// (UTC-4 x UTC-3) e só importa nos municípios bem na divisa.
const LON_DIVISA_PA = -52.0;

/**
 * Fuso IANA de um município.
 * @param {{ uf: string, ibge?: number|null, lon?: number|null, oesteAM?: boolean }} m
 *   `oesteAM`: município do AM em UTC-5 (flag 2 da base municipios-br.json).
 * @returns {string} zona IANA (default America/Sao_Paulo se a UF for desconhecida)
 */
export function fusoIANA({ uf, ibge = null, lon = null, oesteAM = false }) {
  const UF = String(uf || '').toUpperCase();
  if (UF === 'PE' && Number(ibge) === IBGE_FERNANDO_DE_NORONHA) return 'America/Noronha';
  if (UF === 'AM' && oesteAM) return 'America/Eirunepe';
  if (UF === 'PA' && typeof lon === 'number' && lon < LON_DIVISA_PA) return 'America/Santarem';
  return FUSO_POR_UF[UF] || 'America/Sao_Paulo';
}
