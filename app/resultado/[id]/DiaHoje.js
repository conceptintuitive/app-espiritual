'use client';

// "Seu dia de hoje" no /resultado: o dia real da pessoa, com o mesmo motor e
// o mesmo desenho da aba Hoje do Seu Dia (DiaResumo). Entra via next/dynamic
// ssr:false: lib/seuDia.js (BaZi, tarô, I Ching, planetas) e o CSS da Minha
// Área carregam depois da página.

import { useMemo } from 'react';
import { DiaResumo, TOM_ROTULO } from '@/app/seu-dia/DiaResumo';
import { montarPerfil, leituraDoDia, hojeNoFuso } from '@/lib/seuDia';
import ma from '@/app/seu-dia/minhaArea.module.css';
import r from './resultado.module.css';

/** @param {{ dados: { dataNascimento: string, hora: string|null, cidade: object|null } }} props */
export default function DiaHoje({ dados }) {
  const leitura = useMemo(() => {
    try {
      const tz = dados.cidade?.tz || 'America/Sao_Paulo';
      const calc = montarPerfil({
        dataNascimento: dados.dataNascimento,
        hora: dados.hora || null,
        tz,
        lon: typeof dados.cidade?.lon === 'number' ? dados.cidade.lon : null,
      });
      return leituraDoDia(calc, hojeNoFuso(tz));
    } catch (e) {
      console.error('[resultado] dia', e);
      return null;
    }
  }, [dados]);
  if (!leitura) return null;
  return (
    <div className={ma.ma}>
      <div className={`${ma.abaCorpo} ${r.diaCaixa}`}>
        <DiaResumo l={leitura} rotuloTom={TOM_ROTULO[leitura.tom] || 'Dia misto'} />
      </div>
    </div>
  );
}
