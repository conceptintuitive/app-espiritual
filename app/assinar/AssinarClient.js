'use client';

// /assinar — oferta do Intuitive Completo. Aceita na URL:
//   ?a=<id da análise>  (quem veio de Previsão/HD/Compatibilidade/Manual — o e-mail sai da análise)
//   ?plano=anual|mensal (pré-seleciona)
//   ?renovar=<token>    (link do e-mail de renovação do Pix)
// Quem está logado no Seu Dia já é identificado pelo cookie.
// Visual da Minha Área (nov/2026): céu no topo (perfil do aparelho; sem perfil,
// a imagem da estrela), prévia do Hoje com dados de exemplo, o que entra,
// planos, pagamento com Pix primeiro e garantia colada no botão. Checkout,
// preços (lib/preco.js) e regras da assinatura não mudaram.

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteNav from '@/app/components/SiteNav';
import FaixaCeu from '@/app/seu-dia/FaixaCeu';
import { DiaResumo, LinhaHora, EXEMPLO_DIA as EXEMPLO, TOM_ROTULO } from '@/app/seu-dia/DiaResumo';
import { PRECO_ASSINATURA_ANUAL, PRECO_ASSINATURA_MENSAL, PRECO_MANUAL_PADRAO } from '@/lib/preco';
import { emailValido, sugestaoEmail } from '@/lib/emailValidacao';
import { lerPerfil } from '@/lib/perfilLocal';
import { montarPerfil, leituraDoDia, hojeNoFuso } from '@/lib/seuDia';
import { TESTE_SEU_DIA_ATIVO } from '@/lib/testeSeuDia';
import ma from '@/app/seu-dia/minhaArea.module.css';
import a from './assinar.module.css';

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'assinatura', ...params }); } catch {}
}


