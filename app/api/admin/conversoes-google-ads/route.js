// GET /api/admin/conversoes-google-ads?secret=CRON_SECRET[&nome=Compra%20Manual][&dias=90]
//
// CSV de "conversões de cliques" pro Google Ads (upload offline / upload
// programado por HTTPS): compras pagas do Manual nos últimos `dias` (padrão
// 90, a janela de clique) que têm gclid e aceite de cookies na análise
// (coluna `atribuicao`, migração 0023 — ver lib/atribuicao.js).
//
// Serve de caminho paralelo ao purchase do GA4: atribui pelo gclid direto,
// mesmo quando o GA4 não consegue juntar a compra à sessão do anúncio.
// `nome` = o nome EXATO da ação de conversão do tipo "Importação de cliques"
// criada no Google Ads. Se ela e a importação do GA4 contarem a mesma compra,
// deixe só uma como "principal" (senão a compra conta 2x nos lances).
//
// Protegida por CRON_SECRET, como as outras rotas internas.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { csvConversoesGoogleAds } from "@/lib/atribuicao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") || (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "ENV do Supabase não configurada" }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const nome = (url.searchParams.get("nome") || "Compra Manual").slice(0, 100);
  const dias = Math.min(90, Math.max(1, Number(url.searchParams.get("dias")) || 90));
  const desde = new Date(Date.now() - dias * 86400000).toISOString();

  const { data, error } = await supabase
    .from("analises")
    .select("paid_at, valor_pago, atribuicao")
    .eq("payment_status", "paid")
    .eq("origem", "venda")
    .gte("paid_at", desde)
    .not("atribuicao->>gclid", "is", null)
    .order("paid_at", { ascending: true })
    .limit(5000);

  if (error) {
    // Sem a migração 0023 a coluna não existe: devolve só o cabeçalho.
    console.error("[conversoes-google-ads]", error.message);
    return new NextResponse(csvConversoesGoogleAds([], nome), { headers: { "Content-Type": "text/csv; charset=utf-8" } });
  }

  return new NextResponse(csvConversoesGoogleAds(data, nome), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="conversoes-google-ads.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
