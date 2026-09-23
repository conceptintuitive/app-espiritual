import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { exchangeCodeForTokens, saveTokens } from "@/lib/tiktokOAuth";

export const runtime = "nodejs";

function safeCompare(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

// Limpa o cookie de state independente do resultado — ele é de uso único.
function clearStateCookie(response) {
  response.cookies.set("tiktok_oauth_state", "", { path: "/api/tiktok", maxAge: 0 });
  return response;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // 1) O próprio TikTok reportou erro (ex: usuário negou a permissão).
  if (error) {
    console.error("❌ TikTok OAuth retornou erro:", error, errorDescription);
    return clearStateCookie(
      NextResponse.json({ error, error_description: errorDescription || null }, { status: 400 })
    );
  }

  if (!code || !state) {
    return clearStateCookie(
      NextResponse.json({ error: "Parâmetros code/state ausentes no callback do TikTok" }, { status: 400 })
    );
  }

  // 2) Validação do state — proteção contra CSRF. Precisa bater com o valor
  // gravado em /api/tiktok/connect, no mesmo navegador.
  const savedState = request.cookies.get("tiktok_oauth_state")?.value;
  if (!safeCompare(state, savedState)) {
    console.error("❌ TikTok OAuth: state inválido ou expirado");
    return clearStateCookie(
      NextResponse.json({ error: "State inválido ou expirado — tente conectar novamente pelo /api/tiktok/connect" }, { status: 400 })
    );
  }

  // 3) Troca o code pelo access_token/refresh_token e salva no Supabase.
  try {
    const tokenData = await exchangeCodeForTokens(code);
    await saveTokens(tokenData);

    console.log("✅ Conta TikTok conectada com sucesso, open_id:", tokenData.open_id);

    return clearStateCookie(
      NextResponse.json({
        success: true,
        message: "Conta do TikTok conectada com sucesso.",
        open_id: tokenData.open_id,
        scope: tokenData.scope,
      })
    );
  } catch (err) {
    console.error("❌ Erro ao trocar code por token no TikTok:", err.message);
    return clearStateCookie(
      NextResponse.json({ error: "Erro ao concluir a conexão com o TikTok", details: err.message }, { status: 500 })
    );
  }
}
