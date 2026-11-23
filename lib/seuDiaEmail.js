// lib/seuDiaEmail.js — e-mails do Seu Dia: o dia às 7h e os do fim do teste
// (dia 5 e dia 7). Puro (sem banco e sem Resend): o cron
// app/api/cron/seu-dia-email/route.js escolhe as pessoas, chama
// `emailsDeHoje` e envia o que `montarEmail*` devolve. Testado em
// tests/seuDiaEmail.test.js.
//
// Regras:
// - Só pra perfil com e-mail confirmado (verificado_em) e dados de nascimento.
// - `email_diario = false` (descadastro ou checkbox desmarcado) corta TODOS.
// - O diário sai no máximo 1x por dia (email_diario_ultimo = hoje em Brasília).
// - Dia 5 e dia 7 do teste: só pra quem não assinou e nunca pagou o Manual,
//   1x cada (email_teste_d5_em / email_teste_d7_em).

import { diaDoTeste } from './testeSeuDia.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const semPonto = (t) => String(t || '').replace(/[.!]+$/, '');

/**
 * Quais e-mails a pessoa deve receber hoje.
 * @param {{ email_diario?: boolean|null, email_diario_ultimo?: string|null, teste_inicio?: string|null,
 *   email_teste_d5_em?: string|null, email_teste_d7_em?: string|null }} row
 * @param {{ hoje: string, agora?: number, assinou: boolean, manualPago: boolean }} ctx
 * @returns {Array<'diario'|'teste_d5'|'teste_d7'>}
 */
export function emailsDeHoje(row, { hoje, agora = Date.now(), assinou, manualPago }) {
  if (!row || row.email_diario === false) return [];
  const out = [];
  if (row.email_diario_ultimo !== hoje) out.push('diario');
  if (row.teste_inicio && !assinou && !manualPago) {
    const dia = diaDoTeste(row.teste_inicio, agora);
    if (dia === 5 && !row.email_teste_d5_em) out.push('teste_d5');
    if (dia === 7 && !row.email_teste_d7_em) out.push('teste_d7');
  }
  return out;
}

// ── Layout (visual da Minha Área, em e-mail: tabelas não são necessárias aqui) ─

function moldura({ conteudo, descadastro, motivo }) {
  return `
<div style="background:#07040d;padding:36px 20px;font-family:Georgia,'Times New Roman',serif;color:#f3e9da">
  <div style="max-width:520px;margin:0 auto">
    <p style="margin:0 0 22px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.28em;color:#f3e9da">INTUITIVE CONCEPT</p>
    ${conteudo}
    <p style="margin:34px 0 0;padding-top:16px;border-top:1px solid rgba(242,199,123,.22);font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#8d7fa3">
      ${motivo} <a href="${esc(descadastro)}" style="color:#b9a9c9">Não quero mais receber</a>.
    </p>
  </div>
</div>`.trim();
}

const botao = (href, texto) => `<a href="${esc(href)}" style="display:inline-block;margin-top:22px;background:#f2c77b;color:#1a1020;text-decoration:none;padding:15px 26px;border-radius:999px;font-family:'Courier New',monospace;font-size:13px;letter-spacing:.14em;text-transform:uppercase">${esc(texto)}</a>`;
const rodapeTexto = (descadastro) => `\n\n—\nNão quer mais receber? ${descadastro}`;

/**
 * O dia às 7h.
 * @param {{ nome?: string|null, leitura: object, completo: boolean, linkDia: string, descadastro: string }} p
 */
