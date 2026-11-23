// Linha da lista editorial do blog (índice e "Leia também"): capa 4:5 à
// esquerda, rótulo mono (categoria · data), título serif e uma linha de texto.
// Sem 'use client': serve tanto pro Server Component do post quanto pro
// BlogLista (client).

import Link from 'next/link';
import Image from 'next/image';
import b from './blog.module.css';

/** @param {{ p: { slug: string, title: string, excerpt: string, rotulo: string, data: string }, onClick?: () => void }} props */
export default function ItemPost({ p, onClick }) {
  return (
    <li>
      <Link href={`/blog/${p.slug}`} className={b.item} onClick={onClick}>
        <div className={b.capaPeq}>
          <Image src={`/blog/${p.slug}/capa/4x5`} alt="" fill sizes="(min-width: 700px) 120px, 84px" />
        </div>
        <div className={b.itemTexto}>
          <span className={b.rotulo}><b>{p.rotulo}</b> · {p.data}</span>
          <h3 className={b.itemTitulo}>{p.title}</h3>
          <p className={b.itemResumo}>{p.excerpt}</p>
        </div>
      </Link>
    </li>
  );
}
