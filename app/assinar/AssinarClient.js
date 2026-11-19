'use client';

// /assinar — oferta do Intuitive Completo. Aceita na URL:
//   ?a=<id da análise>  (quem veio de Previsão/HD/Compatibilidade/Manual — o e-mail sai da análise)
//   ?plano=anual|mensal (pré-seleciona)
//   ?renovar=<token>    (link do e-mail de renovação do Pix)
// Quem está logado no Seu Dia já é identificado pelo cookie.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import { PRECO_ASSINATURA_ANUAL, PRECO_ASSINATURA_MENSAL } from '@/lib/preco';
import { emailValido, sugestaoEmail } from '@/lib/emailValidacao';

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'assinatura', ...params }); } catch {}
}

const ITENS = [
  { titulo: 'Seu Dia completo', texto: 'As 5 lentes do seu dia, suas horas de força, a semana e os próximos 30 dias — com aviso às 7h.' },
  { titulo: 'Previsão do Ano', texto: 'Os seus próximos 12 meses, mês a mês: o que cada ciclo favorece e o que pede cuidado.' },
  { titulo: 'Human Design', texto: 'Seu Tipo, sua Autoridade, seu Perfil e como decidir do seu jeito.' },
  { titulo: 'Compatibilidade Completa', texto: 'Seu mapa cruzado com o de outra pessoa, ponto a ponto.' },
  { titulo: 'Oráculo ilimitado', texto: 'Pergunte o que quiser sobre o seu mapa, quantas vezes quiser.' },
];

