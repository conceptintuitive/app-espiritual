'use client';

// Parte do /comecar que roda no navegador: o bloco do post (carta, número,
// pausa, frase ou narrado), os chips "Veio de outro post?" e o botão. Recebe
// do servidor só os textos dos posts desta página. Tocar num post = formato
// declarado (declararFormato: UTM guardada + visita da sessão, 1x), só pra
// quem chegou pelo Instagram (o TikTok recebe o carrossel, não esses Reels).

import { useEffect, useState } from 'react';
import { useEstadoMapa } from '@/app/components/CtaMapa';
import { declararFormato } from '@/app/components/CapturaAtribuicao';
import { contaDoDia } from '@/lib/comecarConta';
import c from './comecar.module.css';

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'comecar', ...params }); } catch {}
}

// Instagram: continua o Reel ("qual você escolheu?"); TikTok: convite.
const TEXTOS = {
  carta: { pergunta: 'Qual carta você escolheu?', convite: 'Escolhe uma carta', sub: 'Toca na sua: 1, 2 ou 3.' },
  numero: { pergunta: 'Qual é o seu número?', convite: 'Ache seu número', sub: 'Digita o dia em que você nasceu (só o dia).' },
  pausa: { pergunta: 'Em qual frase você pausou?', convite: 'Escolhe a frase que te chamar', sub: 'Toca na que te chamou.' },
  frase: { pergunta: 'A frase de hoje', convite: 'A frase de hoje', sub: null },
  narrado: { pergunta: null, convite: null, sub: null },
};

