import SeuDiaClient from './SeuDiaClient';

const TITULO = 'Seu Dia: seu mapa lido todo dia | Intuitive Concept';
const DESCRICAO = 'Astrologia chinesa, numerologia, a Lua e o tarô cruzados num recado só, pra você — todo dia. Com as suas horas de força no relógio da sua cidade.';

export const metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: 'https://intuitiveconcept.com.br/seu-dia' },
  appleWebApp: { capable: true, title: 'Seu Dia', statusBarStyle: 'black-translucent' },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: 'https://intuitiveconcept.com.br/seu-dia',
    siteName: 'Intuitive Concept',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function SeuDiaPage() {
  return <SeuDiaClient />;
}
