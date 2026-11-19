// /anjo-da-guarda/[anjo] — página de cada um dos 72 anjos (SEO: "anjo Nithael",
// "anjo da guarda 17 de dezembro"). Estática, sem dados pessoais.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import { ANJOS, anjoPorSlug, dadosDoAnjo, periodosDoAno } from '@/lib/anjos';
import { TEXTO_ANJO, TEXTO_CORO, TEXTO_ELEMENTO_ANJO } from '@/lib/anjosTextos';
import { CSS_ANJO, FONTES_ANJO } from '../estilo';

export const revalidate = 86400;

export function generateStaticParams() {
  return ANJOS.map((a) => ({ anjo: a.slug }));
}

export async function generateMetadata({ params }) {
  const { anjo: slug } = await params;
  const a = anjoPorSlug(slug);
  if (!a) return { title: 'Anjo não encontrado | Intuitive Concept' };
  const p = periodosDoAno(new Date().getFullYear())[a.n - 1];
  const t = TEXTO_ANJO[a.n];
  const title = `Anjo ${a.nome}: ${t.dom.toLowerCase()} — nascidos de ${p.inicio} a ${p.fim} | Intuitive Concept`;
  const description = `${a.nome} é o ${a.n}º dos 72 anjos da Cabala. ${t.essencia.split('. ')[0]}. Veja a sombra, como se conectar e o que pedir.`;
  const url = `https://intuitiveconcept.com.br/anjo-da-guarda/${a.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, locale: 'pt_BR', type: 'article', siteName: 'Intuitive Concept' },
  };
}

export default async function AnjoPage({ params }) {
  const { anjo: slug } = await params;
  const a = anjoPorSlug(slug);
  if (!a) notFound();

  const ano = new Date().getFullYear();
  const g = dadosDoAnjo(a.n);
  const t = TEXTO_ANJO[a.n];
  const p = periodosDoAno(ano)[a.n - 1];
  const anterior = ANJOS[(a.n + 70) % 72];
  const proximo = ANJOS[a.n % 72];
  const irmaos = ANJOS.filter((x) => dadosDoAnjo(x.n).coro.nome === g.coro.nome && x.n !== a.n);

  return (
    <div className="an-wrap">
      <link href={FONTES_ANJO} rel="stylesheet" />
      <SiteNav active="anjo" />

      <article className="an-sec">
        <div className="an-card">
          <span className="an-eyebrow">Anjo nº {g.n} de 72</span>
          <h1 className="an-nome">{g.nome}</h1>
          <div className="an-num">coro dos {g.coro.nome} · nascidos de {p.inicio} a {p.fim}</div>
          <p className="an-dom">{t.dom}</p>
        </div>

        <h3>Como {g.nome} aparece em quem nasce sob ele</h3>
        <p>{t.essencia}</p>
        <h3>A sombra</h3>
        <p>{t.sombra}</p>
        <h3>Como se conectar</h3>
        <p>{t.pratica}</p>
        <h3>O que pedir a {g.nome}</h3>
        <ul className="an-pedir">{t.pedir.map((x) => <li key={x}>{x}</li>)}</ul>
        <h3>Com {g.nome} como anjo da mente</h3>
        <p>Quem nasceu entre {g.hora.replace('–', ' e ')} {t.mente}.</p>

        <ul className="an-ficha">
          <li><b>Céu</b>{g.grauInicio}° a {g.grauFim}° de {g.signo}</li>
          <li><b>Datas em {ano}</b>{p.inicio} a {p.fim}</li>
          <li><b>Hora regente</b>{g.hora}</li>
          <li><b>Coro</b>{g.coro.nome}, sob {g.coro.arcanjo}</li>
          <li><b>Sefirá</b>{g.coro.sefira} — {g.coro.sefiraPt}</li>
          <li><b>Elemento · tarô</b>{g.elemento} · {g.carta}</li>
        </ul>
        <p className="an-nota" style={{ marginTop: 16 }}>{TEXTO_CORO[g.coro.nome]} {TEXTO_ELEMENTO_ANJO[g.elemento]}</p>
        <p className="an-nota">
          As datas mudam 1 dia de um ano pro outro, porque o que define o anjo é a posição do Sol ({g.grauInicio}° a {g.grauFim}° de {g.signo}).
          Se você nasceu no primeiro ou no último dia, confira na calculadora.
        </p>

        <div className="an-cta">
          <p>Descubra se {g.nome} é mesmo o seu — e qual anjo rege a sua mente pela hora em que você nasceu.</p>
          <div className="an-cta-btns">
            <Link href="/anjo-da-guarda" className="an-btn">Descobrir meus anjos ✶</Link>
          </div>
        </div>

        <h2>Os outros anjos do coro dos {g.coro.nome}</h2>
        <ul className="an-lista">
          {irmaos.map((x) => (
            <li key={x.n}>
              <Link href={`/anjo-da-guarda/${x.slug}`}>
                <span className="n">{x.n}</span>{x.nome}
                <span className="d">{TEXTO_ANJO[x.n].dom}</span>
              </Link>
            </li>
          ))}
        </ul>

        <nav className="an-nav">
          <Link href={`/anjo-da-guarda/${anterior.slug}`}>← {anterior.n}. {anterior.nome}</Link>
          <Link href="/anjo-da-guarda">Todos os 72</Link>
          <Link href={`/anjo-da-guarda/${proximo.slug}`}>{proximo.n}. {proximo.nome} →</Link>
        </nav>
      </article>

      <style>{CSS_ANJO}</style>
    </div>
  );
}
