import CompatibilidadeClient from './CompatibilidadeClient';

export const metadata = {
  title: 'Compatibilidade Astral Grátis | Intuitive Concept',
  description: 'Escolha dois signos e veja como eles se encontram no amor, na comunicação e no dia a dia — grátis, sem cadastro.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/compatibilidade' },
  openGraph: {
    title: 'Compatibilidade Astral Grátis | Intuitive Concept',
    description: 'Escolha dois signos e veja como eles se encontram — grátis, sem cadastro.',
    url: 'https://intuitiveconcept.com.br/compatibilidade',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function CompatibilidadePage() {
  return <CompatibilidadeClient />;
}
