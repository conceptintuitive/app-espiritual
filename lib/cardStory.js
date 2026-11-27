// lib/cardStory.js — o que vai escrito no card do story (1080×1920) da aba
// Meu Mapa. Puro (sem canvas): o desenho é de app/seu-dia/cardStory.js.
// Croquis: reference/ux/CardCeu.dc.html e CardNumero.dc.html (branch
// reference-ux, em 540×960 = metade da escala). Testado em tests/cardStory.test.js.

import { sistemasDaPessoa, sinteseDoMapa, destaqueDoMapa, TEMAS } from './mapaSintese.js';
import { resumoCeu, lugarDoPerfil } from './ceuNascimento.js';

const PERIODO_FUNDO = {
  'Manhã': 'da manhã', 'Tarde': 'da tarde', 'Noite': 'da noite', 'Madrugada': 'da madrugada', 'Antes do amanhecer': 'da madrugada',
};

/**
 * @param {{ nome?: string|null, dataNascimento: string, hora?: string|null,
 *   cidade?: { nome: string, uf: string, lat: number, lon: number, tz: string }|null }} p
 */
export function dadosDoCard({ nome = null, dataNascimento, hora = null, cidade = null }) {
  const sistemas = sistemasDaPessoa({ dataNascimento, hora, cidade });
  const sintese = sinteseDoMapa(sistemas);
  const por = Object.fromEntries(sistemas.map((s) => [s.chave, s]));
  const lugar = lugarDoPerfil(cidade);
  const ceu = resumoCeu({ data: dataNascimento, hora, lugar });

  const primeiro = String(nome || '').trim().split(/\s+/)[0] || '';
  const temas = sintese.repete.length
    ? sintese.repete.map((r) => r.nome)
    : sintese.ranking.slice(0, 2).map((r) => TEMAS[r.tema].nome);
  const kin = por['kin-maia'];
  const kinNumero = kin ? kin.sistema.replace(/\D/g, '') : '';

  // 6 sistemas do grid. Sem hora não há anjo da mente: entra o céu no lugar.
  const sistemas6 = [
    por.signos && { k: 'Signo solar', v: por.signos.valor },
    por.numerologia && { k: 'Número de vida', v: por.numerologia.valor },
    por.anjo && { k: 'Anjo da guarda', v: por.anjo.valor },
    por['anjo-mente'] ? { k: 'Anjo da mente', v: por['anjo-mente'].valor } : { k: 'Céu do nascimento', v: ceu.valor },
    por['astrologia-chinesa'] && { k: 'Astrologia chinesa', v: por['astrologia-chinesa'].valor },
    kin && { k: `Kin Maia ${kinNumero}`, v: kin.valor },
  ].filter(Boolean);

  const tres = [
    por.signos && { k: 'Signo', v: por.signos.valor },
    por.anjo && { k: 'Anjo', v: por.anjo.valor },
    kin && { k: 'Kin', v: kinNumero },
  ].filter(Boolean);

  // Frase em primeira pessoa: a tensão; sem tensão, o tema que mais se repete.
  const frase = sintese.tensao?.eu
    || sintese.repete[0]?.eu
    || (sintese.ranking[0] ? TEMAS[sintese.ranking[0].tema].eu : '');

  // "O céu sobre Vitória às 7h25 de 21/12/1994" em duas linhas.
  const i = ceu.legenda.indexOf(' às ');
  const legenda = i > 0 ? [ceu.legenda.slice(0, i), ceu.legenda.slice(i + 1)] : [ceu.legenda];

  const fundo = ceu.aproximado
    ? 'Ao fundo, o céu aproximado da noite em que eu cheguei'
    : `Ao fundo, o céu ${PERIODO_FUNDO[ceu.periodo] || 'do dia'} em que eu cheguei`;

  // Modelo "Síntese" (topo do /resultado): a convergência e a tensão principais.
  const d = destaqueDoMapa(sistemas, sintese);
  const destaque = {
    rotulo: d.convergencia?.rotuloEu || null,
    tema: d.convergencia?.nome || null,
    quem: d.convergencia?.quem || [],
    tensao: d.tensao ? [d.tensao.nomeA, d.tensao.nomeB] : null,
    frase: d.tensao?.eu || d.convergencia?.eu || '',
  };

  return {
    destaque,
    nome: primeiro ? primeiro[0].toUpperCase() + primeiro.slice(1) : 'Meu mapa',
    temas: temas.join(' · '),
    numero: por.numerologia?.valor || '',
    sistemas: sistemas6,
    tres,
    frase,
    legenda,
    fundo,
    ceu,
    lugar,
  };
}
