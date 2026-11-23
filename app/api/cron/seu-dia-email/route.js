import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { admin, tokenDescadastro } from '@/lib/seuDiaServidor';
import { montarPerfil, leituraDoDia, hojeNoFuso } from '@/lib/seuDia';
import { resumoAcesso } from '@/lib/assinaturaRegras';
import { dataBrasilia, fimDoTeste } from '@/lib/testeSeuDia';
import { emailsDeHoje, montarEmailDiario, montarEmailTesteD5, montarEmailTesteD7 } from '@/lib/seuDiaEmail';
import { getBaseUrl } from '@/lib/baseUrl';

export const runtime = 'nodejs';
export const maxDuration = 300;

// E-mail do Seu Dia às 7h (o gatilho do hábito) + e-mails do fim do teste
// (dia 5 e dia 7). Disparado por cron externo às 7h de Brasília:
//   GET /api/cron/seu-dia-email?secret=CRON_SECRET  (ou Authorization: Bearer)
// Vai pra todo perfil com e-mail confirmado (verificado_em), dados de
// nascimento e email_diario = true (migração 0022). Regras em lib/seuDiaEmail.js.
//
// Idempotente: antes de enviar, cada e-mail é "reservado" com um UPDATE
// condicional (email_diario_ultimo <> hoje / email_teste_dN_em is null). Só
// quem conseguiu reservar envia; se o envio falhar, a reserva é desfeita.
// Rodar o cron 2x no mesmo dia não manda nada repetido.
//
// Envio em lotes de até 100 pelo resend.batch (1 requisição por lote), pra não
// bater no limite de requisições por segundo da Resend.

const FROM = 'Intuitive Concept <acesso@intuitiveconcept.com.br>';
const LOTE = 100;
const COLUNAS = 'email, nome, data_nascimento, hora_nascimento, longitude, fuso_iana, teste_inicio, email_diario, email_diario_ultimo, email_teste_d5_em, email_teste_d7_em';

