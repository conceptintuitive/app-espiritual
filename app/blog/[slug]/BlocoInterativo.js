'use client';

// Bloco interativo no meio do post (entra via BlocoCarregador, next/dynamic
// ssr:false, depois da página). Um por categoria (lib/blogBloco.js):
//   Números     data → número de vida; "Este post é sobre você" ou o link do número
//   Signos      "Onde <signo> cai no seu mapa?" → casa (com hora + cidade) + CtaMapa
//               (quiz pré-preenchido via lib/ceuDados.js com o que ela digitou)
//   Tarô        carta do dia (mesmo motor do Seu Dia) → /seu-dia?aba=hoje
//   Princípios, Lua, Mente   título do dia → /seu-dia?aba=hoje
// Tarô e dia: sem perfil no aparelho (antes de calcular), o botão é o
// CtaMapa (quiz), porque o caminho é mapa → Minha Área.
// Com perfil no aparelho (lib/perfilLocal.js) o bloco abre com o resultado
// da pessoa + "Calcular pra outra pessoa". Calcular usa salvarSeForMeu.
// As contas (lib/calculos.js, lib/seuDia.js) são importadas na hora: nada
// disso pesa na página.
// GA4: blog_bloco_ver, blog_bloco_calcular, blog_bloco_clique (slug, categoria).

import { useEffect, useRef, useState } from 'react';
import CidadeAutocomplete from '@/app/components/CidadeAutocomplete';
import CtaMapa from '@/app/components/CtaMapa';
import { lerPerfil, salvarSeForMeu } from '@/lib/perfilLocal';
import { salvarCeuDados } from '@/lib/ceuDados';
import { tipoDoBloco, perguntaDoBloco, resultadoNumero, frasesSigno, primeiraFrase } from '@/lib/blogBloco';
import b from '../blog.module.css';

function evento(nome, params) {
  try { window.gtag?.('event', nome, { event_category: 'blog', ...params }); } catch {}
}

const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || '';

// "Dia de se expressar" → "Dia de se <i>expressar</i>" (igual ao Seu Dia)
function Titulo({ texto }) {
  const i = texto.lastIndexOf(' ');
  if (i < 0) return <i>{texto}</i>;
  return <>{texto.slice(0, i + 1)}<i>{texto.slice(i + 1)}</i></>;
}

/** Faz a conta do bloco pra uma pessoa. */
async function calcular(tipo, pessoa, { numeroPost, signoPost, postsNumeros }) {
  const nome = primeiroNome(pessoa.nome);
  if (tipo === 'numero') {
    const { calcularNumeroVida } = await import('@/lib/calculos');
    const numero = calcularNumeroVida(pessoa.dataNascimento);
    return { numero, ...resultadoNumero({ numero, numeroPost, nome, postDoNumero: postsNumeros?.[numero] || null }) };
  }
  if (tipo === 'signo') {
    const [{ calcularSigno, calcularAscendente }, { utcOffsetHoras }] = await Promise.all([import('@/lib/calculos'), import('@/lib/sky')]);
    const [, m, d] = pessoa.dataNascimento.split('-').map(Number);
    const sol = calcularSigno(d, m);
    let ascendente = null;
    const c = pessoa.cidade;
    if (pessoa.hora && c && typeof c.lat === 'number' && typeof c.lon === 'number') {
      const offset = utcOffsetHoras({ data: pessoa.dataNascimento, hora: pessoa.hora, tz: c.tz || 'America/Sao_Paulo' });
      ascendente = calcularAscendente(pessoa.dataNascimento, pessoa.hora, c.lat, c.lon, offset);
    }
    return { frases: frasesSigno({ nome, signoPost, sol, ascendente }) };
  }
  // carta / dia: o mesmo motor e os mesmos dados do Seu Dia
  const { montarPerfil, leituraDoDia, hojeNoFuso } = await import('@/lib/seuDia');
  const tz = pessoa.cidade?.tz || 'America/Sao_Paulo';
  const calc = montarPerfil({
    dataNascimento: pessoa.dataNascimento,
    hora: pessoa.hora || null,
    tz,
    lon: typeof pessoa.cidade?.lon === 'number' ? pessoa.cidade.lon : null,
  });
  const l = leituraDoDia(calc, hojeNoFuso(tz));
  if (tipo === 'carta') {
    return {
      nome,
      carta: `${l.tarot.nome}${l.tarot.invertida ? ' invertida' : ''}`,
      texto: primeiraFrase(l.tarot.texto),
    };
  }
  return { nome, titulo: l.titulo, texto: l.frase };
}

