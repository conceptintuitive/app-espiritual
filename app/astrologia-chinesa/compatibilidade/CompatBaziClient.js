'use client';

// /astrologia-chinesa/compatibilidade — sinastria BaZi entre duas pessoas.
// 100% no browser (lib/bazi.js + lib/baziCompat.js), textos fixos
// (lib/baziCompatTextos.js): sem API, sem banco, sem IA.
// A pessoa 1 pode chegar pré-preenchida do /astrologia-chinesa via
// sessionStorage (CHAVE_COMPAT_PESSOA1) — nunca por query string (nome e data de
// nascimento não vão pra URL, GA4 nem logs).

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import CidadeAutocomplete from '@/app/components/CidadeAutocomplete';
import { salvarCeuDados } from '@/lib/ceuDados';
import { calcularBazi, TRONCOS, RAMOS, ELEMENTOS, NOMES_POSICAO } from '@/lib/bazi';
import { compatibilidadeBazi, CHAVE_COMPAT_PESSOA1 } from '@/lib/baziCompat';
import CtaMapa from '@/app/components/CtaMapa';
import {
  NIVEL_COMPAT, textoDiaMestre, textoDeuses, textoPalacio, textosOcultos, textosClima,
  resumoClima, textoAnimais, textoCruzada, pontosResumo, conselhoFinal,
} from '@/lib/baziCompatTextos';

const ORDEM_TABELA = ['hora', 'dia', 'mes', 'ano'];
const URL_PAGINA = 'https://intuitiveconcept.com.br/astrologia-chinesa/compatibilidade';

const VAZIA = { nome: '', data: '', hora: '', naoSeiHora: false, cidadeTexto: '', cidade: null };

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'astrologia_chinesa', ...params }); } catch {}
}

function validar(p, rotulo) {
  if (!p.nome.trim()) return `Coloque o nome da ${rotulo}.`;
  const ano = Number(p.data.slice(0, 4));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.data) || ano < 1900 || ano > new Date().getFullYear()) return `Confira a data de nascimento da ${rotulo}.`;
  if (!p.naoSeiHora && !/^\d{2}:\d{2}$/.test(p.hora)) return `Informe a hora da ${rotulo} (ou marque "não sei a hora").`;
  return '';
}

function mapaDe(p) {
  return calcularBazi({
    data: p.data,
    hora: p.naoSeiHora ? null : p.hora,
    tz: p.cidade?.tz || 'America/Sao_Paulo',
    lon: p.cidade?.lon ?? null,
  });
}

