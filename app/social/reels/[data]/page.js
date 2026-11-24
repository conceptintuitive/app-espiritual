// /social/reels/<AAAA-MM-DD>?i=&v=&t=  — a animação do Reels do dia.
// O GitHub Actions (scripts/reels/gerar.mjs) abre esta página com &captura=1 e
// filma quadro a quadro (window.__quadro(t)); sem &captura, ela toca em loop,
// pra você assistir no navegador (link na prévia). As imagens são as mesmas
// artes assinadas do dia (céu + textos r1–r3). A URL é assinada com o
// CRON_SECRET (lib/social.js); sem a assinatura certa, 404.
import { notFound } from 'next/navigation';
import { conferirAssinatura, dataValida, caminhoImagem } from '@/lib/social';
import ReelsAnimacao from './ReelsAnimacao';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reels do dia', robots: { index: false, follow: false } };

export default async function Pagina({ params, searchParams }) {
  const { data } = await params;
  const sp = (await searchParams) || {};
  const indice = /^\d{1,6}$/.test(sp.i || '') ? Number(sp.i) : null;
  const v = /^[0-9a-f]{0,16}$/.test(sp.v || '') ? sp.v || '' : null;
  const segredo = process.env.CRON_SECRET;
  if (!dataValida(data) || v == null || !conferirAssinatura({ data, formato: 'reels', indice, v, t: sp.t }, segredo)) notFound();

  const img = (formato) => caminhoImagem({ data, formato, indice, v }, segredo);
  return <ReelsAnimacao ceu={img('ceu')} camadas={['r1', 'r2', 'r3'].map((id) => ({ id, src: img(id) }))} captura={sp.captura === '1'} />;
}
