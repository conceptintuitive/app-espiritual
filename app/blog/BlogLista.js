'use client';

// Lista do /blog com o filtro por categoria. O post mais recente (da
// categoria escolhida) vai em destaque, com a capa larga; o resto em lista
// editorial com a capa 4:5. ?categoria=<id> na URL abre já filtrado.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ItemPost from './ItemPost';
import b from './blog.module.css';

function evento(nome, params) {
  try { window.gtag?.('event', nome, { event_category: 'blog', ...params }); } catch {}
}

/**
 * @param {{ posts: Array<{ slug: string, title: string, excerpt: string, categoria: string, rotulo: string, data: string }>,
 *           categorias: Array<{ id: string, rotulo: string }> }} props
 */
export default function BlogLista({ posts, categorias }) {
  const [cat, setCat] = useState('todas');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('categoria');
    if (q && categorias.some((c) => c.id === q)) setCat(q); // eslint-disable-line react-hooks/set-state-in-effect
  }, [categorias]);

  const escolher = (id) => {
    setCat(id);
    evento('blog_filtro', { categoria: id });
    try {
      const url = new URL(window.location.href);
      if (id === 'todas') url.searchParams.delete('categoria'); else url.searchParams.set('categoria', id);
      window.history.replaceState(null, '', url);
    } catch {}
  };

  const filtrados = cat === 'todas' ? posts : posts.filter((p) => p.categoria === cat);
  const [destaque, ...resto] = filtrados;
  const rotuloCat = categorias.find((c) => c.id === cat)?.rotulo;

  return (
    <>
      <nav className={b.filtro} aria-label="Categorias">
        {[{ id: 'todas', rotulo: 'Tudo' }, ...categorias].map((c) => (
          <button key={c.id} type="button" className={`${b.chip} ${cat === c.id ? b.chipOn : ''}`}
            aria-pressed={cat === c.id} onClick={() => escolher(c.id)}>
            {c.rotulo}
          </button>
        ))}
      </nav>

      {!destaque && <p className={b.vazio}>Ainda não tem post de {rotuloCat} por aqui. Enquanto isso, veja os outros temas.</p>}

      {destaque && (
        <Link href={`/blog/${destaque.slug}`} className={b.destaque}>
          <div className={b.capaLarga}>
            <Image src={`/blog/${destaque.slug}/capa/largo`} alt="" fill priority sizes="(min-width: 960px) 620px, 100vw" />
          </div>
          <div className={b.destaqueTexto}>
            <span className={b.rotulo}><b>{destaque.rotulo}</b> · {destaque.data}</span>
            <h2 className={b.destaqueTitulo}>{destaque.title}</h2>
            <p className={b.destaqueResumo}>{destaque.excerpt}</p>
          </div>
        </Link>
      )}

      {resto.length > 0 && (
        <ul className={b.lista}>
          {resto.map((p) => <ItemPost key={p.slug} p={p} />)}
        </ul>
      )}
    </>
  );
}
