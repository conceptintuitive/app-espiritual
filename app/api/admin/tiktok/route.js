// API da tela /admin/tiktok (Direct Post com consentimento por post).
//   GET                      quem vai receber (creator_info) + os próximos 7 dias
//   GET ?status=<publish_id> status de um post já enviado
//   POST { data, acao: 'aprovar' | 'desfazer' | 'postar_agora', privacy_level, … }
// Sessão: cookie ic_admin (lib/adminSessao.js).
// 'aprovar' grava em social_conteudos.tiktok_aprovacao: o cron das 7h posta
// direto (se TIKTOK_DIRECT_POST=on) com exatamente essas escolhas.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { COOKIE_ADMIN, sessaoAdminValida, problemasDaAprovacao } from '@/lib/adminSessao';
import { hojeBrasilia, somarDias, montarLegenda, tituloCurto, TEMAS, chaveLigada } from '@/lib/social';
import { garantirConteudoDoDia, lerConteudo, urlsDoDia, reivindicar } from '@/lib/socialServidor';
import { getValidAccessToken } from '@/lib/tiktokOAuth';
import { consultarCreatorInfo, postarFotoDireto, fetchPublishStatus } from '@/lib/tiktokContentPosting';
import { getBaseUrl } from '@/lib/baseUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function supabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

async function autorizado() {
  const c = await cookies();
  return sessaoAdminValida(c.get(COOKIE_ADMIN)?.value);
}

async function criador() {
  try {
    const token = await getValidAccessToken();
    return { token, info: await consultarCreatorInfo(token) };
  } catch (err) {
    return { token: null, info: null, erro: err.message };
  }
}

export async function GET(request) {
  if (!(await autorizado())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const publishId = new URL(request.url).searchParams.get('status');
  if (publishId) {
    try {
      const token = await getValidAccessToken();
      return NextResponse.json(await fetchPublishStatus({ accessToken: token, publishId }));
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  }

  const sb = supabase();
  const hoje = hojeBrasilia();
  const segredo = process.env.CRON_SECRET;
  const dias = [];
  for (let k = 0; k < 7; k++) {
    const data = somarDias(hoje, k);
    const row = await lerConteudo(sb, data);
    if (!row) { dias.push({ data, pronto: false }); continue; }
    const urls = urlsDoDia(getBaseUrl(), segredo, row);
    const { data: postado } = await sb.from('social_posts').select('status, post_id').eq('data', data).eq('rede', 'tiktok').eq('tipo', 'feed').maybeSingle();
    dias.push({
      data, pronto: true, tema: TEMAS[row.tema]?.rotulo, item: row.item, imagens: urls.telas,
      titulo: tituloCurto(row.conteudo.legenda.gancho), descricao: montarLegenda(row.conteudo.legenda),
      aprovacao: row.tiktok_aprovacao || null, postado: postado || null,
    });
  }
  const c = await criador();
  return NextResponse.json({ criador: c.info, erroCriador: c.erro || null, directPostLigado: chaveLigada(process.env.TIKTOK_DIRECT_POST), dias });
}

export async function POST(request) {
  if (!(await autorizado())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const sb = supabase();
  const { data, acao } = body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '')) return NextResponse.json({ error: 'data inválida' }, { status: 400 });

  if (acao === 'desfazer') {
    await sb.from('social_conteudos').update({ tiktok_aprovacao: null }).eq('data', data);
    return NextResponse.json({ ok: true });
  }

  const c = await criador();
  if (!c.info) return NextResponse.json({ error: `Não consegui ler a conta do TikTok: ${c.erro}` }, { status: 502 });
  const aprovacao = {
    aprovado: true,
    privacy_level: body.privacy_level || null,
    disable_comment: body.permitir_comentarios !== true,
    auto_add_music: body.auto_add_music !== false,
    divulgacao: !!body.divulgacao,
    brand_organic_toggle: !!body.divulgacao && !!body.brand_organic_toggle,
    brand_content_toggle: !!body.divulgacao && !!body.brand_content_toggle,
    consentimento: body.consentimento === true,
    titulo: String(body.titulo || '').trim(),
    descricao: String(body.descricao || '').trim(),
    conta: c.info.creator_username || c.info.creator_nickname || null,
    aprovado_em: new Date().toISOString(),
  };
  const problemas = problemasDaAprovacao(aprovacao, c.info);
  if (problemas.length) return NextResponse.json({ error: problemas.join(' ') }, { status: 400 });

  const row = await garantirConteudoDoDia(sb, data);
  if (acao === 'aprovar') {
    await sb.from('social_conteudos').update({ tiktok_aprovacao: aprovacao }).eq('data', data);
    return NextResponse.json({ ok: true, aprovacao });
  }
  if (acao === 'postar_agora') {
    const linha = { data, rede: 'tiktok', tipo: 'feed', tema: row.tema, serie: row.serie, indice: row.indice, item: row.item };
    if (!(await reivindicar(sb, linha))) return NextResponse.json({ error: 'Esse dia já foi enviado pro TikTok.' }, { status: 409 });
    try {
      const urls = urlsDoDia(getBaseUrl(), process.env.CRON_SECRET, row);
      const { publish_id } = await postarFotoDireto({
        accessToken: c.token, imageUrls: urls.telas, titulo: aprovacao.titulo, descricao: aprovacao.descricao,
        privacyLevel: aprovacao.privacy_level, disableComment: aprovacao.disable_comment, autoAddMusic: aprovacao.auto_add_music,
        brandContent: aprovacao.brand_content_toggle, brandOrganic: aprovacao.brand_organic_toggle,
      });
      await sb.from('social_posts').update({ status: 'ok', post_id: publish_id, erro: null, updated_at: new Date().toISOString() }).eq('data', data).eq('rede', 'tiktok').eq('tipo', 'feed');
      await sb.from('social_conteudos').update({ tiktok_aprovacao: aprovacao }).eq('data', data);
      return NextResponse.json({ ok: true, publish_id });
    } catch (err) {
      await sb.from('social_posts').update({ status: 'erro', erro: err.message.slice(0, 800), updated_at: new Date().toISOString() }).eq('data', data).eq('rede', 'tiktok').eq('tipo', 'feed');
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  }
  return NextResponse.json({ error: 'ação inválida' }, { status: 400 });
}
