'use client';

// Início da Minha Área (/seu-dia) — redesign de nov/2026 (croqui em
// reference/ux, branch reference-ux):
//   1. topo com o CÉU REAL do nascimento (CeuNascimento, desenhado ao vivo),
//      saudação, nome, frase da síntese, signo · número · anjo · Kin e a legenda
//      do céu; no desktop, banner largo com o número de vida gigante à direita;
//   2. o dia em uma linha;
//   3. "Suas leituras": só as da pessoa do perfil, em cartões com imagem;
//   4. "Seu mapa": lista editorial dos sistemas;
//   5. assinatura;
//   6. "Outras leituras neste e-mail (N)": uma linha fechada no fim da página;
//      aberta, mostra as leituras de outras pessoas com "ocultar daqui".
// Estilo em minhaArea.module.css (desktop ≥ 960px em duas colunas).

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CeuNascimento from '@/app/components/ceu/CeuNascimento';
import { sistemasDaPessoa, sinteseDoMapa, TEMAS } from '@/lib/mapaSintese';
import { resumoCeu, lugarDoPerfil } from '@/lib/ceuNascimento';
import { cartoesLeitura } from '@/lib/minhaArea';
import { PRECO_ASSINATURA_MENSAL } from '@/lib/preco';
import s from './minhaArea.module.css';

const TOM = {
  fluxo: { rotulo: 'Dia a favor', barras: 3 },
  misto: { rotulo: 'Dia misto', barras: 2 },
  tensao: { rotulo: 'Dia de atenção', barras: 1 },
};
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
const capitalizar = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'minha_area', ...params }); } catch {}
}

function saudacao() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

// "Ação com direção." → "Ação com <i>direção.</i>" (última palavra em itálico dourado)
export function TituloDoDia({ texto }) {
  const i = texto.lastIndexOf(' ');
  if (i < 0) return <i>{texto}</i>;
  return <>{texto.slice(0, i + 1)}<i>{texto.slice(i + 1)}</i></>;
}

// Manual pago: quem vem da Minha Área vai direto pro conteúdo; a abertura
// (Olho Cósmico) fica pra quem chega pelo e-mail logo depois da compra.
function marcarOlhoVisto(chave, estado, id) {
  if (chave === 'manual' && estado === 'aberto') {
    try { window.localStorage.setItem(`ic_olho_visto_${id}`, '1'); } catch {}
  }
}

