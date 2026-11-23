'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { salvarCeuDados } from '@/lib/ceuDados';
import { salvarSeForMeu } from '@/lib/perfilLocal';
import SiteNav from '@/app/components/SiteNav';

// ssr:false — o Olho Cósmico depende de window/canvas e só existe nesta rota
// e no /manual/[id]; o dynamic garante um chunk separado.
const OlhoCosmico = dynamic(() => import('@/app/components/olho/OlhoCosmico'), {
  ssr: false,
  loading: () => <div style={{ height: '100dvh', background: '#000' }} />,
});

export default function CeuClient() {
  const router = useRouter();

  function abrirMapa(dados) {
    salvarCeuDados(dados);
    salvarSeForMeu(dados);
    try { window.gtag?.('event', 'ceu_cta', { event_category: 'ceu' }); } catch {}
    router.push('/');
  }

  return (
    <main style={{ background: '#000', minHeight: '100dvh' }}>
      <SiteNav active="ceu" sticky={false} transparente />
      <OlhoCosmico mode="publico" onCta={abrirMapa} />
    </main>
  );
}
