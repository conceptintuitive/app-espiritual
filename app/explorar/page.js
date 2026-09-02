import ExplorarClient from './ExplorarClient';

export const metadata = {
  title: 'Explorar | Intuitive Concept — Numerologia, Astrologia e Compatibilidade',
  description: 'Seu mapa completo, Oráculo, Compatibilidade Astral, Previsão do Ano, Human Design, Hexagrama do Dia e Blog — tudo em um só lugar.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/explorar' },
  openGraph: {
    title: 'Explorar | Intuitive Concept',
    description: 'Seu mapa completo, Oráculo, Compatibilidade Astral, Previsão do Ano, Human Design e mais — escolha por onde começar.',
    url: 'https://intuitiveconcept.com.br/explorar',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function ExplorarPage() {
  return <ExplorarClient />;
}
