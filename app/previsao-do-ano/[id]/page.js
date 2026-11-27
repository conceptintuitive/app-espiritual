'use client';

// Previsão do Ano no visual da Minha Área (nov/2026): o Ano Pessoal no topo
// (com a ligação com o mapa, quando faz sentido), os 12 meses com o contexto
// do ano, divisor na virada de ano, mês atual destacado e mês do aniversário
// marcado. Textos e regras em lib/transitos12meses.js. Grátis: o Ano Pessoal,
// o mês atual inteiro e o tema dos 2 seguintes; o resto com o Intuitive
// Completo (ou quem comprou a Previsão antes).

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { gerarProjecao12Meses, ANO_TEMA } from '@/lib/transitos12meses';
import SiteNav from '@/app/components/SiteNav';
import FaixaCeu from '@/app/seu-dia/FaixaCeu';
import { useAssinatura, OfertaComplemento } from '@/app/components/assinatura';
import ma from '@/app/seu-dia/minhaArea.module.css';
import s from './previsao.module.css';

const LigacaoMapa = dynamic(() => import('./LigacaoMapa'), { ssr: false });

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function primeiroNome(nome) {
  return String(nome ?? '').trim().split(' ').filter(Boolean)[0] || 'Você';
}

/** Nascimento da análise no formato do perfil (FaixaCeu e mapaSintese). */
function dadosDaAnalise(a) {
  if (!a?.data_nascimento) return null;
  const temCidade = a.fuso_iana && typeof a.latitude === 'number' && typeof a.longitude === 'number';
  const [cidadeNome, uf] = String(a.local_nascimento || '').split(',').map((x) => x.trim());
  return {
    dataNascimento: a.data_nascimento,
    hora: /^\d{2}:\d{2}/.test(a.hora_nascimento || '') ? a.hora_nascimento.slice(0, 5) : null,
    cidade: temCidade ? { ibge: a.municipio_ibge ?? null, nome: cidadeNome || '', uf: uf || '', lat: a.latitude, lon: a.longitude, tz: a.fuso_iana } : null,
  };
}

function Mes({ m, atual }) {
  return (
    <article className={`${s.mes} ${atual ? s.mesAtual : ''}`} aria-label={m.label}>
      <div className={s.mesTopo}>
        <span className={s.mesData}>{m.label}</span>
        {atual && <span className={s.selo}>Este mês</span>}
        {m.aniversario && <span className={s.seloAniv}>Mês do seu aniversário</span>}
      </div>
      <h3 className={s.mesTitulo}>{m.titulo}<span>Mês Pessoal {m.mesPessoal}</span></h3>
      <p className={s.texto}>{m.texto}</p>
      {m.contexto && <p className={s.contexto}>{m.contexto}</p>}
      {m.retorno && <p className={s.retorno}>{m.retorno}</p>}
      <div className={s.listas}>
        <div className={s.lado}>
          <span className={s.rotuloOuro}>O que favorece</span>
          <ul className={s.lista}>{m.foco.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
        <div className={s.lado}>
          <span className={s.rotuloCuidado}>Cuidado com</span>
          <ul className={`${s.lista} ${s.listaCuidado}`}>{m.atencao.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      </div>
    </article>
  );
}

function Virada({ m }) {
  const t = ANO_TEMA[m.anoPessoal];
  return (
    <section className={s.virada} aria-label={`${m.ano}, Ano Pessoal ${m.anoPessoal}`}>
      <span className={s.viradaRotulo}>{m.ano} · Ano Pessoal {m.anoPessoal}</span>
      {t && <h2 className={s.viradaTitulo}>{t.titulo}</h2>}
      {t && <p className={s.viradaTexto}>{t.texto}</p>}
    </section>
  );
}

export default function PrevisaoDoAnoPage() {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const assinatura = useAssinatura(id);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !id) { setErro(true); setLoading(false); return; }
    supabase
      .from('analises')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setErro(true); else setRow(data);
        setLoading(false);
      });
  }, [id]);

  const dados = useMemo(() => dadosDaAnalise(row), [row]);
  const projecao = useMemo(() => (row?.data_nascimento ? gerarProjecao12Meses(row.data_nascimento) : []), [row]);
  const primeiro = projecao[0];
  const anoAtual = primeiro ? ANO_TEMA[primeiro.anoPessoal] : null;
  const desbloqueado = row?.tier2_payment_status === 'paid' || !!assinatura?.ativa;

  return (
    <div className={`${ma.ma} ${s.pagina}`}>
      <SiteNav active="previsao" transparente />
      <FaixaCeu perfil={dados} eyebrow="Previsão do Ano" titulo="Seus próximos 12 meses" />

      <main className={s.corpo}>
        {loading && <p className={s.estado}>Carregando…</p>}

        {!loading && (erro || !row) && (
          <div className={s.estado}>
            <p>Não encontramos essa análise. Comece pelo seu mapa grátis.</p>
            <Link href="/?quiz=1" className={`${ma.btn} ${ma.btnLink}`}>Fazer meu mapa grátis</Link>
          </div>
        )}

        {!loading && row && !row.data_nascimento && (
          <p className={s.estado}>Essa análise ainda não tem data de nascimento salva. Volte pro formulário e termine o seu mapa.</p>
        )}

        {primeiro && (
          <>
            <section className={s.ano} aria-labelledby="ano-pessoal">
              <span className={ma.eyebrow}>{primeiro.ano} · Ano Pessoal {primeiro.anoPessoal}</span>
              {anoAtual && <h2 id="ano-pessoal" className={s.anoTitulo}>{anoAtual.titulo}</h2>}
              {anoAtual && <p className={s.anoTexto}>{anoAtual.texto}</p>}
              {dados && <LigacaoMapa dados={dados} anoPessoal={primeiro.anoPessoal} className={s.ligacao} />}
            </section>

            {desbloqueado ? (
              projecao.map((m, i) => (
                <div key={`${m.ano}-${m.mes}`}>
                  {m.novoAno && <Virada m={m} />}
                  <Mes m={m} atual={i === 0} />
                </div>
              ))
            ) : (
              <>
                {/* Grátis: o mês atual inteiro + o tema dos 2 seguintes */}
                <Mes m={primeiro} atual />
                <div className={s.proximos}>
                  {projecao.slice(1, 3).map((m) => (
                    <div key={`${m.ano}-${m.mes}`} className={s.proximo}>
                      <span className={s.mesData}>{m.label}{m.novoAno ? ` · Ano Pessoal ${m.anoPessoal}` : ''}</span>
                      <span className={s.proximoTitulo}>{m.titulo}</span>
                      <span className={s.proximoNumero}>Mês Pessoal {m.mesPessoal}{m.aniversario ? ' · mês do seu aniversário' : ''}</span>
                    </div>
                  ))}
                </div>
                <div className={s.oferta}>
                  <h2 className={s.ofertaTitulo}>O que vem nos próximos meses</h2>
                  <p className={s.ofertaTexto}>
                    {primeiroNome(row.nome)}, esse foi o seu mês atual. Desbloqueie pra ver o texto completo, o que favorece e o que pede cuidado em cada um dos próximos 12 meses.
                  </p>
                  <OfertaComplemento analiseId={id} manualPago={row.payment_status === 'paid'} produto="A Previsão do Ano" origem="previsao" />
                </div>
              </>
            )}
          </>
        )}

        <p className={s.rodape}><a href="/explorar">← Voltar pro Explorar</a></p>
      </main>
    </div>
  );
}
