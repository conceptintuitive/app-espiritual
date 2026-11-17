import CeuClient from './CeuClient';

export const metadata = {
  title: 'O céu do seu nascimento | Intuitive Concept',
  description: 'Veja o céu exato do momento em que você nasceu — e o número que ele deixou em você.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/ceu' },
  openGraph: {
    title: 'O céu do seu nascimento | Intuitive Concept',
    description: 'Veja o céu exato do momento em que você nasceu — e o número que ele deixou em você.',
    url: 'https://intuitiveconcept.com.br/ceu',
    siteName: 'Intuitive Concept',
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport = { themeColor: '#000000' };

export default function CeuPage() {
  return <CeuClient />;
}
