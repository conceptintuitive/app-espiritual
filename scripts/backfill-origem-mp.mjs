/**
 * Backfill de origem/paid_at/valor_pago pros registros que a migração
 * 0013_valor_pago_origem.sql não conseguiu resolver sozinha em SQL.
 *
 * Faz 2 passos, nessa ordem:
 *
 *   1) E-mails de teste (TEST_EMAILS no .env.local) → origem = 'teste',
 *      em QUALQUER registro com esse e-mail, pago ou não, e mesmo que já
 *      tenha origem definida (sobrescreve 'venda'/'cortesia' vindo da 0013).
 *
 *   2) Registros com payment_status='paid', sem paid_at e com mp_payment_id
 *      (ambíguos pra SQL — podem ser venda real do MP de antes da correção
 *      do webhook, que não gravava paid_at, ou marcação manual com um
 *      mp_payment_id copiado). Consulta a API do MP pra cada um:
 *        - payment.status === 'approved' → origem 'venda',
 *          paid_at = payment.date_approved, valor_pago = transaction_amount.
 *        - qualquer outro status → origem 'cortesia'.
 *      Pula (não decide) se a consulta falhar — fica pra revisão manual.
 *
 * Por padrão roda em modo DRY-RUN (só mostra o que faria). Pra aplicar de
 * verdade:
 *
 *   node scripts/backfill-origem-mp.mjs --apply
 *
 * Pré-requisitos no .env.local: NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, MP_ACCESS_TOKEN, TEST_EMAILS (opcional).
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const [k, ...rest] = line.split("=");
    if (k && rest.length) process.env[k.trim()] = rest.join("=").trim();
  }
} catch {
  console.error("⚠️  .env.local não encontrado — certifique-se de estar na raiz do projeto");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const { createClient } = await import("@supabase/supabase-js");
const { isTestEmail } = await import("../lib/testEmails.js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY faltando no .env.local");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

console.log(APPLY ? "🚨 Modo APPLY — vai escrever no banco.\n" : "🧪 Modo DRY-RUN — nada será escrito. Rode com --apply pra aplicar.\n");

// ── Paginação simples (Supabase limita 1000 linhas por padrão) ─────────────
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

// ─────────────────────────────────────────────────────────────────────────
// Passo 1: e-mails de teste
// ─────────────────────────────────────────────────────────────────────────
if (!process.env.TEST_EMAILS) {
  console.log("⚠️  TEST_EMAILS não definido no .env.local — pulando o passo de e-mails de teste.\n");
} else {
  const candidatos = await fetchAll(
    supabase.from("analises").select("id, email, origem, payment_status").not("email", "is", null)
  );
  const paraTeste = candidatos.filter((row) => isTestEmail(row.email) && row.origem !== "teste");

  console.log(`── Passo 1: e-mails de teste (${paraTeste.length} registro(s)) ──`);
  for (const row of paraTeste) {
    console.log(`  ${row.id} | ${row.email} | origem atual: ${row.origem ?? "(null)"} → teste`);
  }
  if (APPLY && paraTeste.length) {
    const { error } = await supabase
      .from("analises")
      .update({ origem: "teste" })
      .in("id", paraTeste.map((r) => r.id));
    if (error) {
      console.error("❌ Erro ao aplicar passo 1:", error.message);
      process.exit(1);
    }
    console.log(`✅ ${paraTeste.length} registro(s) marcado(s) como 'teste'.`);
  }
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// Passo 2: ambíguos do MP (paid_at null + mp_payment_id preenchido)
// ─────────────────────────────────────────────────────────────────────────
const ambiguos = await fetchAll(
  supabase
    .from("analises")
    .select("id, email, mp_payment_id, origem, payment_status, paid_at")
    .eq("payment_status", "paid")
    .is("paid_at", null)
    .not("mp_payment_id", "is", null)
    .is("origem", null)
);

console.log(`── Passo 2: consulta à API do MP (${ambiguos.length} registro(s) ambíguo(s)) ──`);

const planos = [];
for (const row of ambiguos) {
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${row.mp_payment_id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    if (!res.ok) {
      console.log(`  ⚠️  ${row.id} | mp_payment_id ${row.mp_payment_id} → HTTP ${res.status}, pulando (revisar manualmente)`);
      continue;
    }
    const payment = await res.json();
    if (payment.status === "approved") {
      planos.push({
        id: row.id,
        update: {
          origem: "venda",
          paid_at: payment.date_approved,
          valor_pago: payment.transaction_amount ?? null,
        },
      });
      console.log(`  ${row.id} | mp_payment_id ${row.mp_payment_id} | status MP: approved → venda (paid_at=${payment.date_approved}, valor_pago=${payment.transaction_amount})`);
    } else {
      planos.push({ id: row.id, update: { origem: "cortesia" } });
      console.log(`  ${row.id} | mp_payment_id ${row.mp_payment_id} | status MP: ${payment.status} → cortesia`);
    }
  } catch (err) {
    console.log(`  ⚠️  ${row.id} | mp_payment_id ${row.mp_payment_id} → erro na consulta (${err.message}), pulando (revisar manualmente)`);
  }
}

if (APPLY && planos.length) {
  for (const plano of planos) {
    const { error } = await supabase.from("analises").update(plano.update).eq("id", plano.id);
    if (error) console.error(`❌ Erro ao atualizar ${plano.id}:`, error.message);
  }
  console.log(`\n✅ ${planos.length} registro(s) atualizado(s).`);
}

console.log(APPLY ? "\n🚨 Aplicado." : "\n🧪 Dry-run concluído — rode com --apply pra aplicar de verdade.");
