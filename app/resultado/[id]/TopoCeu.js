'use client';

// Pedaços do topo do /resultado que carregam depois da página (next/dynamic
// ssr:false em page.js): o céu do nascimento ao fundo e a linha
// "signo · número · anjo · Kin" + a legenda do céu. Anjo (lib/anjos.js puxa
// o BaZi pra longitude do Sol), Kin e o céu ficam fora do JS inicial.

import { useMemo } from 'react';
import CeuNascimento from '@/app/components/ceu/CeuNascimento';
import { resumoCeu, lugarDoPerfil } from '@/lib/ceuNascimento';
import { calcularAnjos, dadosDoAnjo } from '@/lib/anjos';
import { calcularKin } from '@/lib/kin';
import r from './resultado.module.css';

/** @param {{ dados: { dataNascimento: string, hora: string|null, cidade: object|null } }} props */
export function CeuFundo({ dados }) {
  const lugar = useMemo(() => lugarDoPerfil(dados.cidade), [dados.cidade]);
  return <CeuNascimento data={dados.dataNascimento} hora={dados.hora} lugar={lugar} rotuloMaxY={0.42} />;
}

/** @param {{ dados: object, signo: string, numero: number|string }} props */
export function ExtrasTopo({ dados, signo, numero }) {
  const info = useMemo(() => {
    const tz = dados.cidade?.tz || 'America/Sao_Paulo';
    let anjo = null, kin = null, legenda = null;
    try { anjo = dadosDoAnjo(calcularAnjos({ data: dados.dataNascimento, hora: dados.hora, tz }).guardiao).nome; } catch {}
    try { kin = calcularKin({ data: dados.dataNascimento, hora: dados.hora }).kin; } catch {}
    try { legenda = resumoCeu({ data: dados.dataNascimento, hora: dados.hora, lugar: lugarDoPerfil(dados.cidade) }).legenda; } catch {}
    return { anjo, kin, legenda };
  }, [dados]);
  const chips = [signo, numero ? String(numero) : null, info.anjo, info.kin && `Kin ${info.kin}`].filter(Boolean);
  return (
    <>
      <p className={r.chips}>{chips.join(' · ')}</p>
      {info.legenda && <p className={r.legenda}>{info.legenda}</p>}
    </>
  );
}
