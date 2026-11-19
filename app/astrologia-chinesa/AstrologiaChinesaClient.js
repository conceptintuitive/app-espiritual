'use client';

// /astrologia-chinesa — mapa BaZi (4 Pilares) grátis, calculado 100% no
// browser (lib/bazi.js) com textos fixos (lib/baziTextos.js). Sem API, sem
// banco, sem IA: custo zero por leitura. O CTA leva pro quiz já preenchido
// (mesmo repasse do /ceu, via lib/ceuDados.js — nunca por query string).

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import CidadeAutocomplete from '@/app/components/CidadeAutocomplete';
import { salvarCeuDados } from '@/lib/ceuDados';
import {
  calcularBazi, TRONCOS, RAMOS, ELEMENTOS, DEZ_DEUSES, NOMES_POSICAO,
  nomePilar, dezDeuses, relacoesDoMapa, contarElementos, forcaDiaMestre, leituraDoAno,
} from '@/lib/bazi';
import {
  PAPEL_PILAR, DIA_MESTRE, ANIMAIS, SABOR_ELEMENTO_ANO, TEXTO_DEUSES,
  TEXTO_RELACOES, TEXTO_ELEMENTOS, TEXTO_FORCA,
} from '@/lib/baziTextos';
import { CHAVE_COMPAT_PESSOA1 } from '@/lib/baziCompat';

const ORDEM_TABELA = ['hora', 'dia', 'mes', 'ano']; // ordem tradicional: lê-se da direita pra esquerda
const ORDEM_LEITURA = ['ano', 'mes', 'dia', 'hora'];
const TEXTO_RAMO_POR_POSICAO = { ano: 'perfil', mes: 'mes', dia: 'intimo', hora: 'hora' };

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'astrologia_chinesa', ...params }); } catch {}
}

