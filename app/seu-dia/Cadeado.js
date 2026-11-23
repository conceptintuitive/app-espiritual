'use client';

// Cadeado da Minha Área pra quem NÃO tem o Seu Dia Completo (sem assinatura,
// sem Manual pago nos últimos 30 dias e fora do teste de 7 dias).
//
// Estratégia de nov/2026: a ASSINATURA é o produto principal.
//   - botão principal: "Continuar com o Seu Dia Completo · R$ 19,90/mês" → /assinar?plano=mensal
//   - link secundário: "ou desbloquear com o Manual do seu Mapa (ganha 30 dias)"
//       mapa sem pagar → /resultado/<id>#comprar · sem mapa → quiz pré-preenchido
//       (Manual já pago há mais de 30 dias → sem esse link)
// A prévia do Manual no fim do Meu Mapa continua centrada no Manual
// (`modo="manual"`, rótulos próprios).
// `perfil.mapa` vem de /api/seu-dia/perfil (mapaDoPerfil em lib/minhaArea.js).
// GA4: paywall_visto (o cadeado entrou na tela, 1x por origem) e assinatura_clique.

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { salvarCeuDados } from '@/lib/ceuDados';
import { PRECO_ASSINATURA_MENSAL } from '@/lib/preco';
import ma from './minhaArea.module.css';

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const TEXTO_CADEADO = 'O Seu Dia Completo mostra tudo isso, todo dia, sobre você.';
export const ROTULO_ASSINAR = `Continuar com o Seu Dia Completo · ${brl(PRECO_ASSINATURA_MENSAL)}/mês`;

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'seu_dia', ...params }); } catch {}
}

function irProQuiz(perfil) {
  salvarCeuDados({ nome: perfil.nome || '', dataNascimento: perfil.dataNascimento, hora: perfil.hora || null, cidade: perfil.cidade || null });
  window.location.href = '/';
}

/** Caminho do Manual pra esta pessoa: { href, rotulo, destino } ou null se já pagou. */
function caminhoManual(perfil, { rotuloResultado, rotuloQuiz }) {
  const mapa = perfil.mapa || null;
  if (mapa?.pago) return null;
  if (mapa) return { href: `/resultado/${mapa.id}#comprar`, rotulo: rotuloResultado, destino: 'resultado' };
  return { href: '/?quiz=1', rotulo: rotuloQuiz, destino: 'quiz' };
}

/**
 * Botões do cadeado.
 *   modo="assinatura" (padrão): assinatura no botão, Manual no link.
 *   modo="manual": Manual no botão, assinatura no link (prévia do Manual no Meu Mapa).
 */
export function BotoesCadeado({
  perfil, origem, modo = 'assinatura',
  rotuloResultado = 'Desbloquear o Manual do seu Mapa',
  rotuloQuiz = 'Ver a prévia grátis do meu Manual',
  nota = null,
}) {
  const manual = caminhoManual(perfil, { rotuloResultado, rotuloQuiz });
  const clicarManual = (e) => {
    evento('sd_cadeado_click', { origem, destino: manual.destino });
    if (manual.destino === 'quiz') { e.preventDefault(); irProQuiz(perfil); }
  };
  const clicarAssinar = () => {
    evento('assinatura_clique', { origem });
    evento('sd_cadeado_click', { origem, destino: 'assinar' });
  };

  if (modo === 'manual') {
    return (
      <div className={ma.cadeadoAcoes}>
        {manual ? (
          <Link className={`${ma.btn} ${ma.btnLink}`} href={manual.href} onClick={clicarManual}>{manual.rotulo}</Link>
        ) : (
          <a className={`${ma.btn} ${ma.btnLink}`} href="/assinar" onClick={clicarAssinar}>Assinar o Intuitive Completo</a>
        )}
        {nota && <p className={ma.cadeadoNota}>{nota}</p>}
        {manual && <a className={ma.cadeadoLink} href="/assinar" onClick={clicarAssinar}>ou assine o Intuitive Completo</a>}
      </div>
    );
  }

  return (
    <div className={ma.cadeadoAcoes}>
      <a className={`${ma.btn} ${ma.btnLink}`} href="/assinar?plano=mensal" onClick={clicarAssinar}>{ROTULO_ASSINAR}</a>
      {nota && <p className={ma.cadeadoNota}>{nota}</p>}
      {manual && (
        <Link className={ma.cadeadoLink} href={manual.href} onClick={clicarManual}>
          ou desbloquear com o Manual do seu Mapa (ganha 30 dias)
        </Link>
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
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { evento('paywall_visto', { origem }); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [origem]);

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
      <div ref={ref} className={ma.cadeadoCaixa}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <p className={ma.cadeadoTexto}>{TEXTO_CADEADO}</p>
        <BotoesCadeado perfil={perfil} origem={origem} />
      </div>
    </section>
  );
}
