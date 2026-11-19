// /astrologia-chinesa/animal/[animal] — página de cada um dos 12 animais (SEO:
// "signo chinês cachorro", "ano do cavalo"). Estática, sem dados pessoais.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import { RAMOS, ELEMENTOS } from '@/lib/bazi';
import { ANIMAIS, SABOR_ELEMENTO_ANO, TEXTO_RELACOES } from '@/lib/baziTextos';
import { oAnimal } from '@/lib/seuDiaTextos';
import { animalPorSlug, anosDoAnimal, relacoesDoAnimal } from '@/lib/seoChines';
import { CSS_ANJO, FONTES_ANJO } from '@/app/anjo-da-guarda/estilo';

export function generateStaticParams() {
  return RAMOS.map((r) => ({ animal: r.slug }));
}

export async function generateMetadata({ params }) {
  const { animal } = await params;
  const a = animalPorSlug(animal);
  if (!a) return { title: 'Animal não encontrado | Intuitive Concept' };
  const anos = anosDoAnimal(a.i, 1948, 2031).map((x) => x.ano).join(', ');
  const title = `${a.animal} no horóscopo chinês: personalidade, anos e combinações | Intuitive Concept`;
  const description = `Signo chinês ${a.animal} (${a.hanzi}): como é, no amor e no trabalho, com quem combina e quem nasceu nos anos ${anos}.`;
  const url = `https://intuitiveconcept.com.br/astrologia-chinesa/animal/${a.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, locale: 'pt_BR', type: 'article', siteName: 'Intuitive Concept' } };
}

const nomes = (lista) => lista.map((j) => RAMOS[j].animal);
const listaHumana = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

export default async function AnimalPage({ params }) {
  const { animal } = await params;
  const a = animalPorSlug(animal);
  if (!a) notFound();
  const t = ANIMAIS[a.i];
  const anos = anosDoAnimal(a.i);
  const rel = relacoesDoAnimal(a.i);
  const fem = oAnimal(a.animal).startsWith('a ');
  const de = fem ? 'da' : 'do';
  const anterior = RAMOS[(a.i + 11) % 12];
  const proximo = RAMOS[(a.i + 1) % 12];

  return (
    <div className="an-wrap">
      <link href={FONTES_ANJO} rel="stylesheet" />
      <SiteNav active="astrologia-chinesa" />
      <article className="an-sec">
        <div className="an-card">
          <span className="an-eyebrow">Horóscopo chinês · animal {a.i + 1} de 12</span>
          <h1 className="an-nome"><span lang="zh">{a.hanzi}</span> {a.animal}</h1>
          <div className="an-num">elemento fixo: {ELEMENTOS[a.elemento].nome}</div>
        </div>

        <h3>Como é {oAnimal(a.animal)}</h3>
        <p>{t.perfil}</p>
        <h3>No amor</h3>
        <p>{t.intimo}</p>
        <h3>No trabalho</h3>
        <p>{t.mes}</p>
        <h3>Na segunda metade da vida</h3>
        <p>{t.hora}</p>

        <h2>Anos {de} {a.animal}</h2>
        <ul className="an-lista">
          {anos.map((x) => (
            <li key={x.ano}><span className="kin-li"><span className="n">{x.ano}</span>{a.animal} de {x.elemento}<span className="d">{x.yang ? 'Yang' : 'Yin'}</span></span></li>
          ))}
        </ul>
        <p className="an-nota" style={{ marginTop: 14 }}>
          O ano chinês começa por volta de 4 de fevereiro (Lichun), não em 1º de janeiro. Quem nasceu em janeiro ou nos
          primeiros dias de fevereiro é do animal do ano anterior — a calculadora resolve isso pela data exata.
        </p>

        <h2>As 5 versões, pelo elemento do ano</h2>
        <ul className="an-pedir">
          {ELEMENTOS.map((e, k) => <li key={e.slug}><strong>{a.animal} de {e.nome}:</strong> {SABOR_ELEMENTO_ANO[k].replace('ao seu animal', `${fem ? 'à' : 'ao'} ${a.animal}`)}</li>)}
        </ul>

        <h2>Com quem {oAnimal(a.animal)} combina</h2>
        {rel.combinacao.length > 0 && <p><strong>{TEXTO_RELACOES.combinacao.titulo}:</strong> {listaHumana(nomes(rel.combinacao))}. {TEXTO_RELACOES.combinacao.texto}</p>}
        {rel.trio.length > 0 && <p><strong>{TEXTO_RELACOES.trio.titulo}:</strong> {listaHumana(nomes(rel.trio))}. {TEXTO_RELACOES.trio.texto}</p>}
        {rel.choque.length > 0 && <p><strong>{TEXTO_RELACOES.choque.titulo}:</strong> {listaHumana(nomes(rel.choque))}. {TEXTO_RELACOES.choque.texto}</p>}
        {rel.atrito.length > 0 && <p><strong>Atrito (punição ou dano):</strong> {listaHumana(nomes(rel.atrito))}. Relação que pede cuidado com mal-entendidos e cobranças.</p>}
        <p className="an-nota">O animal do ano é só uma camada: a compatibilidade de verdade cruza os 4 pilares dos dois. <Link className="an-link" href="/astrologia-chinesa/compatibilidade">Calcular a compatibilidade completa</Link>.</p>

        <div className="an-cta">
          <p>Seu animal é a superfície. O mapa BaZi mostra os 4 pilares — e quem você é por dentro.</p>
          <div className="an-cta-btns"><Link href="/astrologia-chinesa" className="an-btn">Ver meu mapa chinês grátis</Link></div>
        </div>

        <h2>Os 12 animais</h2>
        <ul className="an-lista">
          {RAMOS.map((r, k) => (
            <li key={r.slug}><Link href={`/astrologia-chinesa/animal/${r.slug}`} className={k === a.i ? 'eu' : undefined}><span className="n" lang="zh">{r.hanzi}</span>{r.animal}</Link></li>
          ))}
        </ul>
        <nav className="an-nav">
          <Link href={`/astrologia-chinesa/animal/${anterior.slug}`}>← {anterior.animal}</Link>
          <Link href="/astrologia-chinesa/dez-deuses/amigo">Os Dez Deuses</Link>
          <Link href={`/astrologia-chinesa/animal/${proximo.slug}`}>{proximo.animal} →</Link>
        </nav>
      </article>
      <style>{CSS_ANJO + CSS_EXTRA}</style>
    </div>
  );
}

const CSS_EXTRA = `
  .kin-li { display: flex; gap: 10px; align-items: baseline; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 17px; }
  .kin-li .n { font-family: 'Cinzel', serif; font-size: 13px; color: var(--ouro); min-width: 40px; }
  .kin-li .d { margin-left: auto; font-size: 14px; color: var(--muted); }
`;