export default function AstrologiaChinesaClient() {
  const router = useRouter();
  const resultadoRef = useRef(null);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [naoSeiHora, setNaoSeiHora] = useState(false);
  const [cidadeTexto, setCidadeTexto] = useState('');
  const [cidade, setCidade] = useState(null);
  const [erro, setErro] = useState('');
  const [entrada, setEntrada] = useState(null);

  const mapa = useMemo(() => {
    if (!entrada) return null;
    try {
      return calcularBazi({
        data: entrada.data,
        hora: entrada.hora,
        tz: entrada.cidade?.tz || 'America/Sao_Paulo',
        lon: entrada.cidade?.lon ?? null,
      });
    } catch {
      return null;
    }
  }, [entrada]);

  function calcular(e) {
    e.preventDefault();
    setErro('');
    const ano = Number(data.slice(0, 4));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || ano < 1900 || ano > new Date().getFullYear()) {
      setErro('Confira a data de nascimento.');
      return;
    }
    if (!naoSeiHora && !/^\d{2}:\d{2}$/.test(hora)) {
      setErro('Informe a hora (ou marque "não sei a hora").');
      return;
    }
    setEntrada({ nome: nome.trim(), data, hora: naoSeiHora ? null : hora, cidade });
    evento('bazi_calcular', { com_hora: !naoSeiHora, com_cidade: !!cidade });
    setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function irProManual() {
    evento('bazi_cta_manual');
    salvarCeuDados({
      nome: entrada.nome,
      dataNascimento: entrada.data,
      hora: entrada.hora,
      cidade: entrada.cidade
        ? { ibge: entrada.cidade.ibge, nome: entrada.cidade.nome, uf: entrada.cidade.uf, lat: entrada.cidade.lat, lon: entrada.cidade.lon, tz: entrada.cidade.tz }
        : null,
    });
    router.push('/');
  }

  function irPraCompat() {
    evento('bazi_cta_compat');
    try {
      window.sessionStorage.setItem(CHAVE_COMPAT_PESSOA1, JSON.stringify({
        nome: entrada.nome,
        data: entrada.data,
        hora: entrada.hora,
        cidade: entrada.cidade
          ? { ibge: entrada.cidade.ibge, nome: entrada.cidade.nome, uf: entrada.cidade.uf, lat: entrada.cidade.lat, lon: entrada.cidade.lon, tz: entrada.cidade.tz }
          : null,
      }));
    } catch {}
    router.push('/astrologia-chinesa/compatibilidade');
  }

  return (
    <div className="wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@500;700&display=swap"
        rel="stylesheet"
      />
      <SiteNav active="astrologia-chinesa" />

      <header className="hero">
        <span className="glyph">八字</span>
        <h1>Astrologia chinesa: seus 4 Pilares do Destino</h1>
        <p className="tagline">
          Seu animal é só a primeira camada. O BaZi lê o ano, o mês, o dia e a hora do seu nascimento —
          e mostra quem você é por dentro, como você ama, trabalha e o que os próximos anos pedem.
        </p>
      </header>

      <form className="form" onSubmit={calcular}>
        <label>
          Seu primeiro nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Bianca" autoComplete="given-name" />
        </label>
        <label>
          Data de nascimento
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} max={hojeISO()} required />
        </label>
        <label>
          Hora de nascimento <span className="hint">(a do relógio, como está na certidão)</span>
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={naoSeiHora} />
        </label>
        <label className="check">
          <input type="checkbox" checked={naoSeiHora} onChange={(e) => setNaoSeiHora(e.target.checked)} />
          Não sei a hora
        </label>
        <label>
          Cidade onde nasceu <span className="hint">(corrige o horário pelo sol do lugar)</span>
          <CidadeAutocomplete
            tema="quiz"
            value={cidadeTexto}
            placeholder="Ex: Vitória, ES"
            inputClassName="cidade-input"
            onChangeText={(t) => { setCidadeTexto(t); setCidade(null); }}
            onSelect={(m) => { setCidade(m); setCidadeTexto(`${m.nome}, ${m.uf}`); }}
          />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" className="btn">Ver meu mapa chinês ✦</button>
        <p className="privacidade">Calculado no seu navegador. Nada é salvo.</p>
      </form>

      {mapa && entrada && (
        <section ref={resultadoRef} className="resultado">
          <Resultado mapa={mapa} entrada={entrada} onCta={irProManual} onCompat={irPraCompat} />
        </section>
      )}

      {!mapa && <SobreBazi />}

      <style jsx global>{`
        body { margin: 0; }
        :root {
          --bg1: #0a0118; --bg2: #130828;
          --primary: #ec4899; --secondary: #8b5cf6; --warning: #f59e0b;
          --text: #faf5ff; --muted: rgba(233,213,255,0.72);
          --border: rgba(216,180,254,0.15); --border-strong: rgba(216,180,254,0.3);
        }
        .wrap { min-height: 100vh; background: linear-gradient(180deg, var(--bg1), var(--bg2)); color: var(--text); font-family: 'Cormorant Garamond', Georgia, serif; padding-bottom: 80px; }
        .hero { text-align: center; padding: 48px 20px 8px; }
        .glyph { font-family: 'Noto Serif SC', serif; font-size: 34px; color: var(--warning); display: block; letter-spacing: 0.2em; }
        h1 { font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(24px, 5vw, 34px); margin: 16px auto 10px; max-width: 640px; text-wrap: balance; }
        .tagline { font-size: 19px; color: var(--muted); max-width: 560px; margin: 0 auto 28px; line-height: 1.55; }

        .form { max-width: 440px; margin: 0 auto; padding: 22px 20px; display: grid; gap: 14px; border: 1px solid var(--border); border-radius: 18px; background: rgba(139,92,246,0.06); }
        @media (max-width: 480px) { .form { margin: 0 14px; } }
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
        .privacidade { text-align: center; font-size: 14px; color: var(--muted); margin: 0; }

        .resultado, .sobre { max-width: 760px; margin: 0 auto; padding: 40px 20px 0; scroll-margin-top: 16px; }
        .resultado h2, .sobre h2 { font-family: 'Cinzel', serif; font-size: clamp(20px, 4vw, 26px); margin: 44px 0 6px; text-wrap: balance; }
        .resultado h3, .sobre h3 { font-family: 'Cinzel', serif; font-size: 17px; margin: 22px 0 6px; color: var(--warning); letter-spacing: 0.04em; }
        .resultado p, .sobre p, .resultado li { font-size: 19px; line-height: 1.6; }
        .eyebrow { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--warning); }
        .lead { font-size: 21px !important; color: var(--muted); }
        .nota { font-size: 16px !important; color: var(--muted); border-left: 2px solid var(--warning); padding-left: 12px; }

        .destaque { text-align: center; padding: 8px 0 0; }
        .destaque .animal { font-family: 'Cinzel', serif; font-size: clamp(28px, 7vw, 44px); font-weight: 900; margin: 6px 0; }

        .pilares { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 28px 0 8px; }
        .pilar { border: 1px solid var(--border); border-radius: 14px; padding: 12px 6px; text-align: center; background: rgba(139,92,246,0.05); }
        .pilar.eu { border-color: var(--warning); background: rgba(245,158,11,0.08); }
        .pilar .rot { font-family: 'Cinzel', serif; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
        .pilar .hz { font-family: 'Noto Serif SC', serif; font-size: clamp(30px, 8vw, 42px); line-height: 1.15; display: block; }
        .pilar .sub { font-size: 14px; line-height: 1.25; display: block; color: var(--muted); }
        .pilar .deus { font-size: 13px; display: block; margin-top: 6px; color: var(--warning); }
        .pilar.vazio .hz { opacity: 0.25; }

        .card { border: 1px solid var(--border); border-radius: 18px; padding: 18px 20px; margin: 16px 0; background: rgba(139,92,246,0.05); }
        .card h3 { margin-top: 0; }
        .card p { margin: 6px 0; }
        .ocultos { font-size: 16px !important; color: var(--muted); }

        .barras { display: grid; gap: 10px; margin: 18px 0; }
        .barra { display: grid; grid-template-columns: 92px 1fr 40px; align-items: center; gap: 10px; font-size: 17px; }
        .trilho { height: 10px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .trilho span { display: block; height: 100%; border-radius: 999px; }

        .cta-box { text-align: center; margin: 56px 0 0; padding: 28px 22px; border-radius: 20px; border: 1px solid var(--border-strong); background: radial-gradient(circle at 50% 0%, rgba(236,72,153,0.18), rgba(19,8,40,0.9) 70%); }
        .cta-box p { margin: 8px auto 18px; max-width: 520px; }
      `}</style>
    </div>
  );
}

