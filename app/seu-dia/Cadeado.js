'use client';

// Cadeado da Minha Área pra quem NÃO tem o Seu Dia Completo (sem Manual pago
// nos últimos 30 dias, sem assinatura e sem teste antigo em andamento).
// Todo cadeado tem o mesmo texto e o mesmo botão (nov/2026):
//   - mapa da pessoa ainda não pago → "Desbloquear com o Manual do seu Mapa" → /resultado/<id> (bloco de compra)
//   - sem mapa → "Fazer meu mapa grátis" (quiz pré-preenchido com o perfil, via lib/ceuDados.js)
//   - Manual pago há mais de 30 dias → "Assinar o Intuitive Completo" (o Manual já é dela)
//   - link pequeno: "ou assine o Intuitive Completo" → /assinar
// `perfil.mapa` vem de /api/seu-dia/perfil (mapaDoPerfil em lib/minhaArea.js).

import Link from 'next/link';
import { salvarCeuDados } from '@/lib/ceuDados';
import ma from './minhaArea.module.css';

export const TEXTO_CADEADO = 'Desbloquear com o Manual do seu Mapa, e ganhe 30 dias do Seu Dia Completo.';

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'seu_dia', ...params }); } catch {}
}

/** Botões do cadeado (também usados no bloco do fim do Meu Mapa). */
export function BotoesCadeado({ perfil, origem }) {
  const mapa = perfil.mapa || null;
  let botao;
  if (mapa && !mapa.pago) {
    botao = (
      <a className={`${ma.btn} ${ma.btnLink}`} href={`/resultado/${mapa.id}#comprar`}
        onClick={() => evento('sd_cadeado_click', { origem, destino: 'resultado' })}>
        Desbloquear com o Manual do seu Mapa
      </a>
    );
  } else if (mapa?.pago) {
    botao = (
      <a className={`${ma.btn} ${ma.btnLink}`} href="/assinar"
        onClick={() => evento('sd_cadeado_click', { origem, destino: 'assinar' })}>
        Assinar o Intuitive Completo
      </a>
    );
  } else {
    botao = (
      <Link
        className={`${ma.btn} ${ma.btnLink}`}
        href="/?quiz=1"
        onClick={(e) => {
          e.preventDefault();
          evento('sd_cadeado_click', { origem, destino: 'quiz' });
          salvarCeuDados({ nome: perfil.nome || '', dataNascimento: perfil.dataNascimento, hora: perfil.hora || null, cidade: perfil.cidade || null });
          window.location.href = '/';
        }}
      >
        Fazer meu mapa grátis
      </Link>
    );
  }
  return (
    <div className={ma.cadeadoAcoes}>
      {botao}
      {!mapa?.pago && (
        <a className={ma.cadeadoLink} href="/assinar" onClick={() => evento('sd_cadeado_click', { origem, destino: 'assinar' })}>
          ou assine o Intuitive Completo
        </a>
      )}
    </div>
  );
}

/**
 * Bloco trancado: títulos nítidos, conteúdo borrado (texto de enfeite, não o
 * conteúdo real) e o cadeado embaixo.
 * @param {{ perfil: object, titulos: string[], origem: string }} props
 */
export default function Cadeado({ perfil, titulos = [], origem }) {
  return (
    <section className={ma.cadeado} aria-label="Conteúdo do Seu Dia Completo">
      {titulos.map((t) => (
        <div key={t} className={ma.cadeadoSecao}>
          <h2 className={ma.h2Ed}>{t}</h2>
          <p className={ma.cadeadoBorrado} aria-hidden="true">
            O seu mapa cruzado com o dia de hoje, parte por parte, com o que fazer em cada hora e em cada área da sua vida.
          </p>
        </div>
      ))}
      <div className={ma.cadeadoCaixa}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <p className={ma.cadeadoTexto}>{TEXTO_CADEADO}</p>
        <BotoesCadeado perfil={perfil} origem={origem} />
      </div>
    </section>
  );
}
