// lib/tiktokContentPosting.js
// TikTok Content Posting API (Direct Post, método FILE_UPLOAD) — publica um
// vídeo já pronto (vindo do Creatomate) na conta TikTok conectada via OAuth
// (lib/tiktokOAuth.js). Usado por app/api/tiktok/publish/route.js.
//
// Referência: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
// (endpoints e regras de chunk podem mudar de versão — confira a doc oficial
// se algo começar a falhar com erro de validação do TikTok).

export const TIKTOK_CREATOR_INFO_URL = "https://open.tiktokapis.com/v2/post/publish/creator_info/query/";
export const TIKTOK_POST_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/";
export const TIKTOK_POST_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

// Limite defensivo pra não estourar a memória da function na Vercel baixando
// um vídeo gigante sem querer. Ajuste se os vídeos do Creatomate forem
// maiores que isso rotineiramente (e reveja o maxDuration da rota também).
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

// Regras de chunk do FILE_UPLOAD: um chunk só (até 64MB) cobre a grande
// maioria dos vídeos curtos de rede social; acima disso, divide em
// pedaços de 64MB (o TikTok exige mínimo de 5MB por chunk, exceto o
// último/único chunk).
const MAX_CHUNK_SIZE = 64 * 1024 * 1024; // 64MB

function computeChunks(videoSizeBytes) {
  if (videoSizeBytes <= MAX_CHUNK_SIZE) {
    return { chunkSize: videoSizeBytes, totalChunkCount: 1 };
  }
  const chunkSize = MAX_CHUNK_SIZE;
  const totalChunkCount = Math.ceil(videoSizeBytes / chunkSize);
  return { chunkSize, totalChunkCount };
}

async function tiktokJsonRequest(url, accessToken, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const errorCode = json?.error?.code;
  if (!res.ok || (errorCode && errorCode !== "ok")) {
    const detail = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(`${detail} (log_id: ${json?.error?.log_id || "n/a"})`);
  }
  return json.data;
}

// Baixa o MP4 do Creatomate pro servidor (buffer em memória). Só o servidor
// vê essa URL e esse conteúdo — nada disso passa pelo frontend.
export async function downloadVideo(videoUrl) {
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Falha ao baixar o vídeo (${videoUrl}): HTTP ${res.status}`);

  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength && contentLength > MAX_VIDEO_BYTES) {
    throw new Error(
      `Vídeo tem ${(contentLength / 1024 / 1024).toFixed(1)}MB, acima do limite de ${MAX_VIDEO_BYTES / 1024 / 1024}MB configurado em lib/tiktokContentPosting.js`
    );
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_VIDEO_BYTES) {
    throw new Error(`Vídeo baixado tem ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB, acima do limite configurado`);
  }
  return buffer;
}

// Consulta obrigatória antes de iniciar um post — devolve, entre outras
// coisas, privacy_level_options: as opções de privacidade que essa conta +
// esse app têm permissão de usar. Apps ainda não auditados pelo TikTok
// costumam só ter SELF_ONLY disponível (o vídeo vai pro rascunho/inbox da
// conta, não publica direto pro público).
export async function queryCreatorInfo(accessToken) {
  return tiktokJsonRequest(TIKTOK_CREATOR_INFO_URL, accessToken, {});
}

// Inicializa o Direct Post via FILE_UPLOAD. Devolve publish_id (identificador
// da publicação, usado depois pra checar status) e upload_url (URL
// pré-assinada pra onde o binário do vídeo deve ser enviado via PUT).
export async function initDirectPost({ accessToken, videoSizeBytes, caption, privacyLevel }) {
  const { chunkSize, totalChunkCount } = computeChunks(videoSizeBytes);

  const data = await tiktokJsonRequest(TIKTOK_POST_INIT_URL, accessToken, {
    post_info: {
      title: caption || "",
      privacy_level: privacyLevel,
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000,
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: videoSizeBytes,
      chunk_size: chunkSize,
      total_chunk_count: totalChunkCount,
    },
  });

  return { publish_id: data.publish_id, upload_url: data.upload_url };
}

// Envia o vídeo (buffer já baixado) pro upload_url devolvido pelo init,
// em um ou mais pedaços conforme o tamanho — a URL já é assinada/temporária,
// não precisa (nem aceita) o Authorization: Bearer nessa chamada.
export async function uploadVideoInChunks({ uploadUrl, buffer }) {
  const totalSize = buffer.byteLength;
  const { chunkSize, totalChunkCount } = computeChunks(totalSize);

  for (let i = 0; i < totalChunkCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalSize) - 1;
    const chunk = buffer.slice(start, end + 1);

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      },
      body: chunk,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Falha no upload do vídeo (chunk ${i + 1}/${totalChunkCount}): HTTP ${res.status} ${text}`.trim());
    }
  }
}

// Consulta o status de uma publicação em andamento. Logo depois do upload,
// quase sempre ainda está processando (PROCESSING_DOWNLOAD/PROCESSING_UPLOAD)
// — pode ser preciso chamar de novo mais tarde pra pegar o resultado final
// (PUBLISH_COMPLETE, FAILED, ou SEND_TO_USER_INBOX se o app ainda não foi
// auditado pelo TikTok pra publicar direto).
export async function fetchPublishStatus({ accessToken, publishId }) {
  return tiktokJsonRequest(TIKTOK_POST_STATUS_URL, accessToken, { publish_id: publishId });
}
