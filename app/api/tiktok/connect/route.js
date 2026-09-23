import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildAuthorizeUrl } from "@/lib/tiktokOAuth";

export const runtime = "nodejs";

// Inicia o OAuth do TikTok Login Kit: gera um state anti-CSRF, guarda em
// cookie httpOnly (só o servidor lê) e redireciona pro TikTok. O
// client_key nunca é exposto via variável NEXT_PUBLIC_ — só aparece na URL
// de redirecionamento pro próprio TikTok, o que é esperado (é um
// identificador público do app, não um segredo).
export async function GET() {
  let authorizeUrl;
  try {
    const state = randomBytes(32).toString("hex");
    authorizeUrl = buildAuthorizeUrl(state);

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set("tiktok_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/tiktok",
      maxAge: 600, // 10 minutos — tempo de sobra pra completar o login no TikTok
    });
    return response;
  } catch (err) {
    console.error("❌ Erro ao iniciar OAuth do TikTok:", err.message);
    return NextResponse.json({ error: "Erro ao iniciar conexão com o TikTok", details: err.message }, { status: 500 });
  }
}
