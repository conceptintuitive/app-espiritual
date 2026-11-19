import AnjoClient from './AnjoClient';
import { periodosDoAno } from '@/lib/anjos';

const TITULO = 'Qual é o meu Anjo da Guarda? Os 72 anjos da Cabala pela data de nascimento | Intuitive Concept';
const DESCRICAO = 'Descubra seu anjo da guarda cabalístico pela posição exata do Sol no seu nascimento (sem erro na virada de datas) e o anjo da sua mente pela hora. Grátis, na hora.';

export const metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: 'https://intuitiveconcept.com.br/anjo-da-guarda' },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: 'https://intuitiveconcept.com.br/anjo-da-guarda',
    siteName: 'Intuitive Concept',
    locale: 'pt_BR',
    type: 'website',
  },
};

// As datas da lista são do ano corrente (mudam 1 dia de um ano pro outro).
export const revalidate = 86400;

export default function AnjoDaGuardaPage() {
  const ano = new Date().getFullYear();
  return <AnjoClient periodos={periodosDoAno(ano)} ano={ano} />;
}
