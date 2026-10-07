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

async function consultarMP(mpPaymentId) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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
    // ── Candidatos a e-mail de teste (todos, pago ou não) ───────────────────
    let paraTeste = [];
    if (!process.env.TEST_EMAILS) {
      resultado.passo1_aviso = "TEST_EMAILS não definido — passo pulado.";
    } else {
      const candidatos = await fetchAll(
        supabase.from("analises").select("id, email, origem, payment_status").not("email", "is", null)
      );
      paraTeste = candidatos.filter((row) => isTestEmail(row.email) && row.origem !== "teste");
    }

    // ── Ambíguos do MP (paid_at null + mp_payment_id preenchido) ────────────
    // Separa e-mail de teste (passo 1, origem='teste') de venda/cortesia de
    // verdade (passo 2) — um registro de teste nunca deve sair como 'venda'.
    const ambiguos = await fetchAll(
      supabase
        .from("analises")
        .select("id, email, mp_payment_id, origem, payment_status, paid_at")
        .eq("payment_status", "paid")
        .is("paid_at", null)
        .not("mp_payment_id", "is", null)
        .is("origem", null)
    );
    const ambiguosTeste = ambiguos.filter((row) => isTestEmail(row.email));
    const ambiguosNormais = ambiguos.filter((row) => !isTestEmail(row.email));

    // ── Passo 1: e-mails de teste, enriquecidos com paid_at/valor_pago reais ─
    const enriquecimentoTeste = new Map();
    for (const row of ambiguosTeste) {
      try {
        const payment = await consultarMP(row.mp_payment_id);
        if (payment.status === "approved") {
          enriquecimentoTeste.set(row.id, {
            paid_at: payment.date_approved,
            valor_pago: payment.transaction_amount ?? null,
          });
        }
      } catch {
        // Sem paid_at/valor_pago real — fica só com origem='teste' mesmo.
      }
    }

    const planosTeste = paraTeste.map((row) => ({
      id: row.id,
      update: { origem: "teste", ...(enriquecimentoTeste.get(row.id) || {}) },
    }));

    resultado.passo1_emails_teste = planosTeste.map((plano) => {
      const row = paraTeste.find((r) => r.id === plano.id);
      return {
        id: plano.id,
        email: maskEmail(row?.email),
        origem_atual: row?.origem ?? null,
        origem_nova: "teste",
        ...(plano.update.paid_at ? { paid_at: plano.update.paid_at, valor_pago: plano.update.valor_pago } : {}),
      };
    });

    if (apply && planosTeste.length) {
      for (const plano of planosTeste) {
        const { error } = await supabase.from("analises").update(plano.update).eq("id", plano.id);
        if (error) throw new Error(`Falha ao aplicar passo 1 (${plano.id}): ${error.message}`);
      }
    }

    // ── Passo 2: ambíguos do MP, SEM e-mails de teste ───────────────────────
    const planosNormais = [];
    for (const row of ambiguosNormais) {
      try {
        const payment = await consultarMP(row.mp_payment_id);
        if (payment.status === "approved") {
          const update = {
            origem: "venda",
            paid_at: payment.date_approved,
            valor_pago: payment.transaction_amount ?? null,
          };
          planosNormais.push({ id: row.id, update });
          resultado.passo2_api_mp.push({
            id: row.id,
            email: maskEmail(row.email),
            status_mp: payment.status,
            origem_nova: "venda",
            paid_at: payment.date_approved,
            valor_pago: payment.transaction_amount ?? null,
          });
        } else {
          planosNormais.push({ id: row.id, update: { origem: "cortesia" } });
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

    if (apply && planosNormais.length) {
      for (const plano of planosNormais) {
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
