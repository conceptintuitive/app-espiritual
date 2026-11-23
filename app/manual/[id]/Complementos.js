'use client';

// Complementos do Manual: Projeção dos Próximos 12 Meses e Mapa de Human
// Design (compra via /api/criar-checkout-upsell-mp; PRECO_BONUS_AVULSO cada,
// PRECO_BONUS_COMBO os dois). Lógica, preços e checkout iguais aos de antes;
// só saiu do page.js pra lib/transitos12meses.js e lib/humanDesign*.js
// carregarem depois (next/dynamic) em vez de no JS inicial do Manual.

import { useState } from 'react';
import { gerarProjecao12Meses } from '@/lib/transitos12meses';
import { calcularHumanDesign, CENTRO_NOME_AMIGAVEL } from '@/lib/humanDesign';
import { TIPO_DESCRICAO, AUTORIDADE_DESCRICAO, narracaoHumanDesign, gerarIntegracaoHumanDesign } from '@/lib/humanDesignTextos';
import { PRECO_BONUS_AVULSO, PRECO_BONUS_COMBO } from '@/lib/preco';
import { offsetSalvo } from '@/lib/sky';
import { CheckItem, ListenButton, buildProjecaoMesNarration } from './pecas';
import m from './manual.module.css';

// TOGGLE DE COMBO — oferece incluir o outro upsell junto, por
// PRECO_BONUS_COMBO no total em vez de PRECO_BONUS_AVULSO cada. Só aparece
// se o outro produto ainda não tiver sido comprado.
function ComboUpsellToggle({ label, checked, onChange }) {
  return (
    <label className={`${m.combo} ${checked ? m.comboOn : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        Incluir também {label}: os dois por <strong>R$ {PRECO_BONUS_COMBO}</strong> (economize R$ {(PRECO_BONUS_AVULSO * 2 - PRECO_BONUS_COMBO).toFixed(0)})
      </span>
    </label>
  );
}

/** @param {{ row: object, id: string, checks: Record<string, boolean>, toggleCheck: (k: string) => void }} props */
export default function Complementos({ row, id, checks, toggleCheck }) {
  // HANDLER: CHECKOUT DOS UPSELLS (Projeção de 12 Meses e/ou Human Design —
  // PRECO_BONUS_AVULSO cada, PRECO_BONUS_COMBO os dois juntos, via MP)
  const [processandoUpsell, setProcessandoUpsell] = useState(false);
  const [comboProjecao, setComboProjecao] = useState(false);
  const [comboHumanDesign, setComboHumanDesign] = useState(false);

  async function handleComprarUpsell(produtoPrincipal, incluirCombo) {
    const produtos = incluirCombo
      ? ['projecao12m', 'humandesign']
      : [produtoPrincipal];
    setProcessandoUpsell(true);
    try {
      const response = await fetch('/api/criar-checkout-upsell-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: id, produtos }),
      });
      const data = await response.json().catch(() => ({}));
      const checkoutUrl = data?.url || data?.sandbox_url;
      if (checkoutUrl) { window.location.href = checkoutUrl; return; }
      throw new Error(data?.error || 'Erro ao criar checkout');
    } catch (e) {
      console.error('Erro ao abrir checkout do upsell:', e);
      alert(e?.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessandoUpsell(false);
    }
  }

  const hd = calcularHumanDesign(row.data_nascimento, row.hora_nascimento, offsetSalvo(row) ?? -3);
  const tipoInfo = hd ? TIPO_DESCRICAO[hd.tipo] : null;
  const autoridadeInfo = hd ? AUTORIDADE_DESCRICAO[hd.autoridade] : null;
  const integracao = hd ? gerarIntegracaoHumanDesign({
    tipo: hd.tipo,
    signo: row.signo,
    numeroVida: row.numero_vida,
    objetivoPrincipal: row.objetivo_principal,
  }) : null;

  return (
    <>
      {/* ========== PROJEÇÃO DE 12 MESES ========== */}
      <section className={m.secao} id="projecao-12-meses">
        {row.tier2_payment_status === 'paid' && <span className={m.selo}>Complemento liberado</span>}
        <span className={m.rotulo}>Complemento</span>
        <h2 className={m.h2}>Projeção dos próximos 12 meses</h2>

        {row.tier2_payment_status === 'paid' ? (
          <>
            <p className={m.p}>
              Seu Ano Pessoal e Mês Pessoal, mês a mês, a partir de agora — com o que cada
              ciclo favorece, o que pede cuidado, e espaço pra marcar o que já foi vivido.
            </p>
            {gerarProjecao12Meses(row.data_nascimento).map((mes, i) => {
              const ck = `tier2_mes_${mes.ano}_${mes.mes}`;
              return (
                <div key={`${mes.ano}-${mes.mes}`} className={m.bloco}>
                  <div className={m.blocoTopo}>
                    <div>
                      <span className={m.rotulo}>{mes.label}{i === 0 ? ' · mês atual' : ''}</span>
                      <p className={m.h3}>{mes.titulo} <span className={m.apagado}>· Mês Pessoal {mes.mesPessoal}</span></p>
                    </div>
                    <ListenButton text={buildProjecaoMesNarration(mes)} label="Ouvir" pauseLabel="Pausar" />
                  </div>
                  <p className={m.p}>{mes.texto}</p>
                  <div className={m.duasListas}>
                    <div>
                      <span className={m.rotuloOuro}>O que favorece</span>
                      <ul className={m.lista}>{mes.foco.map((f, fi) => <li key={fi}>{f}</li>)}</ul>
                    </div>
                    <div>
                      <span className={m.rotuloAlerta}>Cuidado com</span>
                      <ul className={m.lista}>{mes.atencao.map((a, ai) => <li key={ai}>{a}</li>)}</ul>
                    </div>
                  </div>
                  <ul className={m.checks}>
                    <CheckItem itemKey={ck} checked={!!checks[ck]} onToggle={toggleCheck}>Já vivenciei este mês</CheckItem>
                  </ul>
                </div>
              );
            })}
          </>
        ) : (
          <div className={m.oferta}>
            <p className={m.p}>
              Além do seu Manual, dá pra saber o que cada um dos próximos 12 meses
              pede de você — mês a mês, com o Ano Pessoal e o Mês Pessoal calculados a partir
              da sua data de nascimento.
            </p>
            <ul className={m.lista}>
              <li>12 meses, um por um, a partir de hoje</li>
              <li>Vira o ano com você — sem &quot;esquecer&quot; de recalcular</li>
              <li>Tema prático de cada mês (o que favorece, o que evitar)</li>
            </ul>
            {row.hd_payment_status !== 'paid' && (
              <ComboUpsellToggle label="o Mapa de Human Design" checked={comboProjecao} onChange={setComboProjecao} />
            )}
            <button className={m.btn} onClick={() => handleComprarUpsell('projecao12m', comboProjecao)} disabled={processandoUpsell}>
              {processandoUpsell
                ? 'Abrindo…'
                : comboProjecao
                ? `Desbloquear os dois — R$ ${PRECO_BONUS_COMBO}`
                : `Desbloquear a Projeção de 12 meses — R$ ${PRECO_BONUS_AVULSO}`}
            </button>
          </div>
        )}
      </section>

      {/* ========== MAPA DE HUMAN DESIGN ========== */}
      {hd && (
        <section className={m.secao} id="human-design">
          {row.hd_payment_status === 'paid' && <span className={m.selo}>Complemento liberado</span>}
          <span className={m.rotulo}>Complemento</span>
          <h2 className={m.h2}>Mapa de Human Design</h2>

          {row.hd_payment_status === 'paid' ? (
            <div className={m.bloco}>
              <div className={m.blocoTopo}>
                <div>
                  <span className={m.rotulo}>Tipo · Autoridade · Perfil</span>
                  <p className={m.h3}>{tipoInfo?.titulo ?? hd.tipo} <span className={m.apagado}>· Perfil {hd.perfil}</span></p>
                </div>
                <ListenButton text={narracaoHumanDesign(hd)} label="Ouvir" pauseLabel="Pausar" />
              </div>

              <p className={m.p}>{tipoInfo?.texto}</p>
              <span className={m.rotuloOuro}>Como agir</span>
              <p className={m.p}>{tipoInfo?.comoAgir}</p>

              <p className={m.p}><strong>Autoridade: {autoridadeInfo?.titulo ?? hd.autoridade}.</strong> {autoridadeInfo?.texto}</p>
              <span className={m.rotuloOuro}>Como decidir</span>
              <p className={m.p}>{autoridadeInfo?.comoAgir}</p>

              <div className={m.duasListas}>
                <div>
                  <span className={m.rotuloOuro}>Centros definidos</span>
                  <ul className={m.lista}>
                    {hd.centrosDefinidos.length
                      ? hd.centrosDefinidos.map((c) => <li key={c}>{CENTRO_NOME_AMIGAVEL[c]}</li>)
                      : <li>Nenhum — mapa de Refletor</li>}
                  </ul>
                </div>
                <div>
                  <span className={m.rotulo}>Centros abertos</span>
                  <ul className={m.lista}>{hd.centrosIndefinidos.map((c) => <li key={c}>{CENTRO_NOME_AMIGAVEL[c]}</li>)}</ul>
                </div>
              </div>

              {hd.canaisDefinidos.length > 0 && (
                <>
                  <span className={m.rotulo}>Canais definidos</span>
                  <p className={m.p}>{hd.canaisDefinidos.map((c) => `${c[0]}-${c[1]}`).join(' · ')}</p>
                </>
              )}

              {integracao?.textoIntegracao && (
                <>
                  <span className={m.rotuloOuro}>Seu Human Design + seu mapa</span>
                  <p className={m.p}>{integracao.textoIntegracao}</p>
                </>
              )}

              {integracao?.planoAcao?.length > 0 && (
                <>
                  <span className={m.rotuloOuro}>Pra {row.objetivo_principal}</span>
                  <ul className={m.lista}>{integracao.planoAcao.map((a, ai) => <li key={ai}>{a}</li>)}</ul>
                </>
              )}

              <p className={m.nota}>{hd.avisoPrecisao}</p>
            </div>
          ) : (
            <div className={m.oferta}>
              <p className={m.p}>
                Além do seu Mapa numerológico e astrológico, existe um outro sistema —
                o Human Design — que cruza sua data, hora e local de nascimento pra revelar como
                sua energia funciona de verdade: seu Tipo, sua Autoridade (como tomar decisões
                certas) e seu Perfil.
              </p>
              <ul className={m.lista}>
                <li>Seu Tipo energético (Gerador, Manifestador, Projetor...)</li>
                <li>Sua Autoridade — a forma mais confiável de decidir</li>
                <li>Seu Perfil e os centros definidos do seu mapa</li>
              </ul>
              {row.tier2_payment_status !== 'paid' && (
                <ComboUpsellToggle label="a Projeção de 12 Meses" checked={comboHumanDesign} onChange={setComboHumanDesign} />
              )}
              <button className={m.btn} onClick={() => handleComprarUpsell('humandesign', comboHumanDesign)} disabled={processandoUpsell}>
                {processandoUpsell
                  ? 'Abrindo…'
                  : comboHumanDesign
                  ? `Desbloquear os dois — R$ ${PRECO_BONUS_COMBO}`
                  : `Desbloquear o Human Design — R$ ${PRECO_BONUS_AVULSO}`}
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
