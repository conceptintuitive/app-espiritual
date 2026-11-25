// /social/reels/<AAAA-MM-DD>?i=&v=&t=[&n=1]  — a animação do Reels do dia.
// O GitHub Actions (scripts/reels/gerar.mjs) abre esta página com &captura=1 e
// filma quadro a quadro (window.__quadro(t)); sem &captura, ela toca em loop,
// pra você assistir no navegador (link na prévia). A URL é assinada com o
// CRON_SECRET (lib/social.js); sem a assinatura certa, 404.
//   sem n: o card de 9s (céu + textos r1–r3, ReelsAnimacao)
//   n=1:   o Reels NARRADO (céu + legenda palavra por palavra, ReelsNarrado).
//          Na captura, o workflow entrega a narração por window.__carregar;
//          pra assistir, a página lê a narração guardada (migração 0028) e
//          toca o MP3 junto.
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { conferirAssinatura, dataValida, caminhoImagem } from '@/lib/social';
import ReelsAnimacao from './ReelsAnimacao';
import ReelsNarrado from './ReelsNarrado';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reels do dia', robots: { index: false, follow: false } };

async function narracaoGuardada(data) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data: row } = await sb.from('social_reels_narrados').select('palavras, duracao, audio_caminho').eq('data', data).maybeSingle();
    if (!row?.palavras?.length || !row.audio_caminho) return null;
    const { data: pub } = sb.storage.from(process.env.SOCIAL_REELS_BUCKET || 'reels').getPublicUrl(row.audio_caminho);
    return { palavras: row.palavras, duracao: Number(row.duracao), audio: pub?.publicUrl || null };
  } catch {
    return null;
  }
}

export default async function Pagina({ params, searchParams }) {
  const { data } = await params;
  const sp = (await searchParams) || {};
  const indice = /^\d{1,6}$/.test(sp.i || '') ? Number(sp.i) : null;
  const v = /^[0-9a-f]{0,16}$/.test(sp.v || '') ? sp.v || '' : null;
  const narrado = sp.n === '1';
  const segredo = process.env.CRON_SECRET;
  const formato = narrado ? 'reels-narrado' : 'reels';
  if (!dataValida(data) || v == null || !conferirAssinatura({ data, formato, indice, v, t: sp.t }, segredo)) notFound();

  const img = (f) => caminhoImagem({ data, formato: f, indice, v }, segredo);
  const captura = sp.captura === '1';
  if (narrado) return <ReelsNarrado ceu={img('ceu')} narracao={captura ? null : await narracaoGuardada(data)} captura={captura} />;
  return <ReelsAnimacao ceu={img('ceu')} camadas={['r1', 'r2', 'r3'].map((id) => ({ id, src: img(id) }))} captura={captura} />;
}
