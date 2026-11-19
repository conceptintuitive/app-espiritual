import AstrologiaChinesaClient from './AstrologiaChinesaClient';

const TITULO = 'Astrologia Chinesa: seu mapa BaZi completo e grátis | Intuitive Concept';
const DESCRICAO = 'Descubra seu animal, seu elemento e os 4 Pilares do Destino (BaZi) — com a hora corrigida pelo horário de verão e pelo sol da sua cidade. Leitura completa e gratuita.';

export const metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: 'https://intuitiveconcept.com.br/astrologia-chinesa' },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: 'https://intuitiveconcept.com.br/astrologia-chinesa',
    siteName: 'Intuitive Concept',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function AstrologiaChinesaPage() {
  return <AstrologiaChinesaClient />;
}
