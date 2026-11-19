// /astrologia-chinesa/dez-deuses/[deus] — página de cada um dos Dez Deuses do
// BaZi (SEO: "sete matanças bazi", "riqueza direta astrologia chinesa").
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import { TEXTO_DEUSES } from '@/lib/baziTextos';
import { DEUS_EXPLICA, RELACAO_DEUS, POLARIDADE } from '@/lib/seuDiaTextos';
import { DEUSES, deusPorSlug } from '@/lib/seoChines';
import { CSS_ANJO, FONTES_ANJO } from '@/app/anjo-da-guarda/estilo';

export function generateStaticParams() {
  return DEUSES.map((d) => ({ deus: d.slug }));
}

export async function generateMetadata({ params }) {
  const { deus } = await params;
  const d = deusPorSlug(deus);
  if (!d) return { title: 'Não encontrado | Intuitive Concept' };
  const t = TEXTO_DEUSES[d.chave];
  const title = `${d.nome} (${d.hanzi}, ${d.pinyin}) no BaZi: significado | Intuitive Concept`;
  const description = `${d.nome} na astrologia chinesa: ${t.curto}. O que significa no seu mapa, no ano e no dia — e como usar.`;
  const url = `https://intuitiveconcept.com.br/astrologia-chinesa/dez-deuses/${d.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, locale: 'pt_BR', type: 'article', siteName: 'Intuitive Concept' } };
}

export default async function DeusPage({ params }) {
  const { deus } = await params;
  const d = deusPorSlug(deus);
  if (!d) notFound();
  const t = TEXTO_DEUSES[d.chave];
  const e = DEUS_EXPLICA[d.chave];
  const k = DEUSES.findIndex((x) => x.slug === d.slug);
  const anterior = DEUSES[(k + 9) % 10];
  const proximo = DEUSES[(k + 1) % 10];

  return (
    <div className="an-wrap">
      <link href={FONTES_ANJO} rel="stylesheet" />
      <SiteNav active="astrologia-chinesa" />
      <article className="an-sec">
        <div className="an-card">
          <span className="an-eyebrow">Os Dez Deuses do BaZi</span>
          <h1 className="an-nome">{d.nome}</h1>
          <div className="an-num"><span lang="zh">{d.hanzi}</span> · {d.pinyin}</div>
          <p className="an-dom">{t.curto}</p>
        </div>

        <h3>O que é</h3>
        <p>{t.texto}</p>
        <h3>De onde vem o nome</h3>
        <p>{RELACAO_DEUS[d.relacao]} {POLARIDADE[d.polaridade]}</p>
        <p className="an-nota">
          Os Dez Deuses não são entidades: são as 10 relações possíveis entre o seu elemento (o Day Master, o tronco do dia em
          que você nasceu) e cada outro elemento do mapa, do ano ou do dia.
        </p>
        <h3>Quando aparece no ano</h3>
        <p>{t.ano}</p>
        <h3>Quando é o Deus do dia</h3>
        <p><strong>O que esperar:</strong> {e.esperar}</p>
        <p><strong>Como usar:</strong> {e.usar}</p>

        <div className="an-cta">
          <p>Descubra quais Deuses aparecem no seu mapa — e qual rege o seu dia de hoje.</p>
          <div className="an-cta-btns">
            <Link href="/astrologia-chinesa" className="an-btn">Ver meu mapa chinês grátis</Link>
            <Link href="/seu-dia" className="an-btn sec">Meu dia de hoje</Link>
          </div>
        </div>

        <h2>Os Dez Deuses</h2>
        <ul className="an-lista">
          {DEUSES.map((x) => (
            <li key={x.slug}><Link href={`/astrologia-chinesa/dez-deuses/${x.slug}`} className={x.slug === d.slug ? 'eu' : undefined}><span className="n" lang="zh">{x.hanzi}</span>{x.nome}</Link></li>
          ))}
        </ul>
        <nav className="an-nav">
          <Link href={`/astrologia-chinesa/dez-deuses/${anterior.slug}`}>← {anterior.nome}</Link>
          <Link href="/astrologia-chinesa/animal/rato">Os 12 animais</Link>
          <Link href={`/astrologia-chinesa/dez-deuses/${proximo.slug}`}>{proximo.nome} →</Link>
        </nav>
      </article>
      <style>{CSS_ANJO}</style>
    </div>
  );
}
