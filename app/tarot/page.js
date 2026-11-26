// /tarot — índice dos 22 Arcanos Maiores (Server Component, sem IA).
// Cada carta tem a própria página em /tarot/[slug] (lib/seoTarot.js).

import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import CtaMapa from '@/app/components/CtaMapa';
import { ARCANOS_SEO, BASE_URL, jsonSeguro } from '@/lib/seoTarot';
import b from '@/app/blog/blog.module.css';
import s from '@/app/components/seo/seo.module.css';

const title = 'Tarô: o significado dos 22 Arcanos Maiores | Intuitive Concept';
const description = 'Os 22 Arcanos Maiores do Tarô, do Louco ao Mundo: o significado de cada carta, o que ela pede hoje na prática e três perguntas pra refletir.';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title,
  description,
  alternates: { canonical: `${BASE_URL}/tarot` },
  openGraph: { title, description, url: `${BASE_URL}/tarot`, locale: 'pt_BR', type: 'website' },
};

export default function TarotPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Os 22 Arcanos Maiores do Tarô',
      description,
      url: `${BASE_URL}/tarot`,
      inLanguage: 'pt-BR',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: ARCANOS_SEO.map((a, i) => ({ '@type': 'ListItem', position: i + 1, name: a.nome, url: `${BASE_URL}/tarot/${a.slug}` })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Tarô', item: `${BASE_URL}/tarot` },
      ],
    },
  ];

  return (
    <div className={b.blog}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(jsonLd) }} />
      <SiteNav active="tarot" />

      <main className={b.ctr}>
        <header className={b.topo}>
          <span className={b.eyebrow}>Tarô</span>
          <h1 className={b.titulo}>Os 22 <em>Arcanos Maiores</em></h1>
          <p className={b.sub}>Do Louco ao Mundo. Em cada carta: o significado, o que ela pede hoje na prática e três perguntas pra refletir.</p>
        </header>

        <ul className={s.grade} style={{ marginTop: 28 }}>
          {ARCANOS_SEO.map((a) => (
            <li key={a.slug}>
              <Link href={`/tarot/${a.slug}`} className={s.cartao}>
                <span className={s.cartaoNum}>{a.id}</span>
                <div>
                  <h2 className={s.cartaoNome}>{a.nome}</h2>
                  <p className={s.cartaoPalavras}>{a.palavrasChave.join(' · ')}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className={b.fimIndice}>
          <div className={b.ctaFim} style={{ marginTop: 0 }}>
            <p className={b.ctaFimTexto}>Quer ver o que o seu próprio mapa diz sobre você?</p>
            <CtaMapa className={b.btn} origem="tarot" />
          </div>
        </div>
      </main>
    </div>
  );
}