export default function AssinarClient() {
  const params = useSearchParams();
  const analiseId = params.get('a');
  const renovar = params.get('renovar');
  const erroPagamento = params.get('erro') === 'pagamento';

  const [plano, setPlano] = useState(params.get('plano') === 'mensal' ? 'mensal' : 'anual');
  const [metodo, setMetodo] = useState('prepago');
  const [email, setEmail] = useState('');
  const [precisaEmail, setPrecisaEmail] = useState(false);
  const [acesso, setAcesso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    fetch('/api/assinatura/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analiseId ? { analiseId } : {}),
    })
      .then((r) => r.json())
      .then((j) => { if (vivo) setAcesso(j); })
      .catch(() => {});
    // Sem sessão do Seu Dia, sem análise e sem token, precisamos do e-mail.
    fetch('/api/seu-dia/perfil').then((r) => {
      if (vivo && r.status === 401 && !analiseId && !renovar) setPrecisaEmail(true);
    }).catch(() => vivo && !analiseId && !renovar && setPrecisaEmail(true));
    evento('assinar_ver');
    return () => { vivo = false; };
  }, [analiseId, renovar]);

  async function assinar(e) {
    e.preventDefault();
    setErro('');
    if (precisaEmail && !emailValido(email)) { setErro('Confira o e-mail.'); return; }
    setEnviando(true);
    evento('assinar_checkout', { plano, metodo });
    try {
      const r = await fetch('/api/assinatura/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano, metodo, analiseId, renovar, email: precisaEmail ? email : undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (j?.error === 'precisa_email') { setPrecisaEmail(true); setErro(j.mensagem); return; }
      if (!r.ok || !j.url) { setErro(j?.error || 'Não conseguimos abrir o pagamento agora.'); return; }
      window.location.href = j.url;
    } finally {
      setEnviando(false);
    }
  }

  const sugestao = sugestaoEmail(email);
  const ativa = acesso?.ativa && acesso.origem === 'assinatura';
  const ateTexto = acesso?.acessoAte ? new Date(acesso.acessoAte).toLocaleDateString('pt-BR') : '';

  return (
    <div className="as-wrap">
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet" />
      <SiteNav active="assinar" />

      <main className="as-col">
        <header className="as-hero">
          <span className="as-eyebrow">INTUITIVE COMPLETO</span>
          <h1>Tudo liberado, numa assinatura só.</h1>
          <p className="as-lead">O grátis te mostra o começo. Assinando, você vê tudo — todo dia, sobre você.</p>
        </header>

        {erroPagamento && <p className="as-aviso">O pagamento não foi concluído. Tente de novo ou escolha Pix.</p>}
        {ativa && (
          <p className="as-ok">Você já é Intuitive Completo até {ateTexto}{acesso.renovaSozinha ? ' (renova sozinho no cartão)' : ''}. Pode renovar abaixo pra somar mais tempo.</p>
        )}
        {acesso?.ativa && acesso.origem === 'manual' && (
          <p className="as-ok">Seu 1º mês já está liberado por conta do Manual, até {ateTexto}. Assine pra continuar depois disso.</p>
        )}

        <section className="as-card">
          <h2>O que entra</h2>
          <ul className="as-itens">
            {ITENS.map((i) => (
              <li key={i.titulo}><strong>{i.titulo}</strong><span>{i.texto}</span></li>
            ))}
            <li className="as-destaque"><strong>No anual: o Manual Completo</strong><span>O seu Manual dos Poderes Ocultos liberado junto.</span></li>
          </ul>
        </section>

        <form className="as-card" onSubmit={assinar}>
          <h2>Escolha o plano</h2>
          <div role="radiogroup" aria-label="Plano" className="as-opcoes">
            <button type="button" role="radio" aria-checked={plano === 'anual'} className={`as-opcao${plano === 'anual' ? ' is-on' : ''}`} onClick={() => setPlano('anual')}>
              <span><strong>Anual</strong><small>{brl(PRECO_ASSINATURA_ANUAL / 12)} por mês · inclui o Manual</small></span>
              <strong>{brl(PRECO_ASSINATURA_ANUAL)}/ano</strong>
            </button>
            <button type="button" role="radio" aria-checked={plano === 'mensal'} className={`as-opcao${plano === 'mensal' ? ' is-on' : ''}`} onClick={() => setPlano('mensal')}>
              <span><strong>Mensal</strong><small>Sem fidelidade</small></span>
              <strong>{brl(PRECO_ASSINATURA_MENSAL)}/mês</strong>
            </button>
          </div>

          <h2>Como pagar</h2>
          <div role="radiogroup" aria-label="Forma de pagamento" className="as-opcoes">
            <button type="button" role="radio" aria-checked={metodo === 'prepago'} className={`as-opcao${metodo === 'prepago' ? ' is-on' : ''}`} onClick={() => setMetodo('prepago')}>
              <span><strong>Pix ou cartão à vista</strong><small>{plano === 'anual' ? 'Paga 1 ano agora' : 'Paga 1 mês agora'}; avisamos antes de vencer</small></span>
            </button>
            <button type="button" role="radio" aria-checked={metodo === 'recorrente'} className={`as-opcao${metodo === 'recorrente' ? ' is-on' : ''}`} onClick={() => setMetodo('recorrente')}>
              <span><strong>Cartão — renova sozinho</strong><small>Cobra {plano === 'anual' ? 'todo ano' : 'todo mês'}; cancele quando quiser</small></span>
            </button>
          </div>
          {metodo === 'recorrente' && (
            <p className="as-mudo">No Mercado Pago, entre com a conta do mesmo e-mail da sua assinatura.</p>
          )}

          {precisaEmail && (
            <>
              <label htmlFor="as-email">Seu e-mail <span className="as-mudo">(é por ele que liberamos o acesso)</span></label>
              <input id="as-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
              {sugestao && <button type="button" className="as-link" onClick={() => setEmail(sugestao)}>Você quis dizer {sugestao}?</button>}
            </>
          )}

          {erro && <p className="as-erro">{erro}</p>}
          <button type="submit" className="as-btn" disabled={enviando}>
            {enviando ? 'Abrindo o pagamento…' : `Assinar ${plano === 'anual' ? `por ${brl(PRECO_ASSINATURA_ANUAL)}/ano` : `por ${brl(PRECO_ASSINATURA_MENSAL)}/mês`}`}
          </button>
          <p className="as-mudo as-centro">Pagamento pelo Mercado Pago. Arrependeu? Até 7 dias depois, devolvemos — é só escrever pra conceptintuitive@gmail.com.</p>
        </form>

        <section className="as-card">
          <h2>Dúvidas rápidas</h2>
          <p><strong>Como cancelar?</strong> No cartão, em Seu Dia → Ajustes, ou no app do Mercado Pago. O acesso continua até o fim do que já foi pago. No Pix não há cobrança automática: se não renovar, só volta pro grátis.</p>
          <p><strong>Já comprei o Manual.</strong> Você ganhou o 1º mês do Intuitive Completo. O Manual continua seu pra sempre.</p>
          <p><strong>Uso em qual aparelho?</strong> Em qualquer um: o acesso é pelo seu e-mail.</p>
        </section>
      </main>

      <style jsx global>{`
        body { margin: 0; background: #0a0118; }
        .as-wrap { min-height: 100vh; background: #0a0118; color: #faf5ff; font-family: 'Cormorant Garamond', Georgia, serif; }
        .as-col { max-width: 560px; margin: 0 auto; padding: 28px 18px 64px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; }
        .as-hero { text-align: center; display: flex; flex-direction: column; gap: 8px; }
        .as-eyebrow { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.22em; color: #f5a524; }
        .as-hero h1 { margin: 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(26px, 6vw, 34px); line-height: 1.2; text-wrap: balance; }
        .as-lead { margin: 0; font-size: 20px; color: #e9dcff; }
        .as-card { background: #150a28; border: 1px solid #2e1f4a; border-radius: 18px; padding: 18px 16px; display: flex; flex-direction: column; gap: 12px; }
        .as-card h2 { margin: 4px 0 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 16px; letter-spacing: 0.04em; }
        .as-card p { margin: 0; font-size: 18px; line-height: 1.45; }
        .as-itens { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
        .as-itens li { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-top: 1px solid #2e1f4a; font-size: 17px; }
        .as-itens li strong { font-size: 18px; }
        .as-itens li span { color: #e9dcff; }
        .as-destaque strong { color: #f5a524; }
        .as-opcoes { display: flex; flex-direction: column; gap: 10px; }
        .as-opcao { min-height: 64px; border-radius: 16px; border: 1px solid #2e1f4a; background: #10061f; color: #faf5ff; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; text-align: left; cursor: pointer; font-family: 'Cormorant Garamond', serif; font-size: 17px; }
        .as-opcao > span { display: flex; flex-direction: column; gap: 2px; }
        .as-opcao strong { font-family: 'Cinzel', serif; font-size: 15px; }
        .as-opcao small { font-size: 15px; color: #cdbbe8; }
        .as-opcao.is-on { border: 2px solid #f5a524; }
        .as-card label { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.06em; color: #cdbbe8; }
        .as-card input { width: 100%; box-sizing: border-box; min-height: 48px; background: #0a0118; color: #faf5ff; border: 1px solid #4a2f6e; border-radius: 12px; padding: 10px 14px; font-family: 'Cormorant Garamond', serif; font-size: 18px; }
        .as-btn { min-height: 54px; border-radius: 999px; border: 0; background: #db2777; color: #fff; font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px; letter-spacing: 0.04em; cursor: pointer; }
        .as-btn:disabled { opacity: 0.6; }
        .as-link { background: none; border: 0; color: #f5a524; text-decoration: underline; font: inherit; cursor: pointer; padding: 0; text-align: left; }
        .as-mudo { color: #cdbbe8 !important; font-size: 15px !important; }
        .as-centro { text-align: center; }
        .as-erro { color: #fca5a5 !important; font-size: 16px !important; }
        .as-aviso { margin: 0; padding: 12px 14px; border-radius: 12px; background: #3a2208; color: #fdba74; font-size: 17px; }
        .as-ok { margin: 0; padding: 12px 14px; border-radius: 12px; background: #12331f; color: #bbf7d0; font-size: 17px; }
      `}</style>
    </div>
  );
}