function Carta({ conteudo, onToque }) {
  const [escolhida, setEscolhida] = useState(null);
  const [todas, setTodas] = useState(false);
  const carta = conteudo.cartas.find((x) => x.posicao === escolhida);
  return (
    <div className={c.bloco}>
      <div className={c.cartas}>
        {conteudo.cartas.map((x) => {
          const virada = x.posicao === escolhida || (todas && escolhida);
          return (
            <button
              key={x.posicao}
              type="button"
              className={`${c.carta} ${virada ? c.cartaVirada : ''} ${x.posicao === escolhida ? c.cartaEscolhida : ''}`}
              onClick={() => { if (!escolhida) { setEscolhida(x.posicao); onToque(); } }}
              disabled={!!escolhida}
              aria-label={virada ? `Carta ${x.posicao}: ${x.nome}` : `Carta ${x.posicao}`}
            >
              <span className={c.cartaFrente} aria-hidden="true">{x.posicao}</span>
              <span className={c.cartaVerso} aria-hidden="true"><b>{x.romano}</b>{x.nome}</span>
            </button>
          );
        })}
      </div>
      {carta && (
        <div className={c.revelacao} aria-live="polite">
          <p className={c.rotulo}>A sua foi</p>
          <h2 className={c.nomeCarta}>{carta.nome}</h2>
          <p className={c.texto}>{carta.central}</p>
          <p className={c.rotulo}>Pra hoje</p>
          <p className={c.pratica}>{carta.pratica}</p>
          <p className={c.pergunta}>{carta.pergunta}</p>
          {!todas && <button type="button" className={c.link} onClick={() => setTodas(true)}>Ver as outras duas</button>}
          {todas && (
            <ul className={c.outras}>
              {conteudo.cartas.filter((x) => x.posicao !== escolhida).map((x) => (
                <li key={x.posicao}><b>{x.posicao} · {x.nome}.</b> {x.central}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Numero({ conteudo, onToque }) {
  const [dia, setDia] = useState('');
  const [erro, setErro] = useState('');
  const [res, setRes] = useState(null);
  const mostrar = (n, conta = null, d = null) => {
    setRes({ ...conteudo.numeros.find((x) => x.numero === n), conta, dia: d });
    onToque();
  };
  const enviar = (e) => {
    e.preventDefault();
    const n = Number(dia);
    if (!Number.isInteger(n) || n < 1 || n > 31) { setErro('Digita um dia de 1 a 31.'); return; }
    setErro('');
    const { numero, conta } = contaDoDia(n);
    mostrar(numero, conta, n);
  };
  const ex = conteudo.exemplo;
  return (
    <div className={c.bloco}>
      <form className={c.form} onSubmit={enviar}>
        <label className={c.rotulo} htmlFor="comecar-dia">Dia do nascimento</label>
        <div className={c.linhaForm}>
          <input id="comecar-dia" className={c.campo} inputMode="numeric" pattern="[0-9]*" maxLength={2} placeholder="Ex.: 28"
            value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, ''))} />
          <button type="submit" className={c.btnSec}>Ver meu número</button>
        </div>
        {erro && <p className={c.erro}>{erro}</p>}
        {ex && <p className={c.dica}>No Reel: dia {ex.dia}{ex.conta ? `, ${ex.conta}` : ''}.</p>}
      </form>
      <p className={c.rotulo}>Ou toca no seu</p>
      <div className={c.grade9}>
        {conteudo.numeros.map((x) => (
          <button key={x.numero} type="button" className={`${c.num} ${res?.numero === x.numero ? c.numOn : ''}`} onClick={() => mostrar(x.numero)}>{x.numero}</button>
        ))}
      </div>
      {res && (
        <div className={c.revelacao} aria-live="polite">
          {res.dia && <p className={c.dica}>Dia {res.dia}{res.conta ? `: ${res.conta}` : ''}</p>}
          <div className={c.numeroLinha}>
            <span className={c.numeroGrande}>{res.numero}</span>
            <p className={c.texto}>{res.curta.charAt(0).toUpperCase() + res.curta.slice(1)}.</p>
          </div>
          <p className={c.rotulo}>A força de quem é {res.numero}</p>
          <p className={c.pratica}>{res.forca.charAt(0).toUpperCase() + res.forca.slice(1)}.</p>
        </div>
      )}
    </div>
  );
}

function Pausa({ conteudo, onToque }) {
  const [sel, setSel] = useState(null);
  return (
    <div className={c.bloco}>
      <ol className={c.praticas}>
        {conteudo.praticas.map((p, i) => (
          <li key={p}>
            <button type="button" className={`${c.praticaBtn} ${sel === i ? c.praticaOn : ''}`} onClick={() => { setSel(i); onToque(); }} aria-pressed={sel === i}>
              {p}
            </button>
          </li>
        ))}
      </ol>
      {sel !== null && <p className={c.pergunta} aria-live="polite">Essa é a sua de hoje: faz antes de dormir.</p>}
    </div>
  );
}

function Frase({ conteudo }) {
  return (
    <div className={c.bloco}>
      <blockquote className={c.frase}>“{conteudo.frase}”</blockquote>
      <p className={c.credito}>{conteudo.credito}</p>
      <p className={c.rotulo}>Pra hoje</p>
      <p className={c.pratica}>{conteudo.hoje}</p>
    </div>
  );
}

function Narrado({ conteudo }) {
  return (
    <div className={c.bloco}>
      {conteudo.porque && <p className={c.texto}>{conteudo.porque}</p>}
      {conteudo.virada && <p className={c.virada}>{conteudo.virada}</p>}
      <p className={c.rotulo}>Pra hoje</p>
      <p className={c.pratica}>{conteudo.pratica}</p>
    </div>
  );
}

const BLOCOS = { carta: Carta, numero: Numero, pausa: Pausa, frase: Frase, narrado: Narrado };

export default function EntradaClient({ posts, linhaTeste }) {
  const [ativo, setAtivo] = useState(0);
  const [rede, setRede] = useState('instagram');
  const mapa = useEstadoMapa();

  useEffect(() => {
    try {
      const a = JSON.parse(window.localStorage.getItem('ic_atrib') || 'null');
      if (a?.utm_source === 'tiktok') setRede('tiktok');
    } catch {}
  }, []);

  const tocar = (p) => {
    evento('comecar_toque', { formato: p.formato, tipo: p.tipo });
    if (rede === 'instagram' && declararFormato(p.utm)) evento('comecar_formato', { formato: p.formato, tipo: p.tipo });
  };

  const post = posts[ativo];
  const insta = rede === 'instagram';
  const t = post ? TEXTOS[post.formato] : null;
  const titulo = post ? (post.formato === 'narrado' ? post.conteudo.gancho : insta ? t.pergunta : t.convite) : null;
  const Bloco = post ? BLOCOS[post.formato] : null;

  return (
    <>
      {post && (
        <section className={c.post} aria-labelledby="comecar-titulo">
          <p className={c.eyebrow}>{insta ? `Continuando o ${post.origem} de ${post.quando}` : 'Pra começar'}</p>
          <h1 id="comecar-titulo" className={c.titulo}>{post.formato === 'frase' && post.quando !== 'hoje' ? `A frase de ${post.quando}` : titulo}</h1>
          {t.sub && <p className={c.sub}>{t.sub}</p>}
          <Bloco key={post.chave} conteudo={post.conteudo} onToque={() => tocar(post)} />
        </section>
      )}

      {insta && posts.length > 1 && (
        <nav className={c.outrosPosts} aria-label="Outros posts">
          <p className={c.rotulo}>Veio de outro post?</p>
          <div className={c.chips}>
            {posts.map((p, i) => (
              <button key={p.chave} type="button" className={`${c.chip} ${i === ativo ? c.chipOn : ''}`} aria-pressed={i === ativo}
                onClick={() => { if (i !== ativo) { setAtivo(i); tocar(p); } }}>
                {p.titulo} · {p.origem === 'Story' ? 'Story ' : ''}{p.quando}
              </button>
            ))}
          </div>
        </nav>
      )}

      <section className={c.cta}>
        <p className={c.ctaTexto}>{post ? 'Quer ver o que o seu próprio mapa diz sobre você?' : 'Seu mapa é grátis. Começa por ele.'}</p>
        <a href={mapa.href} className={c.btn} onClick={() => evento('cta_mapa_click', { estado: mapa.estado, origem: 'comecar' })}>{mapa.rotulo}</a>
        {mapa.estado === 'sem-mapa' && <p className={c.linhaTeste}>{linhaTeste}</p>}
      </section>
    </>
  );
}