export default function CompatBaziClient() {
  const router = useRouter();
  const resultadoRef = useRef(null);
  const [p1, setP1] = useState(VAZIA);
  const [p2, setP2] = useState(VAZIA);
  const [erro, setErro] = useState('');
  const [entrada, setEntrada] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // Pré-preenche a pessoa 1 vindo do /astrologia-chinesa (consumido uma vez).
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(CHAVE_COMPAT_PESSOA1);
      if (!raw) return;
      window.sessionStorage.removeItem(CHAVE_COMPAT_PESSOA1);
      const d = JSON.parse(raw);
      if (!d?.data) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage só existe no browser; leitura única no mount
      setP1({
        nome: d.nome || '',
        data: d.data,
        hora: d.hora || '',
        naoSeiHora: !d.hora,
        cidade: d.cidade || null,
        cidadeTexto: d.cidade ? `${d.cidade.nome}, ${d.cidade.uf}` : '',
      });
    } catch {}
  }, []);

  const calc = useMemo(() => {
    if (!entrada) return null;
    try {
      const a = mapaDe(entrada.p1);
      const b = mapaDe(entrada.p2);
      return { a, b, c: compatibilidadeBazi(a, b) };
    } catch {
      return null;
    }
  }, [entrada]);

  function calcular(e) {
    e.preventDefault();
    const msg = validar(p1, 'primeira pessoa') || validar(p2, 'segunda pessoa');
    setErro(msg);
    if (msg) return;
    setEntrada({ p1: { ...p1, nome: p1.nome.trim() }, p2: { ...p2, nome: p2.nome.trim() } });
    setCopiado(false);
    evento('bazi_compat_calcular', { com_hora: !p1.naoSeiHora && !p2.naoSeiHora });
    setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  async function compartilhar() {
    const { pontuacao, nivel } = calc.c;
    const texto = `Fiz nossa compatibilidade na astrologia chinesa (BaZi): ${pontuacao}% — ${NIVEL_COMPAT[nivel].titulo}. Faz a sua:`;
    evento('bazi_compat_compartilhar', { nivel });
    try {
      if (navigator.share) {
        await navigator.share({ text: texto, url: URL_PAGINA });
        return;
      }
    } catch {
      return; // cancelou o share nativo
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${URL_PAGINA}`)}`, '_blank', 'noopener');
    setCopiado(true);
  }

  function irProManual() {
    evento('bazi_compat_cta_manual');
    const p = entrada.p1;
    salvarCeuDados({
      nome: p.nome,
      dataNascimento: p.data,
      hora: p.naoSeiHora ? null : p.hora,
      cidade: p.cidade
        ? { ibge: p.cidade.ibge, nome: p.cidade.nome, uf: p.cidade.uf, lat: p.cidade.lat, lon: p.cidade.lon, tz: p.cidade.tz }
        : null,
    });
    router.push('/');
  }

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@500;700&display=swap"
        rel="stylesheet"
      />
      <SiteNav active="astrologia-chinesa" />

      <header className="hero">
        <span className="glyph">合婚</span>
        <h1>Compatibilidade na astrologia chinesa</h1>
        <p className="tagline">
          Não é só o animal do ano. O BaZi cruza os dois mapas inteiros: quem vocês são no centro, como cada um vive
          a intimidade, a atração que fica escondida e se um traz o que falta no outro.
        </p>
      </header>

      <form className="form" onSubmit={calcular}>
        <PessoaForm titulo="Pessoa 1" p={p1} setP={setP1} placeholderNome="Ex: Bianca" />
        <PessoaForm titulo="Pessoa 2" p={p2} setP={setP2} placeholderNome="Ex: Leo" />
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" className="btn">Ver nossa compatibilidade</button>
        <p className="privacidade">Calculado no seu navegador. Seus dados ficam só neste aparelho.</p>
      </form>

      {calc && entrada && (
        <section ref={resultadoRef} className="resultado">
          <Resultado
            {...calc}
            nomeA={entrada.p1.nome}
            nomeB={entrada.p2.nome}
            onCompartilhar={compartilhar}
            copiado={copiado}
            onCta={irProManual}
          />
        </section>
      )}

      {!calc && <Sobre />}

      <style jsx global>{`
        body { margin: 0; }
        :root {
          --bg1: #0a0118; --bg2: #130828;
          --primary: #ec4899; --secondary: #8b5cf6; --warning: #f59e0b;
          --text: #faf5ff; --muted: rgba(233,213,255,0.72);
          --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
          --bom: #4ade80; --ruim: #f87171;
        }
        .wrap { min-height: 100vh; background: linear-gradient(180deg, var(--bg1), var(--bg2)); color: var(--text); font-family: 'Cormorant Garamond', Georgia, serif; padding-bottom: 80px; }
        .hero { text-align: center; padding: 48px 20px 8px; }
        .glyph { font-family: 'Noto Serif SC', serif; font-size: 34px; color: var(--warning); display: block; letter-spacing: 0.2em; }
        h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(24px, 5vw, 34px); margin: 16px auto 10px; max-width: 640px; text-wrap: balance; }
        .tagline { font-size: 19px; color: var(--muted); max-width: 580px; margin: 0 auto 28px; line-height: 1.55; }

        .form { max-width: 760px; margin: 0 auto; padding: 22px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px 22px; border: 1px solid var(--border); border-radius: 18px; background: rgba(139,92,246,0.06); }
        .form > .erro, .form > .btn, .form > .privacidade { grid-column: 1 / -1; }
        @media (max-width: 640px) { .form { grid-template-columns: 1fr; margin: 0 14px; } }
        .pessoa { display: grid; gap: 12px; align-content: start; }
        .pessoa h2 { font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--warning); margin: 0; }
        .form label { display: grid; gap: 6px; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
        .form .hint { text-transform: none; letter-spacing: 0; font-family: 'Cormorant Garamond', serif; font-size: 14px; opacity: 0.8; }
        .form input:not([type=checkbox]), .cidade-input {
          width: 100%; box-sizing: border-box; background: rgba(10,1,24,0.8); color: var(--text);
          border: 1px solid var(--border-strong); border-radius: 12px; padding: 12px 14px;
          font-family: 'Cormorant Garamond', serif; font-size: 18px; color-scheme: dark;
        }
        .form input:disabled { opacity: 0.4; }
        .form .check { display: flex; align-items: center; gap: 8px; text-transform: none; letter-spacing: 0; font-family: 'Cormorant Garamond', serif; font-size: 17px; }
        .erro { color: #fca5a5; margin: 0; font-size: 16px; }
        .btn { font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px; letter-spacing: 0.06em; color: #fff; background: linear-gradient(135deg, var(--secondary), var(--primary)); border: 0; border-radius: 999px; padding: 15px 20px; cursor: pointer; }
        .btn-sec { font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px; letter-spacing: 0.06em; color: var(--text); background: transparent; border: 1px solid var(--border-strong); border-radius: 999px; padding: 13px 20px; cursor: pointer; }
        .privacidade { text-align: center; font-size: 14px; color: var(--muted); margin: 0; }

        .resultado, .sobre { max-width: 760px; margin: 0 auto; padding: 40px 20px 0; scroll-margin-top: 16px; }
        .resultado h2, .sobre h2 { font-family: 'Cinzel', serif; font-size: clamp(20px, 4vw, 26px); margin: 44px 0 6px; text-wrap: balance; }
        .resultado h3, .sobre h3 { font-family: 'Cinzel', serif; font-size: 17px; margin: 22px 0 6px; color: var(--warning); letter-spacing: 0.04em; }
        .resultado p, .sobre p, .resultado li { font-size: 19px; line-height: 1.6; }
        .eyebrow { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warning); }
        .lead { font-size: 21px !important; color: var(--muted); }
        .nota { font-size: 16px !important; color: var(--muted); border-left: 2px solid var(--warning); padding-left: 12px; }

        .placar { text-align: center; }
        .placar .nomes { font-family: 'Cinzel', serif; font-size: clamp(20px, 5vw, 28px); margin: 8px 0 0; }
        .placar .pct { font-family: 'Cinzel', serif; font-weight: 900; font-size: clamp(56px, 16vw, 88px); line-height: 1; margin: 10px 0 4px; background: linear-gradient(135deg, var(--warning), var(--primary)); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .placar .nivel { font-family: 'Cinzel', serif; font-size: 20px; margin: 0 0 8px; }

        .mapas { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 28px 0 8px; }
        @media (max-width: 640px) { .mapas { grid-template-columns: 1fr; } }
        .mapa-nome { font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 0 0 6px; text-align: center; }
        .pilares { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .pilar { border: 1px solid var(--border); border-radius: 12px; padding: 8px 4px; text-align: center; background: rgba(139,92,246,0.05); }
        .pilar.eu { border-color: var(--warning); background: rgba(245,158,11,0.08); }
        .pilar .rot { font-family: 'Cinzel', serif; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
        .pilar .hz { font-family: 'Noto Serif SC', serif; font-size: 28px; line-height: 1.15; display: block; }
        .pilar .sub { font-size: 12.5px; line-height: 1.2; display: block; color: var(--muted); }
        .pilar.vazio .hz { opacity: 0.25; }

        .lados { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 20px; }
        @media (max-width: 640px) { .lados { grid-template-columns: 1fr; } }
        .lado { border-radius: 16px; padding: 14px 16px; border: 1px solid var(--border); background: rgba(139,92,246,0.05); }
        .lado h3 { margin: 0 0 6px; }
        .lado.favor h3 { color: var(--bom); }
        .lado.atrito h3 { color: var(--ruim); }
        .lado ul { margin: 0; padding-left: 18px; }
        .lado li { font-size: 17px !important; margin: 4px 0; }

        .card { border: 1px solid var(--border); border-radius: 18px; padding: 18px 20px; margin: 16px 0; background: rgba(139,92,246,0.05); }
        .card h3 { margin-top: 0; }
        .card p { margin: 6px 0; }
        .ocultos { font-size: 16px !important; color: var(--muted); }
        .tag { font-family: 'Cinzel', serif; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }
        .tag.bom { color: var(--bom); border: 1px solid rgba(74,222,128,0.4); }
        .tag.ruim { color: var(--ruim); border: 1px solid rgba(248,113,113,0.4); }

        .acoes { display: grid; gap: 10px; max-width: 420px; margin: 28px auto 0; }
        .cta-box { text-align: center; margin: 56px 0 0; padding: 28px 22px; border-radius: 20px; border: 1px solid var(--border-strong); background: radial-gradient(circle at 50% 0%, rgba(236,72,153,0.18), rgba(19,8,40,0.9) 70%); }
        .cta-box p { margin: 8px auto 18px; max-width: 520px; }
      `}</style>
    </div>
  );
}

