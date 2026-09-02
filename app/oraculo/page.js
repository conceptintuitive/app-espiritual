import OraculoClient from './OraculoClient';

export const metadata = {
  title: 'Oráculo Grátis | Perguntas Sobre Seu Mapa — Intuitive Concept',
  description: 'Pergunta qualquer coisa sobre o seu Sol, Lua, Ascendente ou seus números — o Oráculo responde olhando pros seus dados reais. 3 perguntas grátis.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/oraculo' },
  openGraph: {
    title: 'Oráculo Grátis | Intuitive Concept',
    description: 'Um espelho que já conhece o seu mapa — pergunta qualquer coisa e receba resposta na hora.',
    url: 'https://intuitiveconcept.com.br/oraculo',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function OraculoPage() {
  return <OraculoClient />;
}
