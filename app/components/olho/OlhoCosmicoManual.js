'use client';

// Olho Cósmico no topo do /manual/[id] (mode="manual"). Monta os dados a
// partir do registro da análise. A página do Manual importa este arquivo via
// next/dynamic (ssr:false), então ele só baixa pra quem pagou.
//
// Resolução do local (registros antigos têm só texto livre + lat/long do
// Nominatim, sem fuso):
//   1. fuso_iana / latitude / longitude salvos → usa direto
//   2. falta algo → baixa a base de municípios e resolve por
//      municipio_ibge → nome exato em local_nascimento → município mais
//      próximo de lat/long
//   3. nada resolve → Brasília, rotulado "Brasil"

import { useEffect, useState } from 'react';
import OlhoCosmico from './OlhoCosmico';
import { calcularNumeroVida } from '@/lib/calculos';
import { FUSOS_BR } from '@/lib/fusoBR';
import { carregarMunicipios, resolverMunicipio, municipioMaisProximo } from '@/lib/municipios';

const FALLBACK = { name: 'Brasil', lat: -15.79, lon: -47.88, tz: 'America/Sao_Paulo' };

const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

function primeiroNome(nome) {
  const p = String(nome || '').trim().split(/\s+/)[0] || '';
  return p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : '';
}

function nomeDoTexto(texto) {
  return String(texto || '').split(/[,/–-]/)[0].trim();
}

async function resolverLocal(row) {
  let lat = num(row.latitude);
  let lon = num(row.longitude);
  let tz = FUSOS_BR.has(row.fuso_iana) ? row.fuso_iana : null;
  let name = nomeDoTexto(row.local_nascimento);

  if (lat !== null && lon !== null && tz && name) return { name, lat, lon, tz };

  try {
    const lista = await carregarMunicipios();
    const ibge = num(row.municipio_ibge);
    const m = (ibge && lista.find((x) => x.ibge === ibge))
      || (row.local_nascimento && resolverMunicipio(lista, row.local_nascimento))
      || (lat !== null && lon !== null && municipioMaisProximo(lista, lat, lon))
      || null;
    if (m) {
      return {
        name: name || m.nome,
        lat: lat ?? m.lat,
        lon: lon ?? m.lon,
        tz: tz || m.tz,
      };
    }
  } catch (e) {
    console.error('[OlhoCosmicoManual] municípios', e);
  }

  if (lat !== null && lon !== null) return { name: name || FALLBACK.name, lat, lon, tz: tz || FALLBACK.tz };
  return FALLBACK;
}

export default function OlhoCosmicoManual({ row }) {
  const [dados, setDados] = useState(null);

  // Dependências campo a campo: o /manual refaz o fetch do registro (polling da
  // geração IA) e um objeto novo com os mesmos dados não deve reiniciar o céu.
  const chave = [row?.id, row?.nome, row?.data_nascimento, row?.hora_nascimento, row?.local_nascimento,
    row?.latitude, row?.longitude, row?.fuso_iana, row?.municipio_ibge, row?.numero_vida].join('|');

  useEffect(() => {
    if (!row?.data_nascimento) return;
    let cancelado = false;
    resolverLocal(row).then((place) => {
      if (cancelado) return;
      setDados({
        nome: primeiroNome(row.nome),
        data: row.data_nascimento,
        hora: row.hora_nascimento ? String(row.hora_nascimento).slice(0, 5) : null,
        place,
        numero: row.numero_vida ?? calcularNumeroVida(row.data_nascimento),
      });
    });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  if (!row?.data_nascimento) return null;
  return <OlhoCosmico mode="manual" dados={dados} />;
}
