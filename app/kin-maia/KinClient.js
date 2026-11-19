'use client';

// /kin-maia — Kin Maia do Sincronário da Paz (Dreamspell), grátis, calculado
// no browser (lib/kin.js) com textos fixos (lib/kinTextos.js). Sem API, banco
// ou IA. CTA pro quiz pré-preenchido via lib/ceuDados.js (nunca query string).
// Visual: mesmo CSS do /anjo-da-guarda (app/anjo-da-guarda/estilo.js).

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import { salvarCeuDados } from '@/lib/ceuDados';
import { calcularKin, kinDaData, nomeDoKin, seloDoKin, tomDoKin, ondaEncantada, SELOS } from '@/lib/kin';
import { TEXTO_SELO, TEXTO_TOM, TEXTO_COR, TEXTO_ORACULO } from '@/lib/kinTextos';
import { CSS_ANJO, FONTES_ANJO } from '@/app/anjo-da-guarda/estilo';

const doSelo = (s) => `${s.feminino ? 'da' : 'do'} ${s.nomeCompleto}`;

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'kin_maia', ...params }); } catch {}
}

export default function KinClient() {
  const router = useRouter();
  const resultadoRef = useRef(null);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [erro, setErro] = useState('');
  const [entrada, setEntrada] = useState(null);
  const [hoje, setHoje] = useState(null);

  // Kin de hoje: só no browser (data local da pessoa, sem diferença de hidratação).
  useEffect(() => {
    const marcar = () => setHoje(hojeISO());
    marcar();
  }, []);

  const bissexto = data.endsWith('-02-29');
  const kin = useMemo(() => {
    if (!entrada) return null;
    try { return calcularKin({ data: entrada.data, hora: entrada.hora }); } catch { return null; }
  }, [entrada]);

  function calcular(e) {
    e.preventDefault();
    setErro('');
    const a = Number(data.slice(0, 4));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || a < 1900 || a > new Date().getFullYear()) {
      setErro('Confira a data de nascimento.');
      return;
    }
    setEntrada({ nome: nome.trim(), data, hora: bissexto && /^\d{2}:\d{2}$/.test(hora) ? hora : null });
    evento('kin_calcular');
    setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function irProManual() {
    evento('kin_cta_manual');
    salvarCeuDados({ nome: entrada.nome, dataNascimento: entrada.data, hora: entrada.hora, cidade: null });
    router.push('/');
  }

  return (
    <div className="an-wrap">
      <link href={FONTES_ANJO} rel="stylesheet" />
      <SiteNav active="kin-maia" />

      <header className="an-hero">
        <span className="an-glyph">✺</span>
        <h1>Qual é o seu Kin Maia?</h1>
        <p className="an-tagline">
          No Sincronário da Paz, cada dia é um dos 260 Kins do Tzolkin. O Kin do dia em que você nasceu é a sua
          assinatura galáctica: um selo (quem você é) e um tom (como você age).
        </p>
      </header>

      <form className="an-form" onSubmit={calcular}>
        <label>
          Seu primeiro nome
          <input className="an-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Bianca" autoComplete="given-name" />
        </label>
        <label>
          Data de nascimento
          <input className="an-input" type="date" value={data} onChange={(e) => setData(e.target.value)} max={hojeISO()} required />
        </label>
        {bissexto && (
          <label>
            Hora de nascimento <span className="an-hint">(29/02 não tem Kin próprio: antes do meio-dia vale o do dia 28, depois o do dia 1º)</span>
            <input className="an-input" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </label>
        )}
        {erro && <p className="an-erro">{erro}</p>}
        <button type="submit" className="an-btn">Descobrir meu Kin ✺</button>
        <p className="an-priv">Calculado no seu navegador. Nada é salvo.</p>
      </form>

      {kin && entrada && (
        <section ref={resultadoRef} className="an-sec">
          <Resultado k={kin} entrada={entrada} onCta={irProManual} />
        </section>
      )}

      {hoje && <KinDeHoje dataISO={hoje} />}

      <Sobre />

      <style>{CSS_ANJO + CSS_KIN}</style>
    </div>
  );
}