/**
 * @param {{ slug: string, categoria: string, numero: number|null, signo: string|null,
 *           postsNumeros: Record<number, string> }} props
 */
export default function BlocoInterativo({ slug, categoria, numero, signo, postsNumeros }) {
  const tipo = tipoDoBloco(categoria);
  const base = { slug, categoria };
  const ref = useRef(null);
  const [temPerfil, setTemPerfil] = useState(false); // perfil no aparelho ANTES de calcular
  const [pessoa, setPessoa] = useState(null);
  const [res, setRes] = useState(null);
  const [form, setForm] = useState(false);
  const [erro, setErro] = useState('');
  // campos
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [cidadeTexto, setCidadeTexto] = useState('');
  const [cidade, setCidade] = useState(null);

  // Abre já com o resultado de quem tem perfil neste aparelho.
  useEffect(() => {
    const p = lerPerfil();
    if (p?.dataNascimento) { setTemPerfil(true); setPessoa(p); } // eslint-disable-line react-hooks/set-state-in-effect
    else setForm(true);
  }, []);

  useEffect(() => {
    if (!pessoa) return undefined;
    let vivo = true;
    calcular(tipo, pessoa, { numeroPost: numero, signoPost: signo, postsNumeros })
      .then((r) => { if (vivo) setRes(r); })
      .catch((e) => { console.error('[blog bloco]', e); if (vivo) setErro('Não deu pra calcular agora. Tente de novo.'); });
    return () => { vivo = false; };
  }, [tipo, pessoa, numero, signo, postsNumeros]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { evento('blog_bloco_ver', { ...base, com_perfil: !!lerPerfil() }); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = (e) => {
    e.preventDefault();
    if (!data) { setErro('Coloque a data de nascimento.'); return; }
    setErro('');
    const dados = {
      nome: primeiroNome(nome),
      dataNascimento: data,
      hora: hora || null,
      cidade: cidade || null,
    };
    salvarSeForMeu(dados);
    setRes(null);
    setPessoa(dados);
    setForm(false);
    evento('blog_bloco_calcular', base);
  };

  const outraPessoa = () => {
    setForm(true); setRes(null); setNome(''); setData(''); setHora(''); setCidade(null); setCidadeTexto('');
  };

  const clique = (destino) => evento('blog_bloco_clique', { ...base, destino });
  // CtaMapa "Fazer meu mapa grátis": o quiz abre com o que ela digitou aqui.
  // (o CtaMapa só chama onFazer quando a pessoa ainda não tem mapa; senão ele
  // mesmo leva pro /resultado ou pro Manual)
  const fazerMapa = () => {
    if (pessoa) salvarCeuDados({ nome: pessoa.nome || '', dataNascimento: pessoa.dataNascimento, hora: pessoa.hora || null, cidade: pessoa.cidade || null });
    window.location.href = '/';
  };
  const ctaMapa = (
    <span className={b.blocoCta} onClick={() => clique('mapa')}>
      <CtaMapa className={b.btn} origem={`blog-bloco-${categoria}`} onFazer={fazerMapa} />
    </span>
  );
  const ctaDia = temPerfil
    ? <a className={b.btn} href="/seu-dia?aba=hoje" onClick={() => clique('seu-dia')}>Abrir meu dia</a>
    : ctaMapa;

  return (
    <aside ref={ref} className={b.bloco} aria-label={perguntaDoBloco(categoria, signo)}>
      <span className={b.eyebrow}>{tipo === 'numero' || tipo === 'signo' ? 'No seu mapa' : 'No seu dia'}</span>
      <p className={b.blocoPergunta}>{perguntaDoBloco(categoria, signo)}</p>

      {form ? (
        <form className={b.blocoForm} onSubmit={enviar}>
          <div className={b.blocoCampos}>
            <label className={b.blocoCampo}>
              <span className={b.blocoRotulo}>Seu nome</span>
              <input type="text" className={b.campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Bianca" autoComplete="given-name" />
            </label>
            <label className={b.blocoCampo}>
              <span className={b.blocoRotulo}>Data de nascimento</span>
              <input type="date" className={b.campo} value={data} onChange={(e) => setData(e.target.value)} required />
            </label>
            {tipo !== 'numero' && (
              <label className={b.blocoCampo}>
                <span className={b.blocoRotulo}>Hora <span className={b.blocoDica}>(opcional)</span></span>
                <input type="time" className={b.campo} value={hora} onChange={(e) => setHora(e.target.value)} />
              </label>
            )}
            {tipo === 'signo' && (
              <div className={b.blocoCampo}>
                <span className={b.blocoRotulo}>Cidade <span className={b.blocoDica}>(opcional)</span></span>
                <CidadeAutocomplete
                  tema="ma"
                  value={cidadeTexto}
                  onChangeText={(t) => { setCidadeTexto(t); setCidade(null); }}
                  onSelect={(m) => { setCidadeTexto(`${m.nome}, ${m.uf}`); setCidade(m); }}
                  inputClassName={b.campo}
                />
              </div>
            )}
          </div>
          {erro && <p className={b.blocoErro}>{erro}</p>}
          <div className={b.blocoAcoes}>
            <button type="submit" className={b.btn}>{tipo === 'numero' ? 'Ver meu número' : tipo === 'signo' ? 'Ver no meu mapa' : 'Ver meu dia'}</button>
            {temPerfil && <button type="button" className={b.blocoLink} onClick={() => { setForm(false); setRes(null); setPessoa(lerPerfil()); }}>Voltar pro meu</button>}
          </div>
        </form>
      ) : !res ? (
        <p className={b.blocoTexto}>{erro || 'Calculando…'}</p>
      ) : (
        <div className={b.blocoResultado}>
          {tipo === 'numero' && (
            <>
              <div className={b.blocoNumeroLinha}>
                <span className={b.blocoNumero}>{res.numero}</span>
                <p className={b.blocoFrase}>{res.frase}{res.sobreVoce && <><br /><em>Este post é sobre você.</em></>}</p>
              </div>
              <div className={b.blocoAcoes}>
                {res.link
                  ? <a className={b.btn} href={res.link.href} onClick={() => clique(res.link.href.startsWith('/blog') ? 'post-numero' : 'pagina-numero')}>{res.link.rotulo}</a>
                  : res.sobreVoce ? null : ctaMapa}
                <button type="button" className={b.blocoLink} onClick={outraPessoa}>Calcular pra outra pessoa</button>
              </div>
            </>
          )}
          {tipo === 'signo' && (
            <>
              <p className={b.blocoFrase}>{res.frases[0]}</p>
              {res.frases[1] && <p className={b.blocoTexto}>{res.frases[1]}</p>}
              <div className={b.blocoAcoes}>
                {ctaMapa}
                <button type="button" className={b.blocoLink} onClick={outraPessoa}>Calcular pra outra pessoa</button>
              </div>
            </>
          )}
          {tipo === 'carta' && (
            <>
              <p className={b.blocoFrase}>{res.nome ? `${res.nome}, hoje` : 'Hoje'} a sua carta é <em>{res.carta}</em>.</p>
              <p className={b.blocoTexto}>{res.texto}</p>
              <div className={b.blocoAcoes}>
                {ctaDia}
                <button type="button" className={b.blocoLink} onClick={outraPessoa}>Calcular pra outra pessoa</button>
              </div>
            </>
          )}
          {tipo === 'dia' && (
            <>
              <span className={b.rotulo}>{res.nome ? `${res.nome}, hoje pra você` : 'Hoje pra você'}</span>
              <p className={b.blocoDia}><Titulo texto={res.titulo} /></p>
              <p className={b.blocoTexto}>{res.texto}</p>
              <div className={b.blocoAcoes}>
                {ctaDia}
                <button type="button" className={b.blocoLink} onClick={outraPessoa}>Calcular pra outra pessoa</button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