function PessoaForm({ titulo, p, setP, placeholderNome }) {
  const set = (campo) => (e) => setP((x) => ({ ...x, [campo]: e.target.value }));
  return (
    <div className="pessoa">
      <h2>{titulo}</h2>
      <label>
        Primeiro nome
        <input value={p.nome} onChange={set('nome')} placeholder={placeholderNome} />
      </label>
      <label>
        Data de nascimento
        <input type="date" value={p.data} onChange={set('data')} max={hojeISO()} />
      </label>
      <label>
        Hora <span className="hint">(a do relógio, como está na certidão)</span>
        <input type="time" value={p.hora} onChange={set('hora')} disabled={p.naoSeiHora} />
      </label>
      <label className="check">
        <input type="checkbox" checked={p.naoSeiHora} onChange={(e) => setP((x) => ({ ...x, naoSeiHora: e.target.checked }))} />
        Não sei a hora
      </label>
      <label>
        Cidade onde nasceu
        <CidadeAutocomplete
          tema="quiz"
          value={p.cidadeTexto}
          placeholder="Ex: Vitória, ES"
          inputClassName="cidade-input"
          onChangeText={(t) => setP((x) => ({ ...x, cidadeTexto: t, cidade: null }))}
          onSelect={(m) => setP((x) => ({ ...x, cidade: m, cidadeTexto: `${m.nome}, ${m.uf}` }))}
        />
      </label>
    </div>
  );
}