function Resultado({ k, entrada, onCta }) {
  const ts = TEXTO_SELO[k.selo.codigo];
  const tt = TEXTO_TOM[k.tom.numero];
  const nomePessoa = entrada.nome ? `${entrada.nome}, seu` : 'Seu';
  const tomNome = k.selo.feminino ? k.tom.f : k.tom.m;

  return (
    <>
      <div className="an-dois">
        <p><strong>Seu Kin tem duas partes.</strong> As duas saem do dia em que você nasceu:</p>
        <ul>
          <li><b>O selo (1 de 20)</b> — quem você é: seu dom e sua essência.</li>
          <li><b>O tom (1 de 13)</b> — como você age: o ritmo com que você usa esse dom.</li>
        </ul>
      </div>

      <div className="an-card">
        <span className="an-eyebrow">{nomePessoa} Kin</span>
        <div className="kin-num">Kin {k.kin}</div>
        <div className="an-nome kin-nome">{k.nome}</div>
        <div className="kin-cor"><span style={{ background: k.selo.cor.hex }} /> {k.selo.cor.nome} · selo {k.selo.codigo} · tom {k.tom.numero}</div>
        <p className="an-dom">{ts.palavras.join(' · ')}</p>
      </div>
      {k.bissexto && (
        <p className="an-nota">
          Você nasceu num 29 de fevereiro, o dia "fora do tempo" do Sincronário. {entrada.hora
            ? `Pela hora (${entrada.hora}), seu Kin é o do dia ${Number(entrada.hora.split(':')[0]) >= 12 ? '1º de março' : '28 de fevereiro'}.`
            : 'Sem a hora, usamos o do dia 28 de fevereiro (antes do meio-dia). Se nasceu à tarde, o seu é o do dia 1º de março.'}
        </p>
      )}

      <h3>Seu selo: {k.selo.nomeCompleto}</h3>
      <p>{ts.texto}</p>
      <p><strong>A sombra:</strong> {ts.sombra}</p>

      <h3>Seu tom: {k.tom.numero}, {tomNome}</h3>
      <p className="kin-pergunta">“{tt.pergunta}”</p>
      <p>{tt.texto}</p>

      <h3>Sua cor</h3>
      <p>{TEXTO_COR[k.selo.cor.nome]}</p>

      <h2>Seu oráculo</h2>
      <p className="an-lead">Quatro Kins rodeiam o seu. Cada um tem um papel na sua vida.</p>
      <Oraculo o={k.oraculo} />
      <ul className="kin-oraculo-lista">
        {['guia', 'analogo', 'antipoda', 'oculto'].map((p) => (
          <li key={p}><b>{TEXTO_ORACULO[p].titulo} — {nomeDoKin(k.oraculo[p])}.</b> {TEXTO_ORACULO[p].texto}</li>
        ))}
      </ul>

      <h3>Sua Onda Encantada</h3>
      <p>
        Os 260 Kins se dividem em 20 ondas de 13 dias. Você nasceu na <strong>Onda Encantada {doSelo(k.onda.selo)}</strong>,
        no dia {k.onda.posicao} de 13 — {TEXTO_TOM[k.onda.posicao].hoje.split(' — ')[0]}. É o pano de fundo da sua jornada.
      </p>

      <div className="an-pratica">
        <span className="an-eyebrow">Na prática</span>
        <p>O selo é <strong>o que você é</strong>; o tom é <strong>como você faz</strong>.</p>
        <p>
          No seu caso: você veio pra {ts.palavras[0].toLowerCase()} ({k.selo.nomeCompleto}) e faz isso pelo tom {k.tom.numero}:{' '}
          {tt.palavras[0].toLowerCase()} e {tt.palavras[1].toLowerCase()}. A pergunta que guia a sua vida é “{tt.pergunta}”
        </p>
      </div>

      <div className="an-cta">
        <p>
          Seu Kin é uma camada. O Manual Intuitive cruza numerologia, astrologia e arquétipos pra mostrar quem você é
          no amor, no trabalho e no que está travando agora.
        </p>
        <div className="an-cta-btns">
          <button type="button" className="an-btn" onClick={onCta}>Ver minha prévia grátis ✦</button>
          <Link href="/seu-dia" className="an-btn sec" onClick={() => evento('kin_cta_seu_dia')}>Meu dia de hoje</Link>
        </div>
      </div>
    </>
  );
}

function Celula({ o, papel }) {
  const s = seloDoKin(o[papel]);
  return (
    <div className={`kin-cel ${papel}`} style={{ borderColor: s.cor.hex }}>
      <span className="kin-cel-papel">{TEXTO_ORACULO[papel].curto}</span>
      <strong>{s.nomeCompleto}</strong>
      <span className="kin-cel-k">Kin {o[papel]}</span>
    </div>
  );
}

