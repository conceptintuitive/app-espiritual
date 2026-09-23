import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/tiktokOAuth";

export const runtime = "nodejs";

// Renovação automática do access_token do TikTok. getValidAccessToken() já
// renova sozinho sempre que alguém chama (qualquer código que precise falar
// com a API do TikTok em nome da conta conectada) — esta rota existe pra
// garantir que a renovação aconteça mesmo em período sem nenhuma chamada,
// evitando que o refresh_token (que também expira, só que bem mais devagar)
// fique tempo demais sem uso.
//
// Mesmo padrão de proteção do /api/cron/lembretes: chamada por um cron
// externo (ex: cron-job.org, já que o plano Vercel Hobby não permite cron
// nativo com intervalo menor que 1x/dia), autenticado com CRON_SECRET.
export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization") || "";
    const providedSecret = searchParams.get("secret") || authHeader.replace(/^Bearer\s+/i, "");

    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const accessToken = await getValidAccessToken();
    return NextResponse.json({ success: true, renovado: true, access_token_preview: `${accessToken.slice(0, 6)}…` });
  } catch (err) {
    console.error("❌ Erro ao renovar token do TikTok:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
