// Gera public/data/municipios-br.json — base estática dos 5.570 municípios
// brasileiros (código IBGE, nome, UF, lat/long, capital), usada pelo
// autocomplete de cidade (quiz e /ceu) e pelo Olho Cósmico.
//
// Fonte: github.com/kelvins/municipios-brasileiros (dados do IBGE, licença MIT).
// O fuso NÃO vem dessa base de propósito: a coluna fuso_horario dela é o fuso
// "atual equivalente" (ex.: BA como America/Sao_Paulo, MT como Porto_Velho), o
// que erra o horário de verão histórico. O fuso IANA é derivado em
// lib/fusoBR.js a partir da UF (+ exceções por município).
//
// A única informação de fuso aproveitada daqui é a lista de municípios do AM
// em UTC-5 (America/Rio_Branco na base) → vira o flag `oesteAM` pra
// lib/fusoBR.js mapear pra America/Eirunepe.
//
// Uso: node scripts/gerar-municipios.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', 'municipios-br.json');

// CSV simples com suporte a campos entre aspas (alguns nomes têm apóstrofo,
// nenhum tem vírgula hoje, mas não custa ser robusto).
function parseCSV(text) {
  const linhas = text.replace(/^﻿/, '').trim().split(/\r?\n/);
  const header = linhas[0].split(',');
  return linhas.slice(1).map((linha) => {
    const campos = [];
    let atual = '';
    let aspas = false;
    for (const ch of linha) {
      if (ch === '"') { aspas = !aspas; continue; }
      if (ch === ',' && !aspas) { campos.push(atual); atual = ''; continue; }
      atual += ch;
    }
    campos.push(atual);
    return Object.fromEntries(header.map((h, i) => [h, campos[i]]));
  });
}

async function baixar(nome) {
  const res = await fetch(`${BASE}/${nome}`);
  if (!res.ok) throw new Error(`Falha ao baixar ${nome}: HTTP ${res.status}`);
  return parseCSV(await res.text());
}

const [estados, municipios] = await Promise.all([baixar('estados.csv'), baixar('municipios.csv')]);
const ufPorCodigo = Object.fromEntries(estados.map((e) => [e.codigo_uf, e.uf]));

// 2 casas ≈ 1 km — irrelevante pro céu e pro Ascendente, economiza ~25 KB.
const arred = (n) => Math.round(Number(n) * 100) / 100;

// Formato compacto (array por município) pra economizar bytes:
// [ibge, nome, uf, lat, lon, flags]  — flags: 1 = capital, 2 = oeste do AM (UTC-5)
const m = municipios
  .map((r) => {
    const uf = ufPorCodigo[r.codigo_uf];
    if (!uf) throw new Error(`UF desconhecida: ${r.codigo_uf}`);
    let flags = 0;
    if (r.capital === '1') flags |= 1;
    if (uf === 'AM' && r.fuso_horario === 'America/Rio_Branco') flags |= 2;
    return [Number(r.codigo_ibge), r.nome, uf, arred(r.latitude), arred(r.longitude), flags];
  })
  .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ v: 1, fonte: 'IBGE via kelvins/municipios-brasileiros', m }));
console.log(`OK: ${m.length} municípios → ${OUT}`);
