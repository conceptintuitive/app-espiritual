// Página pessoal (dados de nascimento de uma cliente): fora do Google, mesmo se
// o link for compartilhado. A página é Client Component, por isso o metadata
// fica neste layout.
export const metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function Layout({ children }) {
  return children;
}