const porEmail = (rows) => {
  const m = new Map();
  for (const r of rows || []) {
    const k = String(r.email || '').trim().toLowerCase();
    if (!k) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
};

async function lerTudo(consulta) {
  const out = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await consulta().range(de, de + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

// Reserva o envio (UPDATE condicional). Devolve true se esta execução ganhou.
async function reservar(sb, email, tipo, hoje) {
  let q = sb.from('seu_dia_perfis');
  if (tipo === 'diario') {
    q = q.update({ email_diario_ultimo: hoje }).eq('email', email)
      .or(`email_diario_ultimo.is.null,email_diario_ultimo.neq.${hoje}`);
  } else {
    const col = tipo === 'teste_d5' ? 'email_teste_d5_em' : 'email_teste_d7_em';
    q = q.update({ [col]: new Date().toISOString() }).eq('email', email).is(col, null);
  }
  const { data, error } = await q.select('email');
  if (error) throw error;
  return (data || []).length === 1;
}

async function desfazer(sb, email, tipo, anterior) {
  const col = tipo === 'diario' ? 'email_diario_ultimo' : tipo === 'teste_d5' ? 'email_teste_d5_em' : 'email_teste_d7_em';
  await sb.from('seu_dia_perfis').update({ [col]: anterior ?? null }).eq('email', email);
}

async function handler(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'RESEND_API_KEY ausente' }, { status: 503 });

  const sb = admin();
  const agora = Date.now();
  const hoje = dataBrasilia(agora);
  const base = getBaseUrl();

  let perfis;
  try {
    perfis = await lerTudo(() => sb.from('seu_dia_perfis').select(COLUNAS)
      .not('verificado_em', 'is', null).not('data_nascimento', 'is', null).eq('email_diario', true)
      .order('email'));
  } catch (e) {
    // Sem a migração 0022 as colunas não existem: não envia nada.
    console.error('[cron/seu-dia-email] perfis', e?.code, e?.message);
    return NextResponse.json({ error: 'Rode a migração 0022_seu_dia_email_teste.sql', detalhe: e?.message }, { status: 503 });
  }
  if (!perfis.length) return NextResponse.json({ hoje, pessoas: 0, enviados: 0 });

  // Acesso de todo mundo de uma vez (em vez de 2 consultas por pessoa).
  const [assinaturas, pagos] = await Promise.all([
    lerTudo(() => sb.from('assinaturas').select('email, plano, metodo, status, acesso_ate').order('criado_em')),
    lerTudo(() => sb.from('analises').select('email, paid_at, origem').eq('payment_status', 'paid').order('created_at')),
  ]);
  const assinPorEmail = porEmail(assinaturas);
  const pagoPorEmail = porEmail(pagos);

  const fila = []; // { email, tipo, anterior, msg }
  let pulados = 0;
  for (const p of perfis) {
    const email = p.email;
    const linhas = assinPorEmail.get(email) || [];
    const pagosDela = pagoPorEmail.get(email) || [];
    const cortesia = pagosDela
      .filter((r) => r.origem !== 'assinatura' && r.paid_at)
      .map((r) => r.paid_at).sort().pop() || null;
    const acesso = resumoAcesso({ linhas, manualPagoEm: cortesia, agora });
    const emTeste = !!p.teste_inicio && agora < fimDoTeste(p.teste_inicio);
    const completo = acesso.ativa || emTeste;
    const assinou = linhas.some((l) => l.status !== 'pendente');
    const manualPago = pagosDela.length > 0;

    const tipos = emailsDeHoje(p, { hoje, agora, assinou, manualPago });
    if (!tipos.length) { pulados += 1; continue; }

    const nome = String(p.nome || '').trim().split(/\s+/)[0] || null;
    const descadastro = `${base}/api/unsubscribe?sd=${encodeURIComponent(tokenDescadastro(email))}`;
    const linkAssinar = `${base}/assinar?plano=mensal&utm_source=email&utm_medium=seu_dia_teste`;
    for (const tipo of tipos) {
      let msg;
      try {
        if (tipo === 'diario') {
          const tz = p.fuso_iana || 'America/Sao_Paulo';
          const perfil = montarPerfil({ dataNascimento: p.data_nascimento, hora: p.hora_nascimento, tz, lon: p.longitude });
          const leitura = leituraDoDia(perfil, hojeNoFuso(tz, new Date(agora)));
          const linkDia = `${base}/seu-dia?aba=hoje&utm_source=email&utm_medium=seu_dia_7h`;
          msg = montarEmailDiario({ nome, leitura, completo, linkDia, descadastro });
        } else if (tipo === 'teste_d5') {
          msg = montarEmailTesteD5({ nome, linkAssinar, descadastro });
        } else {
          msg = montarEmailTesteD7({ nome, linkAssinar, descadastro });
        }
      } catch (e) {
        console.error('[cron/seu-dia-email] montar', tipo, e?.message);
        continue;
      }
      const anterior = tipo === 'diario' ? p.email_diario_ultimo : tipo === 'teste_d5' ? p.email_teste_d5_em : p.email_teste_d7_em;
      fila.push({ email, tipo, anterior, msg, descadastro });
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const contagem = { diario: 0, teste_d5: 0, teste_d7: 0 };
  let falhas = 0;
  let jaEnviados = 0;
  for (let i = 0; i < fila.length; i += LOTE) {
    const lote = [];
    for (const item of fila.slice(i, i + LOTE)) {
      try {
        if (await reservar(sb, item.email, item.tipo, hoje)) lote.push(item);
        else jaEnviados += 1; // outra execução já mandou
      } catch (e) {
        console.error('[cron/seu-dia-email] reservar', item.tipo, e?.message);
      }
    }
    if (!lote.length) continue;
    const { error } = await resend.batch.send(lote.map((it) => ({
      from: FROM,
      to: it.email,
      subject: it.msg.subject,
      html: it.msg.html,
      text: it.msg.text,
      headers: { 'List-Unsubscribe': `<${it.descadastro}>` },
    })));
    if (error) {
      console.error('[cron/seu-dia-email] resend', error?.message || error);
      falhas += lote.length;
      await Promise.allSettled(lote.map((it) => desfazer(sb, it.email, it.tipo, it.anterior)));
    } else {
      for (const it of lote) contagem[it.tipo] += 1;
    }
  }

  return NextResponse.json({
    hoje,
    pessoas: perfis.length,
    enviados: contagem.diario + contagem.teste_d5 + contagem.teste_d7,
    ...contagem,
    jaEnviados,
    falhas,
    semNada: pulados,
  });
}

export const GET = handler;
export const POST = handler;
