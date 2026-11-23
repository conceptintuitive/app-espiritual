'use client';

// Prévia do Hoje na home ("Depois do mapa: seu dia, todo dia"): a leitura real
// do motor do Seu Dia pra pessoa de exemplo, igual à do /assinar.
// Entra SÓ via next/dynamic com ssr:false (app/page.js): lib/seuDia.js puxa
// BaZi, tarô, I Ching e as posições planetárias, pesado demais pro JS inicial
// da página dos anúncios. Carrega depois, num chunk à parte.

import { useMemo } from 'react';
import { DiaResumo, EXEMPLO_DIA, TOM_ROTULO } from '@/app/seu-dia/DiaResumo';
import { montarPerfil, leituraDoDia, hojeNoFuso } from '@/lib/seuDia';
import ma from '@/app/seu-dia/minhaArea.module.css';
import h from '@/app/home.module.css';

export default function PreviaSeuDia() {
  const exemplo = useMemo(() => {
    try {
      return leituraDoDia(montarPerfil(EXEMPLO_DIA), hojeNoFuso(EXEMPLO_DIA.tz));
    } catch { return null; }
  }, []);
  if (!exemplo) return null;
  return (
    <div className={ma.ma}>
      <div className={`${ma.abaCorpo} ${h.previa}`}>
        <DiaResumo l={exemplo} rotuloTom={TOM_ROTULO[exemplo.tom] || 'Dia misto'} />
      </div>
    </div>
  );
}
