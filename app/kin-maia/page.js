import KinClient from './KinClient';

const TITULO = 'Kin Maia: descubra sua assinatura galáctica pela data de nascimento | Intuitive Concept';
const DESCRICAO = 'Calcule seu Kin Maia do Sincronário da Paz: selo, tom, cor, onda encantada e oráculo (guia, análogo, antípoda e oculto). Grátis, na hora, com o Kin de hoje.';

export const metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: 'https://intuitiveconcept.com.br/kin-maia' },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: 'https://intuitiveconcept.com.br/kin-maia',
    siteName: 'Intuitive Concept',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function KinMaiaPage() {
  return <KinClient />;
}
