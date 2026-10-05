import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidAccessToken, getStoredTokens } from "@/lib/tiktokOAuth";
import {
  downloadVideo,
  initInboxUpload,
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

// Limite do TikTok pra legenda. No modo inbox a legenda NÃO vai pro TikTok
// (a API não aceita) — fica salva em tiktok_publishes e volta na resposta,
// pro Make poder te mandar junto com o aviso de rascunho.
const MAX_CAPTION = 2200;

// Escopo exigido pelo upload pro inbox.
const ESCOPO_INBOX = "video.upload";

// Procura uma publicação anterior do mesmo vídeo que não tenha falhado.
// Evita post duplicado quando o Make reexecuta o cenário (retry, timeout,
// "Run once" manual) com o mesmo video_url.
async function buscarPublicacaoExistente(supabase, videoUrl) {
  const { data, error } = await supabase
    .from("tiktok_publishes")
    .select("publish_id, status")
    .eq("video_url", videoUrl)
    .not("status", "in", "(FAILED,UPLOAD_FAILED)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("⚠️ Não foi possível checar duplicidade em tiktok_publishes:", error.message);
    return null;
  }
  return data;
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
// válido (renova sozinho se preciso) e envia o vídeo pros RASCUNHOS da
// conta (Upload to inbox). O TikTok notifica a conta; publicar é manual.
// Devolve o publish_id pra acompanhamento.
export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const videoUrl = body?.video_url;
  const caption = typeof body?.caption === "string" ? body.caption.slice(0, MAX_CAPTION) : "";

  if (!videoUrl) {
    return NextResponse.json({ error: "video_url é obrigatório" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 0) mesmo vídeo já enviado antes? devolve a publicação existente em vez
  // de postar de novo. { "force": true } no body pula essa checagem.
  if (body?.force !== true) {
    const existente = await buscarPublicacaoExistente(supabase, videoUrl);
    if (existente) {
      console.log("↩️ video_url já publicado, não reenviando. publish_id:", existente.publish_id);
      return NextResponse.json({
        success: true,
        duplicado: true,
        publish_id: existente.publish_id,
        status: existente.status,
      });
    }
  }

  try {
    // 1) a conta conectada tem o escopo do inbox? Token gerado antes da troca
    // de video.publish → video.upload não tem, e o TikTok recusaria só
    // depois do download. Falha cedo, com a instrução de como resolver.
    const stored = await getStoredTokens();
    const escopos = String(stored?.scope || "").split(/[,\s]+/);
    if (stored?.scope && !escopos.includes(ESCOPO_INBOX)) {
      throw new Error(
        `O token salvo não tem o escopo ${ESCOPO_INBOX} (tem: ${stored.scope}). Reconecte a conta em /api/tiktok/connect.`
      );
    }

    // token válido (getValidAccessToken já renova sozinho se preciso)
    const accessToken = await getValidAccessToken();

    // 2) baixa o MP4 do Creatomate pro servidor
    const videoBuffer = await downloadVideo(videoUrl);

    // 3) inicializa o upload pro inbox — devolve publish_id + upload_url
    const { publish_id, upload_url } = await initInboxUpload({
      accessToken,
      videoSizeBytes: videoBuffer.byteLength,
    });

    // 4) registra ANTES do upload: se o Make reenviar enquanto o upload
    // ainda está rodando, a checagem de duplicidade (passo 0) já enxerga.
    await registrarPublicacao(supabase, {
      publish_id,
      video_url: videoUrl,
      caption,
      status: "UPLOADING",
      updated_at: new Date().toISOString(),
    });

    // 5) upload binário do vídeo. Se falhar, marca UPLOAD_FAILED pra que uma
    // nova tentativa com o mesmo video_url seja permitida.
    try {
      await uploadVideoInChunks({ uploadUrl: upload_url, buffer: videoBuffer });
    } catch (uploadErr) {
      await atualizarStatus(supabase, publish_id, { status: "UPLOAD_FAILED", erro: uploadErr.message });
      throw uploadErr;
    }
    await atualizarStatus(supabase, publish_id, { status: "PROCESSING" });

    // 6) primeira checagem de status — logo após o upload, o TikTok quase
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

    console.log("✅ Vídeo enviado pros rascunhos do TikTok, publish_id:", publish_id);

    return NextResponse.json({
      success: true,
      modo: "inbox",
      publish_id,
      status: statusData?.status || "PROCESSING",
      caption,
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
