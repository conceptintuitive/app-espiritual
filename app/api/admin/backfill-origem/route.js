import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isTestEmail } from "@/lib/testEmails";

export const runtime = "nodejs";

// Rota TEMPORÁRIA — mesma lógica de scripts/backfill-origem-mp.mjs, exposta
// como rota porque o projeto não está rodando local. Remover depois do apply
// (ver CLAUDE.md / PR que introduziu essa rota).
//
//   GET /api/admin/backfill-origem?secret=...            → dry-run
//   GET /api/admin/backfill-origem?secret=...&apply=1     → aplica de verdade
//
// Protegida por CRON_SECRET (já existe na Vercel, reaproveitada aqui — não é
// um cron, mas é o mesmo tipo de acesso: só quem tem o secret).

function maskEmail(email) {
  if (!email) return "(sem email)";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visivel = local.slice(0, 2);
  return `${visivel}***@${domain}`;
}

async function fetchAll(query) {
  const pageSize = 500;
  let from = 0;
  let all = [];
  for (;;) {
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    all = all.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const apply = searchParams.get("apply") === "1";

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const resultado = { apply, passo1_emails_teste: [], passo2_api_mp: [] };

  try {
    // ── Passo 1: e-mails de teste → origem = 'teste' (pago ou não) ──────────
    if (!process.env.TEST_EMAILS) {
      resultado.passo1_aviso = "TEST_EMAILS não definido — passo pulado.";
    } else {
      const candidatos = await fetchAll(
        supabase.from("analises").select("id, email, origem, payment_status").not("email", "is", null)
      );
      const paraTeste = candidatos.filter((row) => isTestEmail(row.email) && row.origem !== "teste");

      resultado.passo1_emails_teste = paraTeste.map((row) => ({
        id: row.id,
        email: maskEmail(row.email),
        origem_atual: row.origem ?? null,
        origem_nova: "teste",
      }));

      if (apply && paraTeste.length) {
        const { error } = await supabase
          .from("analises")
          .update({ origem: "teste" })
          .in("id", paraTeste.map((r) => r.id));
        if (error) throw new Error(`Falha ao aplicar passo 1: ${error.message}`);
      }
    }

    // ── Passo 2: ambíguos do MP (paid_at null + mp_payment_id preenchido) ───
    const ambiguos = await fetchAll(
      supabase
        .from("analises")
        .select("id, email, mp_payment_id, origem, payment_status, paid_at")
        .eq("payment_status", "paid")
        .is("paid_at", null)
        .not("mp_payment_id", "is", null)
        .is("origem", null)
    );

    const planos = [];
    for (const row of ambiguos) {
      try {
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${row.mp_payment_id}`, {
          headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        });
        if (!res.ok) {
          resultado.passo2_api_mp.push({
            id: row.id,
            email: maskEmail(row.email),
            status_mp: `erro HTTP ${res.status}`,
            origem_nova: null,
            revisar_manualmente: true,
          });
          continue;
        }
        const payment = await res.json();
        if (payment.status === "approved") {
          const update = {
            origem: "venda",
            paid_at: payment.date_approved,
            valor_pago: payment.transaction_amount ?? null,
          };
          planos.push({ id: row.id, update });
          resultado.passo2_api_mp.push({
            id: row.id,
            email: maskEmail(row.email),
            status_mp: payment.status,
            origem_nova: "venda",
            paid_at: payment.date_approved,
            valor_pago: payment.transaction_amount ?? null,
          });
        } else {
          planos.push({ id: row.id, update: { origem: "cortesia" } });
          resultado.passo2_api_mp.push({
            id: row.id,
            email: maskEmail(row.email),
            status_mp: payment.status,
            origem_nova: "cortesia",
          });
        }
      } catch (err) {
        resultado.passo2_api_mp.push({
          id: row.id,
          email: maskEmail(row.email),
          status_mp: `erro: ${err.message}`,
          origem_nova: null,
          revisar_manualmente: true,
        });
      }
    }

    if (apply && planos.length) {
      for (const plano of planos) {
        const { error } = await supabase.from("analises").update(plano.update).eq("id", plano.id);
        if (error) {
          resultado.passo2_erros = resultado.passo2_erros || [];
          resultado.passo2_erros.push({ id: plano.id, erro: error.message });
        }
      }
    }

    resultado.resumo = {
      passo1_total: resultado.passo1_emails_teste.length,
      passo2_total: resultado.passo2_api_mp.length,
      aplicado: apply,
    };

    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
