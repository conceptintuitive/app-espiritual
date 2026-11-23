'use client';

// O bloco interativo do post só carrega depois da página (next/dynamic com
// ssr:false não pode ficar num Server Component, por isso este arquivo).
// A vaga reserva a altura pra o texto de baixo não pular.

import dynamic from 'next/dynamic';
import b from '../blog.module.css';

const BlocoInterativo = dynamic(() => import('./BlocoInterativo'), {
  ssr: false,
  loading: () => <div className={b.blocoVaga} aria-hidden="true" />,
});

export default function BlocoCarregador(props) {
  return <BlocoInterativo {...props} />;
}
