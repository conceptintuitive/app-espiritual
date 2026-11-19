import CompatBaziClient from './CompatBaziClient';

const TITULO = 'Compatibilidade na Astrologia Chinesa (BaZi) grátis | Intuitive Concept';
const DESCRICAO = 'Compare dois mapas BaZi completos — não só o animal do ano: Day Masters, palácio do cônjuge, atração escondida e se um completa o outro. Grátis, calculado no seu navegador.';

export const metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: 'https://intuitiveconcept.com.br/astrologia-chinesa/compatibilidade' },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: 'https://intuitiveconcept.com.br/astrologia-chinesa/compatibilidade',
    siteName: 'Intuitive Concept',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function CompatBaziPage() {
  return <CompatBaziClient />;
}