function Oraculo({ o }) {
  return (
    <div className="kin-cruz">
      {['guia', 'antipoda', 'destino', 'analogo', 'oculto'].map((p) => <Celula key={p} o={o} papel={p} />)}
    </div>
  );
}

function KinDeHoje({ dataISO }) {
  const kin = kinDaData(dataISO);
  const s = seloDoKin(kin);
  const t = tomDoKin(kin);
  const onda = ondaEncantada(kin);
  return (
    <section className="an-sec">
      <h2>O Kin de hoje</h2>
      <div className="an-mini" style={{ cursor: 'default' }}>
        <span className="an-eyebrow">Kin {kin} · Onda {doSelo(onda.selo)}, dia {onda.posicao} de 13</span>
        <strong>{nomeDoKin(kin)}</strong>
        <span className="an-sub">{TEXTO_SELO[s.codigo].hoje} No tom {t.numero}: {TEXTO_TOM[t.numero].hoje}.</span>
      </div>
      <p className="an-nota" style={{ marginTop: 14 }}>
        No <Link className="an-link" href="/seu-dia">Seu Dia</Link> o Kin de hoje entra cruzado com o seu: se é dia do seu guia, do seu desafio ou da sua força oculta.
      </p>
    </section>
  );
}

function Sobre() {
  return (
    <section className="an-sec">
      <h2>O que é o Kin Maia</h2>
      <p>
        O Tzolkin é o calendário sagrado maia de 260 dias: 20 selos combinados com 13 tons. O Sincronário da Paz
        (Dreamspell), criado por José Argüelles, adaptou essa contagem pro calendário do dia a dia — e é o sistema que a
        maioria das pessoas usa quando fala em "Kin Maia". A contagem dos guardiões do calendário na Guatemala é outra;
        aqui o cálculo segue o Sincronário.
      </p>
      <h3>Os 20 selos</h3>
      <ul className="an-lista">
        {SELOS.map((s) => (
          <li key={s.codigo}>
            <span className="kin-li">
              <span className="n">{s.codigo}</span>
              {s.nomeCompleto}
              <span className="d">{TEXTO_SELO[s.codigo].palavras[0]}</span>
            </span>
          </li>
        ))}
      </ul>
      <h3>Os 13 tons</h3>
      <p>
        {Object.entries(TEXTO_TOM).map(([n, t]) => `${n}. ${t.palavras[0]}`).join(' · ')}. Cada onda de 13 dias percorre os
        13 tons, do propósito (1) à presença (13).
      </p>
    </section>
  );
}

const CSS_KIN = `
  .kin-num { font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.24em; color: var(--muted); margin-top: 10px; text-transform: uppercase; }
  .kin-nome { font-size: clamp(28px, 7.5vw, 44px); line-height: 1.15; text-wrap: balance; }
  .kin-cor { display: inline-flex; align-items: center; gap: 8px; font-size: 16px; color: var(--muted); margin-top: 6px; }
  .kin-cor span { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
  .kin-pergunta { font-style: italic; font-size: 22px; color: var(--ouro); margin: 6px 0; }
  .kin-cruz { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0 6px; }
  .kin-cel { border: 1px solid; border-radius: 14px; padding: 10px 8px; text-align: center; background: rgba(10,1,24,0.5); display: flex; flex-direction: column; gap: 2px; }
  .kin-cel strong { font-family: 'Cinzel', serif; font-size: 13px; line-height: 1.25; }
  .kin-cel-papel { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); font-family: 'Cinzel', serif; }
  .kin-cel-k { font-size: 14px; color: var(--muted); }
  .kin-cel.guia { grid-column: 2; grid-row: 1; }
  .kin-cel.antipoda { grid-column: 1; grid-row: 2; }
  .kin-cel.destino { grid-column: 2; grid-row: 2; background: rgba(245,212,138,0.12); border-width: 2px; }
  .kin-cel.analogo { grid-column: 3; grid-row: 2; }
  .kin-cel.oculto { grid-column: 2; grid-row: 3; }
  .kin-oraculo-lista { padding-left: 18px; }
  .kin-oraculo-lista li { font-size: 17px; margin: 6px 0; }
  .kin-li { display: flex; gap: 10px; align-items: baseline; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 17px; }
  .kin-li .n { font-family: 'Cinzel', serif; font-size: 12px; color: var(--muted); min-width: 22px; }
  .kin-li .d { margin-left: auto; font-size: 14px; color: var(--muted); }
`;
