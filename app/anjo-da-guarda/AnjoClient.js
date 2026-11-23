'use client';

// /anjo-da-guarda — os 72 anjos da Cabala, grátis, calculado no browser
// (lib/anjos.js) com textos fixos (lib/anjosTextos.js). Sem API, sem banco,
// sem IA. CTA pro quiz pré-preenchido via lib/ceuDados.js (nunca query string).

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import { salvarCeuDados } from '@/lib/ceuDados';
import { lerPerfil, ouvirPerfil, salvarSeForMeu } from '@/lib/perfilLocal';
import PerfilBarra from '@/app/components/PerfilBarra';
import VoceTambem from '@/app/components/VoceTambem';
import { ANJOS, calcularAnjos, dadosDoAnjo, anjosDoMomento } from '@/lib/anjos';
import { TEXTO_ANJO, TEXTO_CORO, TEXTO_ELEMENTO_ANJO, BUSCA_CAMINHO } from '@/lib/anjosTextos';
import { CSS_ANJO, FONTES_ANJO } from './estilo';
import CtaMapa from '@/app/components/CtaMapa';

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'anjo_da_guarda', ...params }); } catch {}
}

export default function AnjoClient({ periodos, ano }) {
  const router = useRouter();
  const resultadoRef = useRef(null);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [naoSeiHora, setNaoSeiHora] = useState(false);
  const [erro, setErro] = useState('');
  const [entrada, setEntrada] = useState(null);
  const [momento, setMomento] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const formRef = useRef(null);

  function mostrarPerfil(p) {
    setNome(p.nome || '');
    setData(p.dataNascimento);
    setHora(p.hora || '');
    setNaoSeiHora(!p.hora);
    setEntrada({ nome: p.nome || '', data: p.dataNascimento, hora: p.hora || null, cidade: p.cidade || null });
  }

  // Perfil salvo neste aparelho: abre já com o resultado da pessoa.
  useEffect(() => {
    const p = lerPerfil();
    setPerfil(p);
    if (p) mostrarPerfil(p);
    return ouvirPerfil(setPerfil);
  }, []);

  function outraPessoa() {
    setEntrada(null);
    setNome(''); setData(''); setHora(''); setNaoSeiHora(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }

  // Anjo do dia/da hora: só no browser (evita diferença de hidratação).
  useEffect(() => {
    const atualizar = () => setMomento(anjosDoMomento(new Date()));
    atualizar();
    const id = setInterval(atualizar, 60000);
    return () => clearInterval(id);
  }, []);

  const anjos = useMemo(() => {
    if (!entrada) return null;
    try { return calcularAnjos({ data: entrada.data, hora: entrada.hora, tz: entrada.cidade?.tz || 'America/Sao_Paulo' }); } catch { return null; }
  }, [entrada]);

  function calcular(e) {
    e.preventDefault();
    setErro('');
    const a = Number(data.slice(0, 4));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || a < 1900 || a > new Date().getFullYear()) {
      setErro('Confira a data de nascimento.');
      return;
    }
    if (!naoSeiHora && !/^\d{2}:\d{2}$/.test(hora)) {
      setErro('Informe a hora (ou marque "não sei a hora").');
      return;
    }
    const mesma = perfil?.dataNascimento === data;
    const nova = { nome: nome.trim(), data, hora: naoSeiHora ? null : hora, cidade: mesma ? perfil.cidade : null };
    setEntrada(nova);
    salvarSeForMeu({ nome: nova.nome, dataNascimento: data, hora: nova.hora });
    evento('anjo_calcular', { com_hora: !naoSeiHora });
    setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function irProManual() {
    evento('anjo_cta_manual');
    salvarCeuDados({ nome: entrada.nome, dataNascimento: entrada.data, hora: entrada.hora, cidade: entrada.cidade || null });
    router.push('/');
  }

  return (
    <div className="an-wrap">
      <link href={FONTES_ANJO} rel="stylesheet" />
      <SiteNav active="anjo" />

      <header className="an-hero">
        <span className="an-glyph">✶</span>
        <h1>Qual é o seu Anjo da Guarda?</h1>
        <p className="an-tagline">
          Na Cabala, 72 anjos dividem o céu. O seu é o que regia o ponto exato onde o Sol estava quando você nasceu —
          e a hora do nascimento revela um segundo anjo: o da sua mente.
        </p>
      </header>

      <form ref={formRef} className="an-form" onSubmit={calcular}>
        <label>
          Seu primeiro nome
          <input className="an-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Bianca" autoComplete="given-name" />
        </label>
        <label>
          Data de nascimento
          <input className="an-input" type="date" value={data} onChange={(e) => setData(e.target.value)} max={hojeISO()} required />
        </label>
        <label>
          Hora de nascimento <span className="an-hint">(a do relógio, como está na certidão)</span>
          <input className="an-input" type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={naoSeiHora} />
        </label>
        <label className="an-check">
          <input type="checkbox" checked={naoSeiHora} onChange={(e) => setNaoSeiHora(e.target.checked)} />
          Não sei a hora
        </label>
        {erro && <p className="an-erro">{erro}</p>}
        <button type="submit" className="an-btn">Descobrir meu anjo</button>
        <p className="an-priv">Calculado no seu navegador. Seus dados ficam só neste aparelho.</p>
      </form>

      {anjos && entrada && (
        <>
          <PerfilBarra
            perfil={perfil}
            mostrando={entrada}
            onOutraPessoa={outraPessoa}
            onVoltarPraMim={() => perfil && mostrarPerfil(perfil)}
            onMudou={() => setPerfil(lerPerfil())}
          />
          <section ref={resultadoRef} className="an-sec">
            <Resultado anjos={anjos} entrada={entrada} periodos={periodos} ano={ano} onCta={irProManual} />
          </section>
          <VoceTambem dados={{ nome: entrada.nome, dataNascimento: entrada.data, hora: entrada.hora, cidade: entrada.cidade }} atual="anjo" />
        </>
      )}

      {momento && <AgoraNoCeu momento={momento} />}

      <Sobre />

      <section className="an-sec">
        <h2>Os 72 anjos e suas datas</h2>
        <p className="an-nota">
          Datas de {ano}, pelo Sol ao meio-dia de Brasília. Elas mudam 1 dia de um ano pro outro — por isso, se você nasceu
          na primeira ou na última data de um anjo, use a calculadora acima.
        </p>
        <ul className="an-lista">
          {ANJOS.map((a) => (
            <li key={a.n}>
              <Link href={`/anjo-da-guarda/${a.slug}`} className={anjos?.guardiao === a.n ? 'eu' : undefined}>
                <span className="n">{a.n}</span>
                {a.nome}
                <span className="d">{periodos[a.n - 1].inicio}–{periodos[a.n - 1].fim}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <style>{CSS_ANJO}</style>
    </div>
  );
}

function Resultado({ anjos, entrada, periodos, ano, onCta }) {
  const g = dadosDoAnjo(anjos.guardiao);
  const t = TEXTO_ANJO[g.n];
  const nomePessoa = entrada.nome ? `${entrada.nome}, seu` : 'Seu';
  const mente = anjos.mente ? dadosDoAnjo(anjos.mente) : null;
  const tm = mente ? TEXTO_ANJO[mente.n] : null;
  const p = periodos[g.n - 1];

  return (
    <>
      <div className="an-dois">
        <p><strong>Você tem dois anjos.</strong> Na Cabala, os 72 anjos dividem o tempo de duas formas:</p>
        <ul>
          <li><b>Pela data → anjo da guarda.</b> Seu protetor: quem você é na essência e o que você busca.</li>
          <li><b>Pela hora → anjo da mente.</b> Não protege: mostra como você pensa e decide.</li>
        </ul>
      </div>

      <div className="an-card">
        <span className="an-eyebrow">{nomePessoa} anjo da guarda</span>
        <span className="an-eyebrow an-por">pela data</span>
        <div className="an-nome">{g.nome}</div>
        <div className="an-num">nº {g.n} de 72 · coro dos {g.coro.nome}</div>
        <p className="an-dom">{t.dom}</p>
      </div>

      <p className="an-lead" style={{ marginTop: 22 }}>
        No instante em que você nasceu, o Sol estava a {anjos.grauNoSigno}° de {anjos.signoSolar}. Esse ponto do céu —
        de {g.grauInicio}° a {g.grauFim}° de {g.signo} — é regido por {g.nome}.
      </p>
      {anjos.trocaNoDia && (
        <p className="an-nota">
          No dia em que você nasceu o Sol passou de {dadosDoAnjo(anjos.trocaNoDia.de).nome} para{' '}
          {dadosDoAnjo(anjos.trocaNoDia.para).nome}. Sem a hora, mostramos o do meio-dia. Coloque a hora pra ter certeza.
        </p>
      )}
      {anjos.pertoDaTroca && (
        <p className="an-nota">
          Você nasceu a menos de uma hora da passagem do Sol pro anjo vizinho. Se a hora da certidão estiver arredondada,
          leia também {g.n === 72 ? dadosDoAnjo(1).nome : g.n === 1 ? dadosDoAnjo(72).nome : `${dadosDoAnjo(g.n - 1).nome} e ${dadosDoAnjo(g.n + 1).nome}`}.
        </p>
      )}

      <h3>Como ele aparece em você</h3>
      <p>{t.essencia}</p>
      <h3>A sombra</h3>
      <p>{t.sombra}</p>
      <h3>Como se conectar</h3>
      <p>{t.pratica}</p>
      <h3>O que pedir a {g.nome}</h3>
      <ul className="an-pedir">{t.pedir.map((x) => <li key={x}>{x}</li>)}</ul>

      <ul className="an-ficha">
        <li><b>Coro</b>{g.coro.nome}, sob o arcanjo {g.coro.arcanjo}</li>
        <li><b>Sefirá</b>{g.coro.sefira} — {g.coro.sefiraPt}</li>
        <li><b>Elemento</b>{g.elemento}</li>
        <li><b>Carta do tarô</b>{g.carta}</li>
        <li><b>Hora regente</b>{g.hora}, todos os dias</li>
        <li><b>Datas em {ano}</b>{p.inicio} a {p.fim}</li>
      </ul>
      <p className="an-nota" style={{ marginTop: 16 }}>{TEXTO_CORO[g.coro.nome]} {TEXTO_ELEMENTO_ANJO[g.elemento]}</p>

      {mente ? (
        <>
          <h2>O anjo da sua mente: {mente.nome}</h2>
          <span className="an-eyebrow an-por">como você pensa · pela hora</span>
          <p className="an-lead">
            Você nasceu às {entrada.hora}, nos 20 minutos que {mente.nome} rege ({mente.hora}). Ele não é o seu protetor
            principal: é o jeito como sua cabeça funciona.
          </p>
          <p>
            Com {mente.nome} na mente, você {tm.mente}. O dom dele é <em>{tm.dom.toLowerCase()}</em> — e é por esse filtro
            que você lê o mundo e toma decisões.
          </p>
          {mente.n === g.n && <p className="an-nota">Seu anjo guardião e o da mente são o mesmo: a energia de {g.nome} é dobrada em você.</p>}
          <p><Link className="an-link" href={`/anjo-da-guarda/${mente.slug}`}>Ler tudo sobre {mente.nome} →</Link></p>
        </>
      ) : null}

      <NaPratica g={g} mente={mente} />

      <div className="an-cta">
        <p>
          Seu anjo é uma camada. O Manual do seu Mapa cruza numerologia, astrologia e arquétipos pra mostrar quem você é
          no amor, no trabalho e no que está travando agora.
        </p>
        <div className="an-cta-btns">
          <CtaMapa className="an-btn" onFazer={onCta} origem="anjo" />
          <Link href="/seu-dia" className="an-btn sec" onClick={() => evento('anjo_cta_seu_dia')}>Meu dia de hoje</Link>
        </div>
      </div>
    </>
  );
}

function NaPratica({ g, mente }) {
  const [busca] = BUSCA_CAMINHO[g.n];
  const caminho = mente ? BUSCA_CAMINHO[mente.n][1] : null;
  return (
    <div className="an-pratica">
      <span className="an-eyebrow">Na prática</span>
      <p>O anjo da guarda é <strong>o que você busca</strong>; o da mente é <strong>como você chega lá</strong>.</p>
      {mente && mente.n === g.n && (
        <p>
          No seu caso: você quer {busca} e chega lá {caminho} — os dois são {g.nome}, então essa energia vem em dobro.
        </p>
      )}
      {mente && mente.n !== g.n && (
        <p>No seu caso: você quer {busca} ({g.nome}), {caminho} ({mente.nome}).</p>
      )}
      {!mente && (
        <p>
          No seu caso: você quer {busca} ({g.nome}). Coloque a hora de nascimento pra ver como você chega lá.
        </p>
      )}
      <p>
        Por isso duas pessoas nascidas no mesmo dia podem ser bem diferentes: o anjo da guarda é o mesmo, mas o anjo da
        mente muda com a hora.
      </p>
    </div>
  );
}

function AgoraNoCeu({ momento }) {
  const dia = dadosDoAnjo(momento.dia);
  const hora = dadosDoAnjo(momento.hora);
  return (
    <section className="an-sec">
      <h2>Agora no céu</h2>
      <div className="an-duo">
        <Link href={`/anjo-da-guarda/${dia.slug}`} className="an-mini">
          <span className="an-eyebrow">Anjo destes dias</span>
          <strong>{dia.nome}</strong>
          <span className="an-sub">{TEXTO_ANJO[dia.n].dom}. O Sol está no ponto que ele rege — bom momento pra pedir {TEXTO_ANJO[dia.n].pedir[0]}.</span>
        </Link>
        <Link href={`/anjo-da-guarda/${hora.slug}`} className="an-mini">
          <span className="an-eyebrow">Anjo desta hora · {hora.hora}</span>
          <strong>{hora.nome}</strong>
          <span className="an-sub">{TEXTO_ANJO[hora.n].dom}. Rege estes 20 minutos (horário de Brasília).</span>
        </Link>
      </div>
    </section>
  );
}

function Sobre() {
  return (
    <section className="an-sec">
      <h2>Quem são os 72 anjos</h2>
      <p>
        Os 72 anjos vêm do Shem HaMephorash, o "Nome Explicado" da Cabala: três versículos do Êxodo (14:19–21), com 72 letras
        cada, lidos em colunas formam 72 nomes de três letras. A tradição cabalística e a angeologia renascentista deram a
        cada nome um anjo, um coro e uma fatia do céu.
      </p>
      <h3>Por que pela posição do Sol</h3>
      <p>
        Cada anjo rege 5° do zodíaco — 72 × 5° = 360°. As tabelas de datas ("Vehuiah: 21 a 25 de março") são um atalho pra
        isso e falham em quem nasceu na virada, porque o Sol não chega ao mesmo grau na mesma data todo ano. Aqui o cálculo usa
        a posição real do Sol no seu nascimento, com o horário de verão da época.
      </p>
      <h3>O anjo da mente</h3>
      <p>
        O dia tem 72 blocos de 20 minutos, e cada anjo rege um deles. O anjo da hora em que você nasceu mostra como você pensa.
        Por isso duas pessoas com o mesmo anjo da guarda podem ser tão diferentes.
      </p>
    </section>
  );
}
