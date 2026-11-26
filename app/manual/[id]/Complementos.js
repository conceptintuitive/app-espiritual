'use client';

// Complementos do Manual: Projeção dos Próximos 12 Meses e Mapa de Human
// Design. Desde nov/2026 não são vendidos avulsos: abrem pra quem comprou
// antes (tier2/hd_payment_status) ou tem acesso do Intuitive Completo (os 30
// dias de cortesia do Manual ou a assinatura, vindo de useAssinatura no
// page.js). Fora disso, o botão leva pro /assinar. Fica num arquivo próprio
// pra lib/transitos12meses.js e lib/humanDesign*.js carregarem depois
// (next/dynamic), não no JS inicial do Manual.

import { gerarProjecao12Meses } from '@/lib/transitos12meses';
import { calcularHumanDesign, CENTRO_NOME_AMIGAVEL } from '@/lib/humanDesign';
import { TIPO_DESCRICAO, AUTORIDADE_DESCRICAO, narracaoHumanDesign, gerarIntegracaoHumanDesign } from '@/lib/humanDesignTextos';
import { PRECO_ASSINATURA_MENSAL } from '@/lib/preco';
import { offsetSalvo } from '@/lib/sky';
import { CheckItem, ListenButton, buildProjecaoMesNarration } from './pecas';
import m from './manual.module.css';

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataCurta = (iso) => { try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }); } catch { return ''; } };

// Selo do topo da seção: comprado antes, ou incluso no Intuitive Completo.
function Selo({ comprado, acesso }) {
  if (comprado) return <span className={m.selo}>Complemento liberado</span>;
  if (!acesso?.ativa) return null;
  const ate = acesso.origem === 'manual' && acesso.acessoAte ? ` até ${dataCurta(acesso.acessoAte)}` : '';
  return <span className={m.selo}>Incluso no Intuitive Completo{ate}</span>;
}

// Sem acesso: a cortesia do Manual acabou (quem chega ao Manual pagou).
function Continuar({ id, origem }) {
  return (
    <>
      <a
        className={m.btn}
        href={`/assinar?a=${encodeURIComponent(id)}&plano=mensal`}
        onClick={() => { try { window.gtag?.('event', 'assinar_click', { event_category: 'assinatura', origem, plano: 'mensal' }); } catch {} }}
      >
        Continuar com o Intuitive Completo · {brl(PRECO_ASSINATURA_MENSAL)}/mês
      </a>
      <p className={m.nota}>
        Os 30 dias do Intuitive Completo que vieram com o seu Manual terminaram. O Manual continua seu pra sempre.{' '}
        <a className={m.linkMono} href="/planos">Compare as opções</a>
      </p>
    </>
  );
}

/** @param {{ row: object, id: string, checks: Record<string, boolean>, toggleCheck: (k: string) => void, acesso?: object|null }} props */
export default function Complementos({ row, id, checks, toggleCheck, acesso = null }) {
  const projecaoComprada = row.tier2_payment_status === 'paid';
  const hdComprado = row.hd_payment_status === 'paid';
  const projecaoAberta = projecaoComprada || !!acesso?.ativa;
  const hdAberto = hdComprado || !!acesso?.ativa;
  const carregando = acesso === null; // enquanto o status não volta, não mostra o paywall

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
        <Selo comprado={projecaoComprada} acesso={acesso} />
        <span className={m.rotulo}>Complemento</span>
        <h2 className={m.h2}>Projeção dos próximos 12 meses</h2>

        {projecaoAberta ? (
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
            {!carregando && <Continuar id={id} origem="manual_projecao" />}
          </div>
        )}
      </section>

      {/* ========== MAPA DE HUMAN DESIGN ========== */}
      {hd && (
        <section className={m.secao} id="human-design">
          <Selo comprado={hdComprado} acesso={acesso} />
          <span className={m.rotulo}>Complemento</span>
          <h2 className={m.h2}>Mapa de Human Design</h2>

          {hdAberto ? (
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
              {!carregando && <Continuar id={id} origem="manual_hd" />}
            </div>
          )}
        </section>
      )}
    </>
  );
}
