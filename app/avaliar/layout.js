// Link pessoal do e-mail de avaliação: fora do Google.
export const metadata = {
  title: 'O seu Manual bate com você?',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function Layout({ children }) {
  return children;
}
