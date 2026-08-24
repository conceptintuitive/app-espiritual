import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function pagina(mensagem) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Descadastro</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0f0f14;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;">
  <div style="max-width:440px;text-align:center;background:#1a1a24;border-radius:18px;padding:36px 28px;">
    <p style="font-size:34px;margin:0 0 12px;">✋</p>
    <h1 style="font-size:20px;margin:0 0 10px;">${mensagem}</h1>
    <p style="color:#999;font-size:14px;margin:0;">Se mudar de ideia, é só voltar ao site quando quiser.</p>
  </div>
</body>
</html>`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response(pagina("Link inválido."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    await supabase.from("analises").update({ unsubscribed: true }).eq("id", id);
  } catch (error) {
    console.error("❌ Erro ao descadastrar:", error);
  }

  return new Response(pagina("Você não vai mais receber nossos emails."), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
