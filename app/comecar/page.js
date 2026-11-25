// /comecar — página do link da bio (/ig e /tt redirecionam pra cá com a UTM).
// Continua a conversa do post: o Reel interativo do dia (as 3 cartas, os
// números, as 8 práticas), a frase ou o narrado, pra pessoa interagir aqui
// sem precisar comentar, e UM botão: "Fazer meu mapa grátis" (o quiz já vem
// com o Seu Dia marcado = 7 dias grátis por e-mail). Sem menu de propósito.
// Server Component com ISR de 10 min: lê no banco o que saiu (social_posts,
// roteiro do narrado) e manda pro navegador só os textos dos posts da página
// (lib/comecar.js). Sem banco, usa o rodízio. Fora do Google (muda todo dia).

import { createClient } from '@supabase/supabase-js';
import { ARCANOS_MAIORES } from '@/lib/tarot';
import { REFLEXAO_ARCANOS } from '@/lib/tarotReflexao';
import { TEMAS as TEMAS_SEU_DIA } from '@/lib/seuDiaTextos';
import { NUMERO_PROFUNDO } from '@/lib/manualgenerator';
import { fraseDoDia, creditoDaFrase } from '@/lib/frases';
import { luaDoDia, chaveLigada } from '@/lib/social';
import { postsDaEntrada, conteudoDoBloco, utmDoBloco, linhaDoDia, LINHA_TESTE } from '@/lib/comecar';
import EntradaClient from './EntradaClient';
import b from '@/app/blog/blog.module.css';
import c from './comecar.module.css';

export const revalidate = 600;

export const metadata = {
  title: 'Comece por aqui | Intuitive Concept',
  description: 'O post de hoje continua aqui. E o seu mapa é grátis.',
  robots: { index: false, follow: false },
};

/** Dia e hora agora em Brasília (UTC−3, sem horário de verão). */
function agoraBrasilia() {
  const d = new Date(Date.now() - 3 * 3600000);
  return { hoje: d.toISOString().slice(0, 10), hora: d.getUTCHours() };
}

const somarDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/** O que o banco diz que saiu (Reels dos últimos 7 dias + roteiros do narrado). Sem banco: null. */
async function doBanco(hoje) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { publicados: null, roteiros: {} };
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await sb.from('social_posts').select('data, formato')
      .eq('rede', 'instagram').eq('tipo', 'reels').eq('status', 'ok').gte('data', somarDias(hoje, -6));
    if (error) return { publicados: null, roteiros: {} };
    const publicados = (data || []).filter((p) => p.formato);
    const roteiros = {};
    const narrados = publicados.filter((p) => p.formato === 'narrado').map((p) => p.data);
    if (narrados.length) {
      const { data: rs } = await sb.from('social_reels_narrados').select('data, roteiro').in('data', narrados);
      for (const r of rs || []) if (r.roteiro) roteiros[r.data] = r.roteiro;
    }
    return { publicados, roteiros };
  } catch {
    return { publicados: null, roteiros: {} };
  }
}

export default async function ComecarPage() {
  const { hoje, hora } = agoraBrasilia();
  const { publicados, roteiros } = await doBanco(hoje);
  const fontes = {
    arcanos: ARCANOS_MAIORES, reflexao: REFLEXAO_ARCANOS, temasSeuDia: TEMAS_SEU_DIA, numeroProfundo: NUMERO_PROFUNDO,
    fraseDoDia: (d) => fraseDoDia(d), creditoDaFrase, roteiros,
  };
  const posts = postsDaEntrada({
    hoje, hora, publicados, fraseLigada: chaveLigada(process.env.SOCIAL_FRASE_DO_DIA), comRoteiro: new Set(Object.keys(roteiros)),
  })
    .map((p) => ({ ...p, utm: utmDoBloco(p), conteudo: conteudoDoBloco(p, fontes) }))
    .filter((p) => p.conteudo);

  return (
    <div className={`${b.blog} ${c.pagina}`}>
      <div className={c.ceu} aria-hidden="true">
        <picture>
          <source media="(min-width: 700px)" srcSet="/olho/e4w.webp" />
          <img src="/olho/e4.webp" alt="" fetchPriority="high" loading="eager" decoding="async" />
        </picture>
      </div>
      <header className={c.marca}>Intuitive Concept</header>
      <main className={c.coluna}>
        <p className={c.dia}>{linhaDoDia(hoje, luaDoDia(hoje))}</p>
        <EntradaClient posts={posts} linhaTeste={LINHA_TESTE} />
      </main>
    </div>
  );
}
