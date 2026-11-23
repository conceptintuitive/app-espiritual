// /kin-maia/[selo] — página de cada um dos 20 selos do Sincronário (SEO:
// "kin terra vermelha", "selo mago branco significado"). Estática.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import { SELOS, TONS, kinDeSeloTom, nomeDoKin, oraculo, seloDoKin } from '@/lib/kin';
import { TEXTO_SELO, TEXTO_TOM, TEXTO_COR, TEXTO_ORACULO } from '@/lib/kinTextos';
import { CSS_ANJO, FONTES_ANJO } from '@/app/anjo-da-guarda/estilo';

const seloPorSlug = (slug) => SELOS.find((s) => s.slug === slug) || null;

export function generateStaticParams() {
  return SELOS.map((s) => ({ selo: s.slug }));
}

export async function generateMetadata({ params }) {
  const { selo } = await params;
  const s = seloPorSlug(selo);
  if (!s) return { title: 'Selo não encontrado | Intuitive Concept' };
  const t = TEXTO_SELO[s.codigo];
  const title = `${s.nomeCompleto} no Kin Maia: significado do selo ${s.codigo} | Intuitive Concept`;
  const description = `Selo ${s.nomeCompleto} do Sincronário da Paz: ${t.palavras.join(', ')}. Personalidade, sombra, oráculo e os 13 Kins deste selo.`;
  const url = `https://intuitiveconcept.com.br/kin-maia/${s.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, locale: 'pt_BR', type: 'article', siteName: 'Intuitive Concept' } };
}

export default async function SeloPage({ params }) {
  const { selo } = await params;
  const s = seloPorSlug(selo);
  if (!s) notFound();
  const t = TEXTO_SELO[s.codigo];
  // Análogo, antípoda e oculto não dependem do tom: qualquer Kin do selo serve.
  const o = oraculo(kinDeSeloTom(s.codigo, 1));
  const kins = TONS.map((tom) => {
    const k = kinDeSeloTom(s.codigo, tom.numero);
    return { k, nome: nomeDoKin(k), tom: tom.numero, guia: seloDoKin(oraculo(k).guia).nomeCompleto };
  });
  const anterior = SELOS[(s.codigo + 18) % 20];
  const proximo = SELOS[s.codigo % 20];

  return (
    <div className="an-wrap">
      <link href={FONTES_ANJO} rel="stylesheet" />
      <SiteNav active="kin-maia" />
      <article className="an-sec">
        <div className="an-card">
          <span className="an-eyebrow">Kin Maia · selo {s.codigo} de 20</span>
          <h1 className="an-nome">{s.nomeCompleto}</h1>
          <div className="an-num"><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 99, background: s.cor.hex, marginRight: 6 }} />cor {s.cor.nome.toLowerCase()}</div>
          <p className="an-dom">{t.palavras.join(' · ')}</p>
        </div>

        <h3>Quem tem esse selo</h3>
        <p>{t.texto}</p>
        <h3>A sombra</h3>
        <p>{t.sombra}</p>
        <h3>A cor</h3>
        <p>{TEXTO_COR[s.cor.nome]}</p>
        <h3>Quando é o selo do dia</h3>
        <p>{t.hoje}</p>

        <h2>O oráculo de {s.nomeCompleto}</h2>
        <ul className="an-pedir">
          {['analogo', 'antipoda', 'oculto'].map((p) => (
            <li key={p}><strong>{TEXTO_ORACULO[p].titulo}: {seloDoKin(o[p]).nomeCompleto}.</strong> {TEXTO_ORACULO[p].texto}</li>
          ))}
          <li><strong>Guia:</strong> muda com o tom — veja na lista abaixo. {TEXTO_ORACULO.guia.texto}</li>
        </ul>

        <h2>Os 13 Kins de {s.nomeCompleto}</h2>
        <ul className="an-lista kin-13">
          {kins.map((x) => (
            <li key={x.k}><span className="kin-li"><span className="n">{x.k}</span><span>{x.nome}<small>tom {x.tom}: {TEXTO_TOM[x.tom].palavras[0].toLowerCase()} · guia {x.guia}</small></span></span></li>
          ))}
        </ul>

        <div className="an-cta">
          <p>Descubra o seu Kin pela data de nascimento — selo, tom, oráculo e onda encantada.</p>
          <div className="an-cta-btns"><Link href="/kin-maia" className="an-btn">Descobrir meu Kin</Link></div>
        </div>

        <h2>Os 20 selos</h2>
        <ul className="an-lista">
          {SELOS.map((x) => (
            <li key={x.slug}><Link href={`/kin-maia/${x.slug}`} className={x.codigo === s.codigo ? 'eu' : undefined}><span className="n">{x.codigo}</span>{x.nomeCompleto}</Link></li>
          ))}
        </ul>
        <nav className="an-nav">
          <Link href={`/kin-maia/${anterior.slug}`}>← {anterior.nomeCompleto}</Link>
          <Link href="/kin-maia">Calcular meu Kin</Link>
          <Link href={`/kin-maia/${proximo.slug}`}>{proximo.nomeCompleto} →</Link>
        </nav>
      </article>
      <style>{CSS_ANJO + CSS_EXTRA}</style>
    </div>
  );
}

const CSS_EXTRA = `
  .kin-li { display: flex; gap: 10px; align-items: baseline; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 17px; }
  .kin-li .n { font-family: 'Cinzel', serif; font-size: 13px; color: var(--ouro); min-width: 34px; }
  .kin-li small { display: block; font-size: 14px; color: var(--muted); }
  .kin-13 { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
`;