export function montarEmailDiario({ nome, leitura: l, completo, linkDia, descadastro }) {
  const titulo = semPonto(l.titulo);
  const faca = l.faca?.[0] || '';
  const dataTexto = `${l.rotulo.semana}, ${l.rotulo.dia} de ${l.rotulo.mes}`;
  const cta = completo ? 'Abrir meu dia' : 'Ver o dia completo';
  const ola = nome ? `${esc(nome)}, ` : '';
  const html = moldura({
    motivo: 'Você recebe este e-mail porque pediu o seu dia às 7h.',
    descadastro,
    conteudo: `
    <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#f2c77b">${ola}${esc(dataTexto)}</p>
    <h1 style="margin:0 0 14px;font-weight:400;font-size:36px;line-height:1.05;color:#f3e9da">${esc(l.titulo)}</h1>
    <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#d9cbb8">${esc(l.frase)}</p>
    ${faca ? `<p style="margin:0;padding-top:14px;border-top:1px solid rgba(242,199,123,.22);font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#f3e9da"><span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.2em;color:#9fe0c0">FAÇA&nbsp;&nbsp;</span>${esc(faca)}</p>` : ''}
    ${botao(linkDia, cta)}`,
  });
  const text = `${nome ? `${nome}, ` : ''}${dataTexto}\n\n${l.titulo}\n${l.frase}${faca ? `\n\nFaça: ${faca}` : ''}\n\n${cta}: ${linkDia}${rodapeTexto(descadastro)}`;
  return { subject: `Hoje: ${titulo}`, html, text };
}

/** Dia 5 do teste: faltam 2 dias. */
export function montarEmailTesteD5({ nome, linkAssinar, descadastro }) {
  const ola = nome ? `${esc(nome)}, ` : '';
  const perde = ['As suas horas de força e de atenção, todo dia', 'A semana inteira, dia por dia', 'O mês até o fim, com os seus melhores dias'];
  const html = moldura({
    motivo: 'Você recebe este e-mail porque está no teste do Seu Dia Completo.',
    descadastro,
    conteudo: `
    <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#f2c77b">Seu Dia Completo</p>
    <h1 style="margin:0 0 14px;font-weight:400;font-size:34px;line-height:1.05">${ola}faltam 2 dias</h1>
    <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#d9cbb8">Depois disso, o seu dia volta pro resumo. Sai:</p>
    ${perde.map((p) => `<p style="margin:0;padding:10px 0;border-top:1px solid rgba(242,199,123,.22);font-family:Arial,sans-serif;font-size:15px;color:#f3e9da">${esc(p)}</p>`).join('')}
    ${botao(linkAssinar, 'Continuar com o Seu Dia Completo')}`,
  });
  const text = `${nome ? `${nome}, f` : 'F'}altam 2 dias do seu Seu Dia Completo.\n\nDepois disso, o seu dia volta pro resumo. Sai:\n- ${perde.join('\n- ')}\n\nContinuar com o Seu Dia Completo: ${linkAssinar}${rodapeTexto(descadastro)}`;
  return { subject: 'Faltam 2 dias do seu Seu Dia Completo', html, text };
}

/** Dia 7 do teste: amanhã volta pro resumo. */
export function montarEmailTesteD7({ nome, linkAssinar, descadastro }) {
  const ola = nome ? `${esc(nome)}, ` : '';
  const html = moldura({
    motivo: 'Você recebe este e-mail porque está no teste do Seu Dia Completo.',
    descadastro,
    conteudo: `
    <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#f2c77b">Último dia do teste</p>
    <h1 style="margin:0 0 14px;font-weight:400;font-size:34px;line-height:1.05">${ola}amanhã seu dia volta pro resumo</h1>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#d9cbb8">Hoje é o último dia com tudo aberto: as horas, a semana e o mês. Pra continuar vendo tudo, todo dia, é o Intuitive Completo.</p>
    ${botao(linkAssinar, 'Continuar com o Seu Dia Completo')}`,
  });
  const text = `${nome ? `${nome}, a` : 'A'}manhã seu dia volta pro resumo.\n\nHoje é o último dia com tudo aberto. Pra continuar: ${linkAssinar}${rodapeTexto(descadastro)}`;
  return { subject: 'Amanhã seu dia volta pro resumo', html, text };
}