// Economia do anual em relação a 12 meses do mensal (+ o Manual, que vem no anual).
const centavos = (v) => Math.round(v * 100) / 100;
const ECONOMIA_COM_MANUAL = centavos(PRECO_ASSINATURA_MENSAL * 12 + PRECO_MANUAL_PADRAO - PRECO_ASSINATURA_ANUAL);
const ECONOMIA_SEM_MANUAL = centavos(PRECO_ASSINATURA_MENSAL * 12 - PRECO_ASSINATURA_ANUAL);

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

  // Forma de pagamento padrão por plano: mensal → cartão que renova sozinho;
  // anual → Pix (liberado na hora). Trocar de plano volta pro padrão dele.
  const METODO_PADRAO = { mensal: 'recorrente', anual: 'prepago' };
  const planoInicial = params.get('plano') === 'mensal' ? 'mensal' : 'anual';
  const [plano, setPlanoEstado] = useState(planoInicial);
  const [metodo, setMetodo] = useState(METODO_PADRAO[planoInicial]);
  const setPlano = (p) => { setPlanoEstado(p); setMetodo(METODO_PADRAO[p]); };
  const [semSessao, setSemSessao] = useState(false);
  const [email, setEmail] = useState('');
  const [precisaEmail, setPrecisaEmail] = useState(false);
  const [acesso, setAcesso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [perfilLocal, setPerfilLocal] = useState(null);
  useEffect(() => { setPerfilLocal(lerPerfil()); }, []);

  // Prévia do Hoje: a leitura real do motor do Seu Dia, pra pessoa de exemplo.
  const exemplo = useMemo(() => {
    try {
      const calc = montarPerfil(EXEMPLO);
      return leituraDoDia(calc, hojeNoFuso(EXEMPLO.tz), { horas: true });
    } catch { return null; }
  }, []);

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
      if (vivo && r.status === 401) setSemSessao(true);
      if (vivo && r.status === 401 && !analiseId && !renovar) setPrecisaEmail(true);
    }).catch(() => { if (vivo) { setSemSessao(true); if (!analiseId && !renovar) setPrecisaEmail(true); } });
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
  const cortesia = acesso?.ativa && acesso.origem === 'manual';
  const ateData = acesso?.acessoAte ? new Date(acesso.acessoAte) : null;
  const ateTexto = ateData ? ateData.toLocaleDateString('pt-BR') : '';
  const ateCurto = ateData ? ateData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
  const porMes = brl(PRECO_ASSINATURA_ANUAL / 12);
  const precoBotao = plano === 'anual' ? `${brl(PRECO_ASSINATURA_ANUAL)}/ano` : `${brl(PRECO_ASSINATURA_MENSAL)}/mês`;
  const hora = exemplo?.horas?.forca?.[0] || exemplo?.horas?.atencao || null;

  return (
    // O menu fica fora do .ma: as cores de link da Minha Área não podem pintar o botão dele.
    <div style={{ position: 'relative', minHeight: '100vh', background: '#07040d' }}>
      <SiteNav active="assinar" transparente />
      <div className={ma.ma}>

      <FaixaCeu perfil={perfilLocal} eyebrow="Intuitive Completo" titulo="Seu mapa, todo dia." alta>
        <p className={a.sub}>Seu dia lido pelo seu mapa: o que fazer, o que evitar e as melhores horas, todo dia.</p>
        {cortesia && ateCurto && <p className={a.cortesia}>Seu mês de cortesia vai até {ateCurto}</p>}
      </FaixaCeu>

      <main className={a.corpo}>
        {erroPagamento && <p className={a.aviso}>O pagamento não foi concluído. Tente de novo ou escolha Pix.</p>}
        {ativa && (
          <p className={a.ok}>Você já é Intuitive Completo até {ateTexto}{acesso.renovaSozinha ? ' (renova sozinho no cartão)' : ''}. Pode renovar abaixo pra somar mais tempo.</p>
        )}

        <div className={a.duas}>
          {exemplo && (
            <section className={a.secao} aria-labelledby="as-dentro">
              <div className={a.topoSecao}>
                <h2 id="as-dentro" className={a.h2}>Como é por dentro</h2>
                <span className={a.exemplo}>exemplo</span>
              </div>
              <div className={`${ma.abaCorpo} ${a.previa}`}>
                <DiaResumo l={exemplo} rotuloTom={TOM_ROTULO[exemplo.tom] || 'Dia misto'} />
                {hora && (
                  <div className={a.previaHoras}>
                    <span className={a.previaHorasRotulo}>Suas horas hoje</span>
                    <LinhaHora h={hora} />
                  </div>
                )}
              </div>
            </section>
          )}

          <section className={a.secao} aria-labelledby="as-entra">
            <h2 id="as-entra" className={a.h2}>O que entra</h2>
            <ul className={a.itens}>
              {ITENS.map((i) => (
                <li key={i.titulo} className={a.item}>
                  <span className={a.itemRotulo}>{i.titulo}</span>
                  <p className={a.itemTexto}>{i.texto}</p>
                </li>
              ))}
              <li className={`${a.item} ${a.itemDestaque}`}>
                <span className={a.itemRotulo}>No anual: o Manual do seu Mapa</span>
                <p className={a.itemTexto}>Liberado junto com a assinatura.</p>
              </li>
            </ul>
          </section>
        </div>

        <form className={a.form} onSubmit={assinar} aria-labelledby="as-planos">
          <h2 id="as-planos" className={a.h2}>Escolha o plano</h2>
          <div role="radiogroup" aria-label="Plano" className={a.planos}>
            <button type="button" role="radio" aria-checked={plano === 'anual'} className={`${a.plano} ${plano === 'anual' ? a.planoOn : ''}`} onClick={() => setPlano('anual')}>
              <span className={a.selo}>Melhor custo-benefício</span>
              <span className={a.planoNome}>Anual</span>
              {cortesia ? (
                <>
                  <span className={a.planoPreco}>{porMes}<small>/mês</small></span>
                  <p className={a.planoLinha}>Continue com tudo por {porMes}/mês: {brl(PRECO_ASSINATURA_ANUAL)} por ano.</p>
                  <p className={a.planoEconomia}>Você economiza {brl(ECONOMIA_SEM_MANUAL)} em relação a 12 meses do mensal</p>
                </>
              ) : (
                <>
                  <span className={a.planoPreco}>{brl(PRECO_ASSINATURA_ANUAL)}<small>/ano</small></span>
                  <p className={a.planoLinha}>Equivale a {porMes}/mês · inclui o Manual do seu Mapa (valor: {brl(PRECO_MANUAL_PADRAO)})</p>
                  <p className={a.planoEconomia}>Você economiza {brl(ECONOMIA_COM_MANUAL)} em relação a 12 meses do mensal + Manual</p>
                </>
              )}
            </button>
            <button type="button" role="radio" aria-checked={plano === 'mensal'} className={`${a.plano} ${plano === 'mensal' ? a.planoOn : ''}`} onClick={() => setPlano('mensal')}>
              <span className={a.planoNome}>Mensal</span>
              <span className={a.planoPreco}>{brl(PRECO_ASSINATURA_MENSAL)}<small>/mês</small></span>
              <p className={a.planoLinha}>Sem fidelidade.</p>
            </button>
          </div>

          <span className={a.rotulo}>Forma de pagamento</span>
          <div role="radiogroup" aria-label="Forma de pagamento" className={a.metodos}>
            {(plano === 'mensal' ? ['recorrente', 'prepago'] : ['prepago', 'recorrente']).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={metodo === m} className={`${a.metodo} ${metodo === m ? a.metodoOn : ''}`} onClick={() => setMetodo(m)}>
                <span className={a.bolinha} aria-hidden="true" />
                {m === 'prepago' ? (
                  <span className={a.metodoTexto}>
                    <span className={a.metodoNome}>Pix ou cartão à vista {plano === 'anual' && <span className={a.pix}>Pix: liberado na hora</span>}</span>
                    <span className={a.metodoSub}>
                      {plano === 'anual'
                        ? 'Paga 1 ano agora; avisamos antes de vencer. Sem renovação automática.'
                        : 'Pix: você renova manualmente todo mês. Avisamos antes de vencer.'}
                    </span>
                  </span>
                ) : (
                  <span className={a.metodoTexto}>
                    <span className={a.metodoNome}>Cartão, renova sozinho</span>
                    <span className={a.metodoSub}>Cobra {plano === 'anual' ? 'todo ano' : 'todo mês'}; cancele quando quiser.</span>
                  </span>
                )}
              </button>
            ))}
          </div>
          {metodo === 'recorrente' && (
            <p className={a.mudo}>No Mercado Pago, entre com a conta do mesmo e-mail da sua assinatura.</p>
          )}

          {precisaEmail && (
            <>
              <label htmlFor="as-email" className={a.rotulo}>Seu e-mail (é por ele que liberamos o acesso)</label>
              <input id="as-email" className={a.campo} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
              {sugestao && <button type="button" className={a.link} onClick={() => setEmail(sugestao)}>Você quis dizer {sugestao}?</button>}
            </>
          )}

          {erro && <p className={a.erro}>{erro}</p>}
          <button type="submit" className={`${ma.btn} ${a.botao}`} disabled={enviando}>
            {enviando ? 'Abrindo o pagamento…' : `Assinar por ${precoBotao}`}
          </button>
          {/* Visitante sem perfil e sem sessão: o teste de 7 dias da Minha Área (mesma
              chave que decide o teste no cadastro, lib/testeSeuDia.js). */}
          {TESTE_SEU_DIA_ATIVO && semSessao && !perfilLocal && (
            <a className={a.teste} href="/seu-dia" onClick={() => evento('assinar_teste_click')}>ou teste 7 dias grátis, sem cartão</a>
          )}
          <p className={a.garantia}>
            <strong>Garantia de 7 dias:</strong> desistiu em até 7 dias, devolvemos o valor pago, pelo mesmo meio de pagamento. É só escrever pra conceptintuitive@gmail.com. Pagamento pelo Mercado Pago.
          </p>
        </form>

        <section className={a.secao} aria-labelledby="as-duvidas" style={{ borderBottom: 0 }}>
          <h2 id="as-duvidas" className={a.h2}>Dúvidas rápidas</h2>
          <div className={a.duvidas}>
            <div className={a.duvida}>
              <h3>Como cancelar?</h3>
              <p>No cartão: em Minha Área → Conta → Cancelar renovação, ou pelo e-mail de contato. O acesso continua até o fim do período já pago. No Pix não há cobrança automática: avisamos 3 dias antes de vencer e, se não renovar, você volta pro grátis.</p>
            </div>
            <div className={a.duvida}>
              <h3>Já comprei o Manual.</h3>
              <p>Você ganhou 30 dias do Intuitive Completo, sem cobrança e sem renovação automática. O Manual continua seu pra sempre.</p>
            </div>
            <div className={a.duvida}>
              <h3>Uso em qual aparelho?</h3>
              <p>Em qualquer um: o acesso é pelo seu e-mail.</p>
            </div>
            <div className={a.duvida}>
              <h3>E se o preço mudar?</h3>
              <p>Avisamos por e-mail com pelo menos 30 dias de antecedência. Um período já pago nunca muda.</p>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
