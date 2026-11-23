'use client';

// Faixa com o céu da pessoa no topo das abas Hoje, Semana, Meu Mapa e Conta
// (e do /assinar): mesma CeuNascimento do Início (sem nomes de constelação),
// com o título por cima. ~120px no celular e ~160px no desktop, abaixo do menu
// transparente (64px). `alta` = versão mais alta (/assinar). Sem perfil
// (visitante), mostra a imagem da estrela (e4) no lugar do céu.

import { useMemo } from 'react';
import CeuNascimento from '@/app/components/ceu/CeuNascimento';
import { lugarDoPerfil } from '@/lib/ceuNascimento';
import s from './minhaArea.module.css';

export default function FaixaCeu({ perfil = null, eyebrow, titulo, alta = false, children = null }) {
  const cidade = perfil?.cidade || null;
  const lugar = useMemo(() => lugarDoPerfil(cidade), [cidade]);
  return (
    <header className={`${s.faixa} ${alta ? s.faixaAlta : ''}`}>
      {perfil?.dataNascimento ? (
        <CeuNascimento data={perfil.dataNascimento} hora={perfil.hora || null} lugar={lugar} rotuloMaxY={0} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/olho/e4.webp" alt="" className={s.faixaImg} />
      )}
      <div className={s.faixaVeu} aria-hidden="true" />
      <div className={s.faixaConteudo}>
        {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
        <h1 className={s.faixaTitulo}>{titulo}</h1>
        {children}
      </div>
    </header>
  );
}
