import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidAccessToken } from "@/lib/tiktokOAuth";
import {
  downloadVideo,
  queryCreatorInfo,
  initDirectPost,
  uploadVideoInChunks,
  fetchPublishStatus,
} from "@/lib/tiktokContentPosting";

export const runtime = "nodejs";
// Baixar o MP4 do Creatomate + subir pro TikTok pode levar mais que os 10s
// padrão da Vercel — dá folga. Se vídeos maiores começarem a estourar esse
// tempo, é sinal de que precisa de plano com maxDuration maior.
export const maxDuration = 60;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Chave secreta dedicada pro Make chamar essa rota — separada do CRON_SECRET
// de propósito, pra poder revogar/trocar uma sem afetar a outra.
function isAuthorized(request) {
  const secret = process.env.TIKTOK_PUBLISH_API_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization") || "";
  const provided = authHeader.replace(/^Bearer\s+/i, "");
  return provided === secret;
}

async function registrarPublicacao(supabase, row) {
  const { error } = await supabase
    .from("tiktok_publishes")
    .upsert(row, { onConflict: "publish_id" });
  if (error) console.error("⚠️ Não foi possível salvar tiktok_publishes (tabela existe? migration 0011 rodou?):", error.message);
}

// Atualiza só o status de uma linha já existente — nunca via upsert aqui,
// pra não arriscar sobrescrever video_url/caption com null quando a chamada
// só tem o publish_id (caso do GET de status).
async function atualizarStatus(supabase, publishId, statusData) {
  const { error } = await supabase
    .from("tiktok_publishes")
    .update({ status: statusData.status, status_detail: statusData, updated_at: new Date().toISOString() })
    .eq("publish_id", publishId);
  if (error) console.error("⚠️ Não foi possível atualizar status em tiktok_publishes:", error.message);
}

// POST /api/tiktok/publish — chamada pelo Make depois que o Creatomate
// termina de renderizar o vídeo. Baixa o MP4, garante um access_token
// válido (renova sozinho se preciso), inicializa e sobe o Direct Post, e
// devolve o publish_id pra acompanhamento.
export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const videoUrl = body?.video_url;
  const caption = typeof body?.caption === "string" ? body.caption : "";

  if (!videoUrl) {
    return NextResponse.json({ error: "video_url é obrigatório" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    // 1) token válido (getValidAccessToken já renova sozinho se preciso)
    const accessToken = await getValidAccessToken();

    // 2) baixa o MP4 do Creatomate pro servidor
    const videoBuffer = await downloadVideo(videoUrl);

    // 3) consulta obrigatória antes de postar — também dá os níveis de
    // privacidade que essa conta/app têm liberado
    const creatorInfo = await queryCreatorInfo(accessToken);
    const opcoesPrivacidade = creatorInfo?.privacy_level_options || [];
    const privacyLevel =
      body?.privacy_level && opcoesPrivacidade.includes(body.privacy_level)
        ? body.privacy_level
        : opcoesPrivacidade[0];

    if (!privacyLevel) {
      throw new Error("O TikTok não retornou nenhuma opção de privacy_level válida pra essa conta/app (creator_info.privacy_level_options veio vazio)");
    }

    // 4) inicializa o Direct Post — devolve publish_id + upload_url
    const { publish_id, upload_url } = await initDirectPost({
      accessToken,
      videoSizeBytes: videoBuffer.byteLength,
      caption,
      privacyLevel,
    });

    // 5) upload binário do vídeo
    await uploadVideoInChunks({ uploadUrl: upload_url, buffer: videoBuffer });

    // 6) salva o publish_id assim que o upload for aceito
    await registrarPublicacao(supabase, {
      publish_id,
      video_url: videoUrl,
      caption,
      status: "PROCESSING",
      updated_at: new Date().toISOString(),
    });

    // 7) primeira checagem de status — logo após o upload, o TikTok quase
    // sempre ainda está processando; o Make pode consultar de novo depois
    // via GET /api/tiktok/publish?publish_id=... pro resultado final.
    let statusData = null;
    try {
      statusData = await fetchPublishStatus({ accessToken, publishId: publish_id });
      await atualizarStatus(supabase, publish_id, statusData);
    } catch (statusErr) {
      // O upload já foi aceito pelo TikTok nesse ponto — uma falha só na
      // checagem de status não deve derrubar a resposta de sucesso.
      console.error("⚠️ Publish aceito, mas falha ao consultar status inicial:", statusErr.message);
    }

    console.log("✅ Vídeo enviado ao TikTok, publish_id:", publish_id);

    return NextResponse.json({
      success: true,
      publish_id,
      status: statusData?.status || "PROCESSING",
    });
  } catch (err) {
    console.error("❌ Erro ao publicar vídeo no TikTok:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/tiktok/publish?publish_id=xxx — consulta o status mais recente
// de uma publicação já iniciada (a publicação em si é assíncrona do lado
// do TikTok, então o status do POST original quase nunca é o final).
export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const publishId = searchParams.get("publish_id");
  if (!publishId) {
    return NextResponse.json({ error: "publish_id é obrigatório" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const accessToken = await getValidAccessToken();
    const statusData = await fetchPublishStatus({ accessToken, publishId });

    await atualizarStatus(supabase, publishId, statusData);

    return NextResponse.json({ success: true, publish_id: publishId, status: statusData.status, detail: statusData });
  } catch (err) {
    console.error("❌ Erro ao consultar status de publicação no TikTok:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
