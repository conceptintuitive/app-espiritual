import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { emailValido } from '@/lib/emailValidacao';
import { getBaseUrl } from '@/lib/baseUrl';
import { admin, tokenLogin, gerarCodigo, hashCodigo, CODIGO_MS } from '@/lib/seuDiaServidor';
import { gravarUtmNoPerfil } from '@/lib/utmSocialServidor';

export const runtime = 'nodejs';

// POST { email, utm? } → manda o código de 6 dígitos (e, de reserva, o link) pra
// entrar na Minha Área. Responde ok mesmo se o e-mail já recebeu há menos de
// 60s (não reenvia, não revela nada). `codigo: false` = migração 0019 ainda
// não rodou: o e-mail sai só com o link.
export async function POST(request) {
  let email;
  let utm = null;
  try {
    const body = await request.json();
    email = String(body?.email || '').trim().toLowerCase();
    utm = body?.utm ?? null;
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }
  if (!emailValido(email) || email.length > 254) {
    return NextResponse.json({ error: 'Confira o e-mail.' }, { status: 400 });
  }

  try {
    const sb = admin();
    const { data: atual } = await sb.from('seu_dia_perfis').select('link_enviado_em').eq('email', email).maybeSingle();
    if (atual?.link_enviado_em && Date.now() - new Date(atual.link_enviado_em).getTime() < 60 * 1000) {
      return NextResponse.json({ ok: true, codigo: true, repetido: true });
    }
    const { error } = await sb
      .from('seu_dia_perfis')
      .upsert({ email, link_enviado_em: new Date().toISOString() }, { onConflict: 'email' });
    if (error) {
      // Quase sempre: a migração 0017_seu_dia.sql ainda não rodou (tabela não existe).
      console.error('[seu-dia/entrar] Supabase:', error.code, error.message);
      const e = new Error(error.message);
      e.codigo = error.code === '42P01' || /does not exist|schema cache/i.test(error.message || '') ? 'tabela' : 'banco';
      throw e;
    }
    // Conta nova: guarda de onde a pessoa veio (só a UTM, migração 0031, best effort).
    if (!atual && utm) {
      const r = await gravarUtmNoPerfil(sb, email, utm);
      if (!r.ok && r.motivo !== 'sem utm') console.error('[seu-dia/entrar] utm:', r.motivo);
    }

    // Código: só o HMAC vai pro banco. Se as colunas não existirem (0019 não
    // rodou), segue só com o link.
    let codigo = gerarCodigo();
    const { error: erroCodigo } = await sb
      .from('seu_dia_perfis')
      .update({ codigo_hash: hashCodigo(email, codigo), codigo_expira: new Date(Date.now() + CODIGO_MS).toISOString(), codigo_tentativas: 0 })
      .eq('email', email);
    if (erroCodigo) {
      console.error('[seu-dia/entrar] código:', erroCodigo.code, erroCodigo.message);
      codigo = null;
    }

    const link = `${getBaseUrl()}/seu-dia/entrar?t=${encodeURIComponent(tokenLogin(email))}`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: erroEmail } = await resend.emails.send({
      from: 'Intuitive Concept <acesso@intuitiveconcept.com.br>',
      to: email,
      subject: codigo ? `${codigo} é o seu código de entrada ✦` : 'Seu link para entrar na Minha Área ✦',
      text: codigo
        ? `Seu código para entrar na Minha Área do Intuitive Concept: ${codigo}\n\nVale por 15 minutos. Se preferir, toque no link (vale 30 minutos):\n${link}\n\nSe não foi você que pediu, ignore este e-mail.`
        : `Toque no link para entrar na Minha Área (vale por 30 minutos):\n\n${link}\n\nSe não foi você que pediu, ignore este e-mail.`,
      html: `
        <div style="background:#0a0118;padding:32px 20px;font-family:Georgia,serif;color:#faf5ff;text-align:center">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:.2em;color:#f5a524">✦ INTUITIVE CONCEPT</p>
          <h1 style="margin:0 0 14px;font-size:24px;font-weight:700">Sua Minha Área está pronta</h1>
          ${codigo ? `
          <p style="margin:0 0 10px;font-size:16px;line-height:1.5;color:#e9dcff">Digite este código no site. Ele vale por 15 minutos.</p>
          <p style="margin:0 0 24px;font-size:38px;letter-spacing:.35em;font-weight:700;color:#f5d48a;font-family:'Courier New',monospace">${codigo}</p>
          <p style="margin:0 0 14px;font-size:14px;color:#9e8cbd">Ou toque no botão (vale por 30 minutos):</p>` : `
          <p style="margin:0 0 22px;font-size:16px;line-height:1.5;color:#e9dcff">Toque no botão para entrar. O link vale por 30 minutos.</p>`}
          <a href="${link}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:700">Entrar na Minha Área</a>
          <p style="margin:26px 0 0;font-size:12px;color:#9e8cbd">Se não foi você que pediu, ignore este e-mail.</p>
        </div>`,
    });
    // O SDK do Resend não lança erro: devolve { error }. Sem esta checagem a
    // pessoa via "link enviado" e o e-mail nunca saía.
    if (erroEmail) {
      console.error('[seu-dia/entrar] Resend:', erroEmail.name, erroEmail.message);
      // Libera um novo pedido na hora, em vez de segurar 60s por um envio que falhou.
      await sb.from('seu_dia_perfis').update({ link_enviado_em: null }).eq('email', email);
      const e = new Error('resend');
      e.codigo = 'email';
      throw e;
    }
    return NextResponse.json({ ok: true, codigo: !!codigo });
  } catch (e) {
    console.error('[seu-dia/entrar]', e);
    // `codigo` não expõe nada sensível e ajuda a achar a causa sem abrir o log:
    // tabela = migração 0017 não rodou; banco = outro erro do Supabase; email = Resend.
    const motivo = e?.codigo || 'interno';
    return NextResponse.json({ error: `Não conseguimos enviar agora (código: ${motivo}). Tente de novo em instantes.`, codigo: motivo }, { status: 500 });
  }
}
