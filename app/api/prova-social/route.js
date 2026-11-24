import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resumoDasRespostas, depoimentosPublicaveis } from '@/lib/provaSocial';
import { textoProvaSocial } from '@/lib/resultadoManual';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/prova-social → { texto, pessoas, depoimentos } pro /resultado.
// texto = "X de cada 10 pessoas disseram que o Manual bate com elas" (só com
// 10+ pessoas, arredondado pra baixo; regras em lib/provaSocial.js), a
// partir do manual_feedback (0012) e do e-mail de avaliação (0027). Sem nada
// disso, { texto: null, depoimentos: [] }. Cache de 1h na CDN da Vercel.
const VAZIO = { texto: null, pessoas: 0, depoimentos: [] };
const CACHE = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' };

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json(VAZIO);
  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const [secoesR, avaliacoesR, testesR] = await Promise.all([
      sb.from('manual_feedback').select('manual_id, resposta').limit(20000),
      sb.from('manual_avaliacoes').select('analise_id, resposta, frase, autoriza_publicar, oculto, atualizado_em').limit(20000),
      sb.from('analises').select('id').eq('origem', 'teste').limit(5000),
    ]);
    const secoes = secoesR.error ? [] : secoesR.data || [];
    const avaliacoes = avaliacoesR.error ? [] : avaliacoesR.data || []; // sem a 0027: só as seções
    const excluir = new Set((testesR.data || []).map((x) => x.id));
    const resumo = resumoDasRespostas({ secoes, avaliacoes, excluir });

    // Depoimentos: nome e signo lidos da análise agora (a avaliação não guarda).
    let depoimentos = [];
    const autorizadas = avaliacoes.filter((a) => a.autoriza_publicar && !a.oculto && a.resposta === 'bate_muito' && !excluir.has(a.analise_id));
    if (autorizadas.length) {
      const { data: pessoas } = await sb.from('analises').select('id, nome, signo').in('id', autorizadas.slice(0, 200).map((a) => a.analise_id));
      const porId = new Map((pessoas || []).map((p) => [p.id, p]));
      depoimentos = depoimentosPublicaveis(autorizadas.map((a) => ({
        ...a, nome_publico: porId.get(a.analise_id)?.nome, signo: porId.get(a.analise_id)?.signo,
      })));
    }

    return NextResponse.json({ texto: textoProvaSocial(resumo), pessoas: resumo.pessoas, depoimentos }, { headers: CACHE });
  } catch (e) {
    console.error('[prova-social]', e?.message);
    return NextResponse.json(VAZIO);
  }
}