function MiniMapa({ mapa, nome }) {
  return (
    <div>
      <p className="mapa-nome">{nome}</p>
      <div className="pilares">
        {ORDEM_TABELA.map((pos) => {
          const p = mapa[pos];
          if (!p) {
            return (
              <div key={pos} className="pilar vazio">
                <span className="rot">{NOMES_POSICAO[pos]}</span>
                <span className="hz">？</span>
                <span className="sub">sem hora</span>
              </div>
            );
          }
          const t = TRONCOS[p.tronco];
          const r = RAMOS[p.ramo];
          return (
            <div key={pos} className={`pilar${pos === 'dia' ? ' eu' : ''}`}>
              <span className="rot">{NOMES_POSICAO[pos]}</span>
              <span className="hz" style={{ color: ELEMENTOS[t.elemento].cor }}>{t.hanzi}</span>
              <span className="sub">{ELEMENTOS[t.elemento].nome} {t.yang ? 'Yang' : 'Yin'}</span>
              <span className="hz" style={{ color: ELEMENTOS[r.elemento].cor }}>{r.hanzi}</span>
              <span className="sub">{r.animal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Resultado({ a, b, c, nomeA, nomeB, onCompartilhar, copiado, onCta }) {
  const nivel = NIVEL_COMPAT[c.nivel];
  const { favor, atrito } = pontosResumo(c, nomeA, nomeB);
  const ocultos = textosOcultos(c, a, b, nomeA, nomeB);
  const cruzadas = c.cruzadas.map((x) => textoCruzada(x, nomeA, nomeB));
  const semHora = !a.hora || !b.hora;

  return (
    <>
      <div className="placar">
        <span className="eyebrow">Compatibilidade BaZi</span>
        <p className="nomes">{nomeA} + {nomeB}</p>
        <p className="pct">{c.pontuacao}%</p>
        <p className="nivel">{nivel.titulo}</p>
        <p className="lead">{nivel.texto}</p>
      </div>

      <div className="mapas">
        <MiniMapa mapa={a} nome={nomeA} />
        <MiniMapa mapa={b} nome={nomeB} />
      </div>
      {semHora && (
        <p className="nota">Sem a hora de nascimento, o pilar da hora fica de fora — a leitura vale para o resto do mapa.</p>
      )}

      <div className="lados">
        <div className="lado favor">
          <h3>O que puxa a favor</h3>
          {favor.length ? <ul>{favor.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="ocultos">Nenhuma grande atração estrutural — a conexão vem da escolha, não do mapa.</p>}
        </div>
        <div className="lado atrito">
          <h3>Onde está o atrito</h3>
          {atrito.length ? <ul>{atrito.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="ocultos">Nenhum choque estrutural entre os dois mapas.</p>}
        </div>
      </div>

      <span className="eyebrow" style={{ display: 'block', marginTop: 44 }}>O centro dos mapas</span>
      <h2 style={{ marginTop: 6 }}>{TRONCOS[a.diaMestre].hanzi} + {TRONCOS[b.diaMestre].hanzi}: o encontro dos Day Masters</h2>
      <p>{textoDiaMestre(c, a, b, nomeA, nomeB)}</p>
      {textoDeuses(c, nomeA, nomeB).map((t) => <p key={t} className="nota">{t}</p>)}

      <h2>O palácio do cônjuge: {RAMOS[c.palacio.ramos[0]].animal} + {RAMOS[c.palacio.ramos[1]].animal}</h2>
      <p>{textoPalacio(c, nomeA, nomeB)}</p>

      {ocultos.length > 0 && (
        <>
          <h2>A atração que não aparece</h2>
          {ocultos.map((t) => <p key={t}>{t}</p>)}
        </>
      )}

      <h2>Um completa o outro?</h2>
      <p className="lead">{resumoClima(c)}</p>
      {textosClima(c, nomeA, nomeB).map((t) => <div key={t} className="card"><p>{t}</p></div>)}

      <h2>Os animais do ano: {RAMOS[c.animais.ramos[0]].animal} + {RAMOS[c.animais.ramos[1]].animal}</h2>
      <p>{textoAnimais(c, nomeA, nomeB)}</p>

      {cruzadas.length > 0 && (
        <>
          <h2>Outros encontros entre os mapas</h2>
          {cruzadas.map((x, i) => (
            <div key={i} className="card">
              <h3>
                {x.titulo}
                <span className={`tag ${x.positivo ? 'bom' : 'ruim'}`}>{x.positivo ? 'afinidade' : 'atrito'}</span>
              </h3>
              <p className="ocultos">{x.onde}</p>
              <p>{x.texto}</p>
            </div>
          ))}
        </>
      )}

      <p className="nota" style={{ marginTop: 32 }}>{conselhoFinal(c, nomeA, nomeB)}</p>

      <div className="acoes">
        <button type="button" className="btn-sec" onClick={onCompartilhar}>Mandar pra {nomeB}</button>
        {copiado && <p className="privacidade">Só o resultado vai na mensagem — datas e horas não saem do seu celular.</p>}
      </div>

      <div className="cta-box">
        <span className="eyebrow">Próxima camada</span>
        <h2 style={{ marginTop: 8 }}>Isso é o encontro. O Manual do seu Mapa é a leitura inteira.</h2>
        <p>
          O Manual do Mapa de {nomeA} cruza o BaZi com o mapa astral (Sol, Lua, Ascendente) e a numerologia — e mostra o
          seu jeito de amar, o seu ponto cego nas relações e o que fazer nas próximas 4 semanas.
        </p>
        <CtaMapa className="btn" onFazer={onCta} origem="compat-bazi" />
      </div>
    </>
  );
}

function Sobre() {
  return (
    <section className="sobre">
      <h2>Por que o animal do ano não basta</h2>
      <p>
        &quot;Cachorro combina com Tigre&quot; é a camada mais rasa da astrologia chinesa: o animal do ano fala de imagem
        social e geração, não de intimidade. No BaZi, a compatibilidade de casal (合婚, &quot;unir casamento&quot;) olha
        primeiro para o centro de cada mapa — o tronco do dia, o Day Master — e para o ramo do dia, o palácio do cônjuge.
      </p>
      <h3>O que esta leitura cruza</h3>
      <p>
        Os dois Day Masters (se combinam, se nutrem ou se chocam), os dois palácios do cônjuge, a atração escondida nos
        elementos ocultos, o clima de cada mapa — quem nasceu no inverno pede Fogo, quem nasceu no verão pede Água — e
        todos os outros encontros entre os oito pilares.
      </p>
      <h3>Por que a hora e a cidade importam</h3>
      <p>
        A hora define o quarto pilar, e a cidade corrige o horário pelo sol do lugar (e pelo horário de verão da época).
        Sem a hora, a leitura continua valendo para os outros três pilares.
      </p>
    </section>
  );
}