const FEMININOS = new Set(['Serpente', 'Cabra']);
/** Artigo + contrações pro animal: art('Cabra').o → 'a', .do → 'da', .no → 'na'. */
function art(animal) {
  return FEMININOS.has(animal) ? { o: 'a', O: 'A', do: 'da', no: 'na' } : { o: 'o', O: 'O', do: 'do', no: 'no' };
}

function rotuloDeus(chave) {
  const d = DEZ_DEUSES[chave];
  return `${d.nome} (${d.hanzi})`;
}

function Resultado({ mapa, entrada, onCta, onCompat }) {
  const eu = mapa.diaMestre;
  const dm = DIA_MESTRE[eu];
  const elemEu = ELEMENTOS[TRONCOS[eu].elemento];
  const animalAno = RAMOS[mapa.ano.ramo];
  const nomeAnimal = nomePilar(mapa.ano.tronco, mapa.ano.ramo);
  const tratamento = entrada.nome ? `${entrada.nome}, você` : 'Você';
  const forca = forcaDiaMestre(mapa);
  const elementos = contarElementos(mapa);
  const maxEl = Math.max(...elementos);
  const relacoes = relacoesDoMapa(mapa);

  const anoAtual = calcularBazi({ data: hojeISO(), hora: null }).anoChines;
  const anos = [leituraDoAno(mapa, anoAtual), leituraDoAno(mapa, anoAtual + 1)];

  return (
    <>
      <div className="destaque">
        <span className="eyebrow">Seu animal chinês</span>
        <p className="animal">{nomeAnimal}</p>
        <p className="lead">
          {tratamento} nasceu no ano {art(animalAno.animal).do} {anoNascimentoTexto(mapa)} — {TRONCOS[mapa.ano.tronco].pinyin} {animalAno.pinyin} ({TRONCOS[mapa.ano.tronco].hanzi}{animalAno.hanzi}).
        </p>
      </div>
      <p>{ANIMAIS[mapa.ano.ramo].perfil} {SABOR_ELEMENTO_ANO[TRONCOS[mapa.ano.tronco].elemento]}</p>

      {mapa.hora && <NotaHorario mapa={mapa} entrada={entrada} />}
      {mapa.pertoDaTroca && (
        <p className="nota">
          Você nasceu a menos de ~1h de uma troca de mês solar chinês. Se a hora da certidão estiver arredondada, o pilar do mês (e, em janeiro/fevereiro, o do ano) pode ser o vizinho.
        </p>
      )}

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
              <span className="deus">{pos === 'dia' ? 'VOCÊ' : DEZ_DEUSES[dezDeuses(eu, p.tronco)].nome}</span>
            </div>
          );
        })}
      </div>

      <span className="eyebrow">O centro do seu mapa</span>
      <h2>Você é {elemEu.nome} {TRONCOS[eu].yang ? 'Yang' : 'Yin'}: {dm.imagem}</h2>
      <p className="lead">
        No BaZi, quem você é de verdade não é o animal do ano — é o tronco do seu DIA, o Day Master: {dm.titulo} ({TRONCOS[eu].hanzi}).
      </p>
      <p>{dm.essencia}</p>
      <h3>Forças</h3>
      <p>{dm.forcas}</p>
      <h3>Sombra</h3>
      <p>{dm.sombra}</p>
      <h3>No amor</h3>
      <p>{dm.amor}</p>
      <h3>Trabalho e dinheiro</h3>
      <p>{dm.trabalho}</p>
      <h3>O que te equilibra</h3>
      <p>{dm.equilibrio}</p>
      <p>{TEXTO_FORCA[forca.nivel]}</p>

      <span className="eyebrow">Pilar a pilar</span>
      <h2>O que cada pilar diz sobre você</h2>
      {ORDEM_LEITURA.map((pos) => (
        <CardPilar key={pos} pos={pos} mapa={mapa} />
      ))}

      <span className="eyebrow">Equilíbrio</span>
      <h2>Seus 5 elementos</h2>
      <div className="barras">
        {ELEMENTOS.map((el, i) => (
          <div key={el.slug} className="barra">
            <span>{el.hanzi} {el.nome}</span>
            <div className="trilho"><span style={{ width: `${(elementos[i] / maxEl) * 100}%`, background: el.cor }} /></div>
            <span>{elementos[i].toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
      {elementos.map((v, i) => (v === maxEl ? <p key={`x${i}`}>{TEXTO_ELEMENTOS[i].excesso}</p> : null))}
      {elementos.map((v, i) => (v < 0.5 ? <p key={`f${i}`}>{TEXTO_ELEMENTOS[i].falta}</p> : null))}
      <p className="nota">Contagem: cada tronco e cada ramo vale 1, o ramo do mês vale 2 (é a estação) e os elementos escondidos nos ramos valem 0,3.</p>

      {relacoes.length > 0 && (
        <>
          <span className="eyebrow">Dinâmicas internas</span>
          <h2>Como seus pilares conversam</h2>
          {relacoes.map((r, i) => (
            <div key={i} className="card">
              <h3>{TEXTO_RELACOES[r.tipo].titulo}: {NOMES_POSICAO[r.entre[0]]} × {NOMES_POSICAO[r.entre[1]]}</h3>
              <p>{descreverRelacao(r, mapa)}</p>
              <p className="ocultos">{TEXTO_RELACOES[r.tipo].texto}</p>
            </div>
          ))}
        </>
      )}

      <span className="eyebrow">Próximos anos</span>
      <h2>O que vem para {elemEu.nome} {TRONCOS[eu].yang ? 'Yang' : 'Yin'} + {animalAno.animal}</h2>
      {anos.map((a) => (
        <CardAno key={a.ano} leitura={a} mapa={mapa} />
      ))}

      <div className="card" style={{ textAlign: 'center', marginTop: 44 }}>
        <span className="eyebrow">Compatibilidade</span>
        <h3 style={{ marginTop: 8 }}>E com aquela pessoa, vocês combinam?</h3>
        <p className="ocultos">Cruze o seu mapa com o de alguém: Day Masters, palácio do cônjuge e se um completa o outro.</p>
        <button type="button" className="btn" style={{ marginTop: 10 }} onClick={onCompat}>Comparar com alguém ✦</button>
      </div>

      <div className="cta-box">
        <span className="eyebrow">Próxima camada</span>
        <h2 style={{ marginTop: 8 }}>O BaZi é um mapa. O Manual é a leitura inteira.</h2>
        <p>
          Seu Manual cruza o que você viu aqui com seu mapa astral (Sol, Lua, Ascendente) e sua numerologia —
          e transforma tudo num plano: ponto cego, amor, dinheiro e o que fazer nas próximas 4 semanas.
        </p>
        <button type="button" className="btn" onClick={onCta}>Abrir meu Manual ✦</button>
      </div>
    </>
  );
}

function anoNascimentoTexto(mapa) {
  return `${RAMOS[mapa.ano.ramo].animal} de ${ELEMENTOS[TRONCOS[mapa.ano.tronco].elemento].nome} (${mapa.anoChines})`;
}

function NotaHorario({ mapa, entrada }) {
  const lugar = entrada.cidade ? `${entrada.cidade.nome}` : 'Brasília';
  const offset = `UTC${mapa.offsetUtcHoras >= 0 ? '+' : ''}${mapa.offsetUtcHoras}`;
  return (
    <p className="nota">
      O relógio marcava {mapa.horaRelogio}
      {mapa.horarioDeVerao ? ` com horário de verão (${offset})` : ` (${offset})`}. Pelo sol de {lugar}, eram {mapa.horaSolar} — é
      essa hora que o BaZi usa, e ela cai na hora {art(RAMOS[mapa.hora.ramo].animal).do} {RAMOS[mapa.hora.ramo].animal}.
      {mapa.longitudeAproximada && ' Sem a cidade, usamos o horário de Brasília: escolha sua cidade na lista para a hora exata.'}
    </p>
  );
}

function CardPilar({ pos, mapa }) {
  const p = mapa[pos];
  const papel = PAPEL_PILAR[pos];
  if (!p) {
    return (
      <div className="card">
        <h3>{papel.titulo} — {papel.sub}</h3>
        <p>{papel.texto}</p>
        <p className="ocultos">Sem a hora do nascimento, este pilar fica em aberto. Se conseguir a hora (certidão, caderneta da maternidade), refaça o cálculo.</p>
      </div>
    );
  }
  const eu = mapa.diaMestre;
  const t = TRONCOS[p.tronco];
  const r = RAMOS[p.ramo];
  const deus = pos === 'dia' ? null : dezDeuses(eu, p.tronco);
  const ocultos = r.ocultos.map((o) => ({ o, deus: dezDeuses(eu, o) }));

  return (
    <div className="card">
      <h3>{papel.titulo}: {nomePilar(p.tronco, p.ramo)} ({t.hanzi}{r.hanzi})</h3>
      <p className="ocultos">{papel.sub}</p>
      <p>{papel.texto}</p>
      {deus ? (
        <p>
          <strong>{ELEMENTOS[t.elemento].nome} {t.yang ? 'Yang' : 'Yin'} ({t.pinyin}) = {rotuloDeus(deus)}</strong> — {TEXTO_DEUSES[deus].texto}
        </p>
      ) : (
        <p><strong>{t.pinyin} ({t.hanzi}) é você</strong> — o Day Master descrito acima.</p>
      )}
      <p><strong>{r.animal} ({r.hanzi})</strong> — {ANIMAIS[p.ramo][TEXTO_RAMO_POR_POSICAO[pos]]}</p>
      <p className="ocultos">
        Escondido {art(r.animal).no} {r.animal}: {ocultos.map(({ o, deus: d }) => `${ELEMENTOS[TRONCOS[o].elemento].nome} ${TRONCOS[o].yang ? 'Yang' : 'Yin'} (${DEZ_DEUSES[d].nome})`).join(', ')}.
      </p>
    </div>
  );
}

const doPilar = (pos) => (pos === 'hora' ? 'da Hora' : `do ${NOMES_POSICAO[pos]}`);

function descreverRelacao(r, mapa) {
  const [p1, p2] = r.entre;
  if (r.tipo === 'combinacaoTronco') {
    const [a, b] = r.troncos;
    const envolveVoce = p1 === 'dia' || p2 === 'dia';
    const outro = p1 === 'dia' ? p2 : p1;
    const base = `${TRONCOS[a].pinyin} (${TRONCOS[a].hanzi}) + ${TRONCOS[b].pinyin} (${TRONCOS[b].hanzi}) se combinam e geram ${ELEMENTOS[r.elemento].nome}.`;
    if (!envolveVoce) {
      return `${base} Os pilares ${doPilar(p1)} e ${doPilar(p2)} se puxam — o que acontece numa mexe na outra.`;
    }
    const deus = dezDeuses(mapa.diaMestre, mapa[outro].tronco);
    return `${base} Como um deles é você, o tema do pilar ${doPilar(outro)} — ${TEXTO_DEUSES[deus].curto} — fica colado à sua identidade.`;
  }
  const [ra, rb] = r.ramos;
  return `${RAMOS[ra].animal} (${NOMES_POSICAO[p1]}) e ${RAMOS[rb].animal} (${NOMES_POSICAO[p2]}).`;
}

function CardAno({ leitura, mapa }) {
  const { pilar, deus } = leitura;
  const animalAno = RAMOS[pilar.ramo];
  const meuAnimal = RAMOS[mapa.ano.ramo].animal;
  const O = art(animalAno.animal).O;
  const linhas = [];

  if (leitura.mesmoAnimal) {
    linhas.push(`É o ano do seu próprio animal (本命年, "ano do destino"). A tradição pede cautela: ano de virada, em que velhas estruturas caem para abrir espaço.`);
  }
  for (const tipo of leitura.comAnimal) {
    if (tipo === 'trio') linhas.push(`${animalAno.animal} e ${meuAnimal} são do mesmo trio harmônico — ano de apoio e portas abertas para o seu animal.`);
    if (tipo === 'combinacao') linhas.push(`${animalAno.animal} e ${meuAnimal} se combinam — ano de alianças e acordos favoráveis.`);
    if (tipo === 'choque') linhas.push(`${animalAno.animal} choca com ${meuAnimal} — ano de mudanças bruscas: casa, trabalho ou rotina se mexem, querendo ou não.`);
    if (tipo === 'punicao') linhas.push(`${animalAno.animal} pune ${meuAnimal} — ano de atrito: cobranças, conflito de autoridade e acordos que se desgastam. Revise contratos e cuide do tom.`);
    if (tipo === 'dano') linhas.push(`${animalAno.animal} fere ${meuAnimal} — atenção a mal-entendidos e a quem atrapalha pelas costas.`);
  }
  const ramoDia = RAMOS[mapa.dia.ramo].animal;
  for (const tipo of leitura.comDia) {
    if (tipo === 'choque') linhas.push(`${O} ${animalAno.animal} também choca com o seu ramo do dia (${ramoDia}), o palácio do parceiro — relacionamento em movimento: começo, fim ou mudança grande.`);
    if (tipo === 'combinacao') linhas.push(`${O} ${animalAno.animal} se combina com o seu ramo do dia (${ramoDia}) — ano favorável para relacionamento e parcerias.`);
  }
  if (leitura.florDePessego) linhas.push(`${O} ${animalAno.animal} é a sua "Flor de Pêssego" (桃花): ano de magnetismo, visibilidade e romance.`);
  if (leitura.combinaDiaMestre) linhas.push(`O tronco do ano (${TRONCOS[pilar.tronco].pinyin}) se combina com você — o tema do ano gruda na sua identidade e é difícil fugir dele.`);

  return (
    <div className="card">
      <h3>{leitura.ano}: {nomePilar(pilar.tronco, pilar.ramo)} ({TRONCOS[pilar.tronco].hanzi}{animalAno.hanzi})</h3>
      <p><strong>Para você, {rotuloDeus(deus)}.</strong> {TEXTO_DEUSES[deus].ano}</p>
      {linhas.map((l, i) => <p key={i}>{l}</p>)}
      {linhas.length === 0 && <p>{O} {animalAno.animal} é neutr{O === 'A' ? 'a' : 'o'} para {FEMININOS.has(meuAnimal) ? 'a sua' : 'o seu'} {meuAnimal}: sem choque nem aliança — o tom do ano vem do elemento acima.</p>}
      <p className="ocultos">O ano chinês começa no Lichun, por volta de 4 de fevereiro.</p>
    </div>
  );
}

function SobreBazi() {
  return (
    <section className="sobre">
      <h2>O que é o BaZi</h2>
      <p>
        BaZi (八字, &quot;oito caracteres&quot;) é o sistema clássico da astrologia chinesa. Cada momento do nascimento vira
        quatro pilares — ano, mês, dia e hora — e cada pilar tem um elemento (Madeira, Fogo, Terra, Metal ou Água) em cima
        e um dos 12 animais embaixo. São oito caracteres ao todo.
      </p>
      <h3>Seu animal não é o principal</h3>
      <p>
        O animal do ano (o &quot;signo chinês&quot; dos horóscopos) mostra a sua imagem social. Quem você é de verdade está no
        pilar do dia: o elemento de cima, chamado Day Master. É a partir dele que todo o resto é lido — carreira, dinheiro,
        amor e os anos que vêm.
      </p>
      <h3>Por que a hora precisa de correção</h3>
      <p>
        O BaZi usa o horário solar, não o do relógio. No Brasil, quem nasceu no horário de verão tem uma hora a mais na
        certidão — e a longitude da cidade desloca mais alguns minutos. A maioria das calculadoras ignora isso e erra o
        pilar da hora. Aqui, a correção é feita com o fuso histórico e o sol exato da sua cidade.
      </p>
      <h3>O ano chinês não começa em 1º de janeiro</h3>
      <p>
        O ano e os meses seguem os termos solares: o ano vira no Lichun, por volta de 4 de fevereiro. Quem nasceu em
        janeiro ou no começo de fevereiro pertence ao animal do ano anterior.
      </p>
    </section>
  );
}
