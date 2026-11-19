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
//
// Primeira visita: a animação inteira (com "pular ↓"). Quando a pessoa pula ou
// chega ao número, grava ic_olho_visto_<id> no localStorage; nas próximas
// visitas o Manual abre direto no conteúdo, com "rever minha abertura" no topo.

import { useEffect, useState } from 'react';
import OlhoCosmico from './OlhoCosmico';
import { calcularNumeroVida } from '@/lib/calculos';
import { FUSOS_BR } from '@/lib/fusoBR';
import { carregarMunicipios, resolverMunicipio, municipioMaisProximo } from '@/lib/municipios';

const chaveVisto = (id) => `ic_olho_visto_${id}`;
function jaViu(id) {
  try { return !!id && window.localStorage.getItem(chaveVisto(id)) === '1'; } catch { return false; }
}
function marcarVisto(id) {
  try { if (id) window.localStorage.setItem(chaveVisto(id), '1'); } catch {}
}

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
  // "Vitoria ES" (texto livre, sem vírgula) → "Vitoria"; o nome oficial, com acento, vem da base abaixo.
  let name = nomeDoTexto(row.local_nascimento).replace(/\s+[A-Za-z]{2}$/, '');

  try {
    const lista = await carregarMunicipios();
    const ibge = num(row.municipio_ibge);
    // Só renomeia com o município exato (IBGE ou nome digitado); o "mais
    // próximo" por coordenada pode ser outro lugar e só serve pro fuso.
    const exato = (ibge && lista.find((x) => x.ibge === ibge))
      || (row.local_nascimento && resolverMunicipio(lista, row.local_nascimento))
      || null;
    if (exato) name = exato.nome;
    const m = exato || (lat !== null && lon !== null && municipioMaisProximo(lista, lat, lon)) || null;
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
  // ssr:false, então dá pra ler o localStorage já no primeiro render (sem
  // piscar a animação pra quem já viu).
  const [mostrar, setMostrar] = useState(() => !jaViu(row?.id));

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

  if (!mostrar) {
    return (
      <div style={{ position: 'relative', zIndex: 6, display: 'flex', justifyContent: 'center', padding: '18px 16px 0' }}>
        <button
          type="button"
          onClick={() => { setMostrar(true); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          style={{
            background: 'rgba(0,0,0,.25)', border: '1px solid rgba(242,199,123,.45)', borderRadius: 999,
            color: '#f2c77b', fontSize: 13, letterSpacing: '.08em', padding: '9px 18px', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✦ rever minha abertura
        </button>
      </div>
    );
  }

  return <OlhoCosmico mode="manual" dados={dados} onVisto={() => marcarVisto(row.id)} />;
}
