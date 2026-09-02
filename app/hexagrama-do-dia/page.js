import HexagramaClient from './HexagramaClient';

export const metadata = {
  title: 'Hexagrama do Dia | Leitura Grátis de I Ching — Intuitive Concept',
  description: 'Uma leitura simbólica do I Ching pro seu dia, com o que favorece e o que pede cuidado — grátis, muda todo dia à meia-noite.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/hexagrama-do-dia' },
  openGraph: {
    title: 'Hexagrama do Dia | Intuitive Concept',
    description: 'Uma leitura simbólica do I Ching pro seu dia — grátis, muda todo dia.',
    url: 'https://intuitiveconcept.com.br/hexagrama-do-dia',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function HexagramaDoDiaPage() {
  return <HexagramaClient />;
}
