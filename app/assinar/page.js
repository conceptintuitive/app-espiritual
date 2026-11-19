import { Suspense } from 'react';
import AssinarClient from './AssinarClient';

const TITULO = 'Intuitive Completo: tudo liberado | Intuitive Concept';
const DESCRICAO = 'Seu Dia completo, Previsão do Ano, Human Design, Compatibilidade Completa e Oráculo ilimitado numa assinatura só. O anual inclui o Manual.';

export const metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: 'https://intuitiveconcept.com.br/assinar' },
  openGraph: { title: TITULO, description: DESCRICAO, url: 'https://intuitiveconcept.com.br/assinar', siteName: 'Intuitive Concept', locale: 'pt_BR', type: 'website' },
};

export default function AssinarPage() {
  return (
    <Suspense fallback={null}>
      <AssinarClient />
    </Suspense>
  );
}