// Leitura de OUTRA pessoa (PR #131): título "Leitura de Ana · 03/09/1995" pra
// não parecer que é a dona do perfil, + "ocultar daqui" / "voltar a mostrar".
function CartaoOutra({ p, onOcultar, onMostrar }) {
  return (
    <section className="ma-outra">
      <h3 className="ma-de">Leitura de {p.nome} · {dataBR(p.dataNascimento)}</h3>
      {p.presenteDe && <p className="ma-presente">Presente de {p.presenteDe} ✦</p>}
      <ul className="ma-itens">
        {p.itens.map((it) => (
          <li key={it.chave}>
            <a href={it.href} className={`ma-item ma-${it.estado}`} onClick={() => {
              evento('ma_leitura', { item: it.chave, estado: it.estado, outra: true });
              marcarOlhoVisto(it.chave, it.estado, p.id);
            }}>
              <span className="ma-item-txt"><strong>{it.titulo}</strong><span>{it.rotulo}</span></span>
              <span aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
      {onOcultar && <button type="button" className="ma-ocultar" onClick={() => onOcultar(p)}>ocultar daqui</button>}
      {onMostrar && <button type="button" className="ma-ocultar" onClick={() => onMostrar(p)}>voltar a mostrar</button>}
    </section>
  );
}

/**
 * @param {{ perfil: object, leitura: object, hoje: string, onIr: (aba: string) => void, abas?: React.ReactNode }} props
 *   abas: a barra de abas do desktop (vem do SeuDiaClient), desenhada logo abaixo do céu.
 */
export default function AbaInicio({ perfil, leitura, hoje, onIr, abas = null }) {
  const nome = capitalizar((perfil.nome || '').trim().split(/\s+/)[0] || '');
  const sistemas = useMemo(() => sistemasDaPessoa({
    dataNascimento: perfil.dataNascimento,
    hora: perfil.hora || null,
    cidade: perfil.cidade || null,
  }), [perfil.dataNascimento, perfil.hora, perfil.cidade]);
  const sintese = useMemo(() => sinteseDoMapa(sistemas), [sistemas]);
  const temas = sintese.repete.length ? sintese.repete.map((r) => r.nome) : sintese.ranking.slice(0, 2).map((r) => TEMAS[r.tema].nome);
  const por = Object.fromEntries(sistemas.map((x) => [x.chave, x]));
  const kinNumero = por['kin-maia'] ? por['kin-maia'].sistema.replace(/\D/g, '') : null;
  const numero = por.numerologia?.valor;

  // Céu: lugar memorizado (o CeuNascimento redesenha quando o objeto muda).
  const cidade = perfil.cidade;
  const lugar = useMemo(() => lugarDoPerfil(cidade), [cidade]);
  const ceu = useMemo(() => {
    try { return resumoCeu({ data: perfil.dataNascimento, hora: perfil.hora || null, lugar }); } catch { return null; }
  }, [perfil.dataNascimento, perfil.hora, lugar]);

  const [ola] = useState(saudacao);

  const [produtos, setProdutos] = useState(null); // null = carregando
  useEffect(() => {
    let vivo = true;
    fetch('/api/seu-dia/produtos', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { pessoas: [] }))
      .then((j) => { if (vivo) setProdutos(j.pessoas || []); })
      .catch(() => { if (vivo) setProdutos([]); });
    return () => { vivo = false; };
  }, []);

  // Ocultar/mostrar leituras de outra pessoa: muda na hora e desfaz se o
  // servidor falhar (ex.: migração 0020 ainda não rodou).
  const [verOcultas, setVerOcultas] = useState(false);
  const [avisoOcultar, setAvisoOcultar] = useState('');
  function alternarOculta(p, ocultar) {
    const marcar = (valor) => setProdutos((lista) => lista.map((x) => (x.chave === p.chave ? { ...x, oculta: valor } : x)));
    marcar(ocultar);
    setAvisoOcultar('');
    evento(ocultar ? 'ma_ocultar' : 'ma_mostrar');
    fetch('/api/seu-dia/produtos/ocultar', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave: p.chave, ocultar }),
    })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); })
      .catch(() => {
        marcar(!ocultar);
        setAvisoOcultar('Não deu pra salvar agora. Tente de novo em instantes.');
      });
  }

  const suas = produtos ? produtos.filter((p) => p.propria) : [];
  const outras = produtos ? produtos.filter((p) => !p.propria && !p.oculta) : [];
  const ocultas = produtos ? produtos.filter((p) => !p.propria && p.oculta) : [];
  const minha = suas[0] || null;
  const cartoes = cartoesLeitura(minha);

  const tom = TOM[leitura.tom] || TOM.misto;
  const [, mesHoje, diaHoje] = (hoje || '').split('-').map(Number);
  const hojeCurto = diaHoje ? `${diaHoje} ${MESES[mesHoje - 1].slice(0, 3)}` : '';
  const hojeLongo = diaHoje ? `${diaHoje} de ${MESES[mesHoje - 1]}` : '';

  const chipsCurto = [por.signos?.valor, numero, por.anjo?.valor, kinNumero && `Kin ${kinNumero}`].filter(Boolean);
  const chipsLargo = [por.signos?.valor, por.anjo?.valor, kinNumero && `Kin ${kinNumero}`, por['astrologia-chinesa']?.valor].filter(Boolean);

  // Lista "Seu mapa": rótulo curto no celular, longo no desktop.
  const linhasMapa = [
    por.signos && { k: 'Signo solar', kl: 'Signo solar', v: por.signos.valor, href: por.signos.href, chave: 'signos' },
    por.numerologia && { k: 'Número', kl: 'Número de vida', v: por.numerologia.valor, href: por.numerologia.href, chave: 'numerologia', soCelular: true },
    por.anjo && { k: 'Anjo', kl: 'Anjo da guarda', v: por.anjo.valor, href: por.anjo.href, chave: 'anjo' },
    por['anjo-mente'] && { k: 'Anjo da mente', kl: 'Anjo da mente', v: por['anjo-mente'].valor, href: por['anjo-mente'].href, chave: 'anjo-mente' },
    por['kin-maia'] && { k: 'Kin Maia', kl: 'Kin Maia', v: `${kinNumero} · ${por['kin-maia'].valor}`, href: por['kin-maia'].href, chave: 'kin-maia' },
    por['astrologia-chinesa'] && { k: 'Chinês', kl: 'Astrologia chinesa', v: por['astrologia-chinesa'].valor, href: por['astrologia-chinesa'].href, chave: 'astrologia-chinesa' },
    { k: 'Céu', kl: 'Céu do nascimento', v: ceu?.valor || 'O seu céu', href: '/ceu', chave: 'ceu' },
  ].filter(Boolean);

  const totalOutras = outras.length + ocultas.length;

  return (
    <div className={s.ma}>
      <header className={s.hero}>
        <CeuNascimento data={perfil.dataNascimento} hora={perfil.hora || null} lugar={lugar} rotuloMaxY={0.5} />
        <div className={s.heroVeu} aria-hidden="true" />
        <div className={s.heroConteudo}>
          <div className={s.heroTexto}>
            <span className={s.eyebrow}><span className={s.rotuloLongo}>Minha Área · </span>{ola}</span>
            <h1 className={`${s.nome} ${nome.length > 7 ? s.nomeLongo : ''}`}>{nome || 'Você'}</h1>
            <p className={s.temas}>{temas.join(' · ')}</p>
            <p className={`${s.chips} ${s.chipsCurto}`}>{chipsCurto.join(' · ')}</p>
            <p className={`${s.chips} ${s.chipsLargo}`}>{chipsLargo.join(' · ')}</p>
            {ceu && (
              <p className={s.legenda}>
                <span className={s.rotuloLongo}>Ao fundo: </span>
                <span className={s.rotuloCurto}>{ceu.legenda}</span>
                <span className={s.rotuloLongo}>{ceu.legenda.replace(/^O céu/, 'o céu')}.</span>
                {ceu.extra && <span className={s.legendaExtra}> {ceu.extra}</span>}
              </p>
            )}
          </div>
          {numero && (
            <div className={s.heroNumero}>
              <span className={s.numero}>{numero}</span>
              <span className={s.eyebrow} style={{ color: 'var(--areia)' }}>Número de vida</span>
            </div>
          )}
        </div>
      </header>

      {abas}

      <div className={s.corpo}>
        <div className={s.colunas}>
          <div className={s.principal}>
            <section className={s.hoje} aria-label="Seu dia hoje">
              <div className={s.hojeBloco}>
                <div className={s.hojeTopo}>
                  <span className={s.eyebrow}>
                    <span className={s.rotuloCurto}>Hoje · {hojeCurto}</span>
                    <span className={s.rotuloLongo}>Hoje · {hojeLongo} · {tom.rotulo.toLowerCase()}</span>
                  </span>
                  <span className={s.pilula}>{tom.rotulo}</span>
                </div>
                <p className={s.hojeTitulo}><TituloDoDia texto={leitura.titulo} /></p>
                <p className={s.hojeFrase}>{leitura.frase}</p>
                <div className={s.barras} aria-hidden="true">
                  {[0, 1, 2].map((i) => <span key={i} className={i < tom.barras ? s.barraOn : ''} />)}
                </div>
                <button type="button" className={s.hojeLink} onClick={() => onIr('hoje')}>Abrir meu dia →</button>
              </div>
              <button type="button" className={s.hojeBotao} onClick={() => onIr('hoje')}>Abrir meu dia</button>
            </section>

            <section className={s.secao} aria-labelledby="ma-suas">
              <div className={s.secaoTopo}>
                <h2 id="ma-suas" className={s.h2}>Suas leituras</h2>
                {cartoes.length > 0 && <span className={s.contador}>{String(cartoes.length).padStart(2, '0')}</span>}
              </div>
              {produtos === null && <p className={s.carregando}>Carregando suas leituras…</p>}
              {produtos && !minha && (
                <div className={s.vazio}>
                  <p>
                    {produtos.length === 0 ? 'Você ainda não tem leituras neste e-mail.' : 'Ainda não há uma leitura sua neste e-mail.'}
                    {' '}O Manual começa por uma prévia grátis, já com os seus dados.
                  </p>
                  <Link className={s.btn} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#1a1020' }} href="/" onClick={() => evento('ma_fazer_quiz')}>
                    Ver minha prévia grátis
                  </Link>
                </div>
              )}
              {minha?.presenteDe && <p className={s.presente}>Presente de {minha.presenteDe} ✦</p>}
              {cartoes.length > 0 && (
                <div className={s.leituras}>
                  {cartoes.map((c) => (
                    <a
                      key={c.chave}
                      href={c.href}
                      className={`${s.leitura} ${c.chave === 'manual' && c.liberado ? s.leituraForte : ''}`}
                      onClick={() => { evento('ma_leitura', { item: c.chave, estado: c.estado, outra: false }); marcarOlhoVisto(c.chave, c.estado, minha.id); }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.img} alt="" className={s.leituraImg} loading="lazy" decoding="async" />
                      <span className={s.leituraVeu} />
                      <span className={`${s.selo} ${c.liberado ? s.seloLiberado : s.seloGratis}`}>{c.selo}</span>
                      <span className={s.leituraTexto}>
                        <span className={s.leituraNome}>{c.nome}</span>
                        <span className={s.leituraAcao}>{c.acao}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className={s.lateral}>
            <section className={s.mapa} aria-labelledby="ma-mapa">
              <h2 id="ma-mapa" className={s.h2}>Seu mapa</h2>
              {linhasMapa.map((l) => (
                <a
                  key={l.chave}
                  href={l.href}
                  className={`${s.mapaLinha} ${l.soCelular ? s.soCelular : ''}`}
                  onClick={() => evento('ma_gratis', { destino: l.chave })}
                >
                  <span className={s.mapaRotulo}>
                    <span className={s.rotuloCurto}>{l.k}</span>
                    <span className={s.rotuloLongo}>{l.kl}</span>
                  </span>
                  <span className={s.mapaValor}>{l.v}</span>
                  <span className={s.seta} aria-hidden="true">→</span>
                </a>
              ))}
              <button type="button" className={s.mapaCompleto} onClick={() => onIr('mapa')}>Ver o que seu mapa repete →</button>
            </section>

            {perfil.assinatura ? (
              <div className={s.assin}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/olho/e3w.webp" alt="" className={s.assinImg} loading="lazy" decoding="async" />
                <span className={s.assinVeu} />
                <span className={s.assinTexto}>
                  <span className={s.assinRotulo}>Intuitive Completo</span>
                  <span className={s.assinTitulo}>Tudo destravado, todo dia.</span>
                  <span className={s.assinPreco}>
                    Plano {perfil.assinatura.plano === 'anual' ? 'anual' : 'mensal'} ativo
                    {perfil.assinatura.acessoAte ? ` até ${dataBR(perfil.assinatura.acessoAte)}` : ''}
                  </span>
                </span>
              </div>
            ) : (
              <a className={s.assin} href="/assinar" onClick={() => evento('ma_assinar')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/olho/e3w.webp" alt="" className={s.assinImg} loading="lazy" decoding="async" />
                <span className={s.assinVeu} />
                <span className={s.assinTexto}>
                  <span className={s.assinRotulo}>Intuitive Completo</span>
                  <span className={s.assinTitulo}>Tudo destravado, todo dia.</span>
                  <span className={s.assinPreco}>{brl(PRECO_ASSINATURA_MENSAL)}/mês →</span>
                </span>
              </a>
            )}

            <p className={s.tambem}>
              Também grátis:{' '}
              <a href="/hexagrama-do-dia" onClick={() => evento('ma_gratis', { destino: 'hexagrama' })}>Hexagrama do dia</a>{' · '}
              <a href="/compatibilidade" onClick={() => evento('ma_gratis', { destino: 'compatibilidade' })}>Vocês combinam?</a>{' · '}
              <a href="/oraculo" onClick={() => evento('ma_gratis', { destino: 'oraculo' })}>Oráculo</a>
            </p>
          </aside>
        </div>

        {totalOutras > 0 && (
          <details className={s.outras} onToggle={(e) => { if (e.currentTarget.open) evento('ma_outras_abrir', { n: totalOutras }); }}>
            <summary className={s.outrasLinha}>
              <span>Outras leituras neste e-mail ({outras.length})</span>
              <span className={s.outrasMais} aria-hidden="true">+</span>
            </summary>
            <div className={s.outrasCorpo}>
              {avisoOcultar && <p className="ma-aviso" role="status">{avisoOcultar}</p>}
              {outras.map((p) => <CartaoOutra key={p.id} p={p} onOcultar={(x) => alternarOculta(x, true)} />)}
              {ocultas.length > 0 && (
                <button type="button" className="ma-ver-ocultas" onClick={() => setVerOcultas((v) => !v)}>
                  {verOcultas
                    ? 'Esconder as ocultas'
                    : `Mostrar ${ocultas.length === 1 ? '1 leitura oculta' : `${ocultas.length} leituras ocultas`}`}
                </button>
              )}
              {verOcultas && ocultas.map((p) => <CartaoOutra key={p.id} p={p} onMostrar={(x) => alternarOculta(x, false)} />)}
            </div>
          </details>
        )}
      </div>

      <style>{CSS_OUTRAS}</style>
    </div>
  );
}

// Cartões de "Outras leituras" (comportamento do PR #131, visual novo).
const CSS_OUTRAS = `
  .ma-outra { display: flex; flex-direction: column; gap: 10px; padding: 16px; border: 1px dashed rgba(242,199,123,.28); border-radius: 18px; }
  .ma-de { margin: 0; font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: 22px; line-height: 1.1; color: #f3e9da; }
  .ma-presente { margin: 0; font-family: 'Geist Mono', monospace; font-size: 11px; color: #ffdca0; }
  .ma-itens { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .ma-item { display: flex; align-items: center; gap: 12px; min-height: 44px; border-bottom: 1px solid rgba(242,199,123,.12); text-decoration: none; }
  a.ma-item { color: #f3e9da; }
  .ma-item:hover { color: #ffdca0; }
  .ma-item-txt { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex: 1; min-width: 0; }
  .ma-item-txt strong { font-weight: 400; font-size: 15px; }
  .ma-item-txt span { font-family: 'Geist Mono', monospace; font-size: 10px; letter-spacing: .08em; color: #b9a9c9; text-align: right; }
  .ma-aberto .ma-item-txt span { color: #9fe0c0; }
  .ma-ocultar, .ma-ver-ocultas { align-self: flex-start; background: none; border: 0; padding: 6px 0; cursor: pointer;
    font-family: 'Geist Mono', monospace; font-size: 11px; letter-spacing: .08em; color: #b9a9c9; text-decoration: underline; text-underline-offset: 3px; }
  .ma-ocultar:hover, .ma-ver-ocultas:hover { color: #ffdca0; }
  .ma-ocultar { align-self: flex-end; }
  .ma-aviso { font-family: 'Geist Mono', monospace; font-size: 11px; color: #ffdca0; }
`;
