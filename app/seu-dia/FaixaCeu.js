'use client';

// Faixa fina com o céu da pessoa no topo das abas Hoje, Semana, Meu Mapa e
// Conta: mesma CeuNascimento do Início (sem nomes de constelação), com o
// título da aba por cima. ~120px no celular e ~160px no desktop, abaixo do
// menu transparente (64px).

import { useMemo } from 'react';
import CeuNascimento from '@/app/components/ceu/CeuNascimento';
import { lugarDoPerfil } from '@/lib/ceuNascimento';
import s from './minhaArea.module.css';

export default function FaixaCeu({ perfil, eyebrow, titulo }) {
  const cidade = perfil.cidade;
  const lugar = useMemo(() => lugarDoPerfil(cidade), [cidade]);
  return (
    <header className={s.faixa}>
      <CeuNascimento data={perfil.dataNascimento} hora={perfil.hora || null} lugar={lugar} rotuloMaxY={0} />
      <div className={s.faixaVeu} aria-hidden="true" />
      <div className={s.faixaConteudo}>
        {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
        <h1 className={s.faixaTitulo}>{titulo}</h1>
      </div>
    </header>
  );
}
