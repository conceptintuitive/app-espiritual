'use client';

// /seu-dia — o app diário (fase 1: grátis + 7 dias de Completo + lista de espera).
// A leitura é calculada no navegador (lib/seuDia.js, sem IA); o servidor só
// guarda perfil, visitas, lista de espera e inscrições de aviso.
// Estados: carregando → entrar (sem sessão) → dados (sem nascimento) →
// confirmar ("Esta é você?", perfil ainda não confirmado) → app.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import CidadeAutocomplete from '@/app/components/CidadeAutocomplete';
import { montarPerfil, leituraDoDia, proximosDias, hojeNoFuso, somarDias } from '@/lib/seuDia';
import { emailValido, sugestaoEmail } from '@/lib/emailValidacao';
import { oAnimal } from '@/lib/seuDiaTextos';
import { PRECO_ASSINATURA_ANUAL, PRECO_ASSINATURA_MENSAL } from '@/lib/preco';
import { kinDaData, nomeDoKin, seloDoKin, tomDoKin, relacaoDoDia } from '@/lib/kin';
import { TEXTO_SELO, TEXTO_TOM, TEXTO_RELACAO_DIA } from '@/lib/kinTextos';
import { calcularAnjos, dadosDoAnjo, anjoPorLongitude } from '@/lib/anjos';
import { TEXTO_ANJO } from '@/lib/anjosTextos';
import { longitudeSolar } from '@/lib/bazi';
import { salvarPerfil, lerPerfil } from '@/lib/perfilLocal';
import AbaMapa from './AbaMapa';
import AbaInicio, { TituloDoDia } from './AbaInicio';
import FaixaCeu from './FaixaCeu';
import TelaConfirmar from './TelaConfirmar';
import { precisaConfirmar, marcaConfirmacao } from '@/lib/minhaArea';
import ma from './minhaArea.module.css';

// "Esta é você?": a confirmação também fica no aparelho (migração 0021 opcional).
const CHAVE_CONFIRMADO = 'ic_perfil_confirmado';
function lerConfirmadoLocal() {
  try { return window.localStorage.getItem(CHAVE_CONFIRMADO); } catch { return null; }
}
function gravarConfirmadoLocal(perfil) {
  try { window.localStorage.setItem(CHAVE_CONFIRMADO, marcaConfirmacao(perfil)); } catch {}
}
function estadoDoPerfil(p) {
  if (p.precisaDados) return 'dados';
  return precisaConfirmar(p, lerConfirmadoLocal()) ? 'confirmar' : 'app';
}

const TOM = {
  fluxo: { rotulo: 'Dia a favor', classe: 'sd-tom-fluxo' },
  misto: { rotulo: 'Dia misto', classe: 'sd-tom-misto' },
  tensao: { rotulo: 'Dia de atenção', classe: 'sd-tom-tensao' },
};

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'seu_dia', ...params }); } catch {}
}

// Camadas extras do Completo (só exibição, não votam no tema/tom do dia):
// Kin Maia do dia cruzado com o da pessoa e o anjo do quinário do Sol.
function camadasExtras(perfil, dataISO) {
  try {
    const [y, m, d] = dataISO.split('-').map(Number);
    const kinPessoa = kinDaData(perfil.dataNascimento, perfil.hora);
    const kinDia = kinDaData(dataISO);
    const anjos = calcularAnjos({ data: perfil.dataNascimento, hora: perfil.hora, tz: perfil.cidade?.tz || 'America/Sao_Paulo' });
    return {
      kinPessoa,
      kinDia,
      relacao: relacaoDoDia(kinPessoa, kinDia),
      anjoDia: anjoPorLongitude(longitudeSolar(Date.UTC(y, m - 1, d, 15))),
      guardiao: anjos.guardiao,
      mente: anjos.mente,
    };
  } catch {
    return null;
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let json = null;
  try { json = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, json };
}

export default function SeuDiaClient() {
  const [estado, setEstado] = useState('carregando');
  const [perfil, setPerfil] = useState(null);
  const [erroLink, setErroLink] = useState(false);

  function carregarPerfil(vivo = () => true) {
    api('/api/seu-dia/perfil').then(({ ok, json }) => {
      if (!vivo()) return;
      if (!ok || !json?.perfil) { setEstado('entrar'); return; }
      setPerfil(json.perfil);
      setEstado(estadoDoPerfil(json.perfil));
    }).catch(() => vivo() && setEstado('entrar'));
  }

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('erro') === 'link') setErroLink(true);
    } catch {}
    let vivo = true;
    carregarPerfil(() => vivo);
    return () => { vivo = false; };
  }, []);


  return (
    <div className="sd-wrap">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@400;500;600&family=Noto+Serif+SC:wght@600&display=swap"
        rel="stylesheet"
      />
      <SiteNav active="seu-dia" transparente />

      {estado === 'carregando' && <div className="sd-centro"><span className="sd-spinner" aria-label="Carregando" /></div>}
      {estado === 'entrar' && <TelaEntrar erroLink={erroLink} onEntrou={() => { setEstado('carregando'); carregarPerfil(); }} />}
      {estado === 'confirmar' && perfil && (
        <TelaConfirmar
          perfil={perfil}
          onConfirmar={async () => {
            gravarConfirmadoLocal(perfil);
            evento('sd_perfil_confirmado');
            await api('/api/seu-dia/perfil/confirmar', { method: 'POST' }).catch(() => null);
            setEstado('app');
          }}
          onCorrigir={() => { evento('sd_perfil_corrigir'); setEstado('dados'); }}
        />
      )}
      {estado === 'dados' && (
        <TelaDados
          perfil={perfil}
          // Salvar os próprios dados também confirma o perfil (servidor + aparelho).
          onSalvo={(p) => { gravarConfirmadoLocal(p); setPerfil(p); setEstado('app'); }}
          onCancelar={perfil?.precisaDados ? null : () => setEstado(estadoDoPerfil(perfil))}
        />
      )}
      {estado === 'app' && perfil && (
        <AppSeuDia
          perfil={perfil}
          setPerfil={setPerfil}
          onEditar={() => setEstado('dados')}
          onSair={async () => { await api('/api/seu-dia/sair', { method: 'POST' }); setPerfil(null); setEstado('entrar'); }}
        />
      )}

      <style jsx global>{CSS}</style>
    </div>
  );
}

// ── Entrar ───────────────────────────────────────────────────────────────────

function TelaEntrar({ erroLink, onEntrou }) {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [etapa, setEtapa] = useState('email'); // email → codigo (ou link, sem a migração 0019)
  const [codigo, setCodigo] = useState('');
  const [conferindo, setConferindo] = useState(false);
  const [erro, setErro] = useState('');
  const [podeReenviar, setPodeReenviar] = useState(false);
  const sugestao = sugestaoEmail(email);

  useEffect(() => {
    if (etapa !== 'codigo') return;
    const t = setTimeout(() => setPodeReenviar(true), 60000);
    return () => clearTimeout(t);
  }, [etapa]);

  async function enviar(e) {
    e?.preventDefault();
    setErro('');
    if (!emailValido(email)) { setErro('Confira o e-mail.'); return; }
    setEnviando(true);
    const { ok, json } = await api('/api/seu-dia/entrar', { method: 'POST', body: { email } });
    setEnviando(false);
    if (!ok) { setErro(json?.error || 'Não conseguimos enviar agora.'); return; }
    evento('sd_codigo_enviado', { com_codigo: json?.codigo !== false });
    setCodigo('');
    setPodeReenviar(false);
    setEtapa(json?.codigo === false ? 'link' : 'codigo');
  }

  async function conferir(valor) {
    const c = String(valor || '').replace(/\D/g, '');
    if (c.length !== 6 || conferindo) return;
    setErro('');
    setConferindo(true);
    const { ok, json } = await api('/api/seu-dia/codigo', { method: 'POST', body: { email, codigo: c } });
    setConferindo(false);
    if (!ok) { setErro(json?.error || 'Não deu certo. Tente de novo.'); setCodigo(''); return; }
    evento('sd_entrou', { via: 'codigo' });
    onEntrou();
  }

  return (
    <main className="sd-col">
      <header className="sd-hero-entrar">
        <span className="sd-eyebrow">INTUITIVE CONCEPT</span>
        <h1>Minha Área</h1>
        <p className="sd-lead">Seu mapa, seu dia e suas leituras num lugar só — feito pra você, não pro seu signo.</p>
      </header>

      <ul className="sd-lista-beneficios">
        <li><Icone nome="mapa" /> Seu mapa inteiro: signo, número, anjo, Kin, astrologia chinesa</li>
        <li><Icone nome="sol" /> O seu dia, todo dia, com o que fazer e evitar</li>
        <li><Icone nome="carta" /> Suas leituras compradas sempre à mão</li>
        <li><Icone nome="sino" /> Um aviso às 7h, sem precisar abrir nada</li>
      </ul>

      {erroLink && etapa === 'email' && <p className="sd-aviso">Esse link venceu ou já não vale. Peça um código novo abaixo.</p>}

      {etapa === 'email' && (
        <form className="sd-card sd-form" onSubmit={enviar}>
          <label htmlFor="sd-email">Seu e-mail</label>
          <input id="sd-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
          {sugestao && (
            <button type="button" className="sd-link-btn" onClick={() => setEmail(sugestao)}>Você quis dizer {sugestao}?</button>
          )}
          {erro && <p className="sd-erro">{erro}</p>}
          <button type="submit" className="sd-btn" disabled={enviando}>{enviando ? 'Enviando…' : 'Entrar ou criar minha conta'}</button>
          <p className="sd-mudo sd-centro-texto">Sem senha: mandamos um código de 6 dígitos pro seu e-mail. Primeira vez? A conta é criada na hora.</p>
        </form>
      )}

      {etapa === 'codigo' && (
        <form className="sd-card sd-form" onSubmit={(e) => { e.preventDefault(); conferir(codigo); }}>
          <h2 className="sd-card-titulo">Digite o código</h2>
          <p className="sd-mudo">Mandamos 6 dígitos pra <strong>{email}</strong>. Vale por 15 minutos.</p>
          <input
            className="sd-codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={codigo}
            aria-label="Código de 6 dígitos"
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCodigo(v);
              if (v.length === 6) conferir(v);
            }}
            autoFocus
          />
          {erro && <p className="sd-erro">{erro}</p>}
          <button type="submit" className="sd-btn" disabled={conferindo || codigo.length !== 6}>{conferindo ? 'Conferindo…' : 'Entrar'}</button>
          <p className="sd-mudo">Não chegou? Olhe o spam ou promoções. O e-mail também traz um botão que entra direto.</p>
          <div className="sd-codigo-acoes">
            <button type="button" className="sd-link-btn" onClick={() => { setEtapa('email'); setErro(''); }}>Trocar e-mail</button>
            <button type="button" className="sd-link-btn" disabled={!podeReenviar || enviando} onClick={() => enviar()}>
              {podeReenviar ? 'Mandar outro código' : 'Mandar outro (em 1 min)'}
            </button>
          </div>
        </form>
      )}

      {etapa === 'link' && (
        <div className="sd-card sd-centro-texto">
          <h2>Confira seu e-mail</h2>
          <p>Mandamos um link pra <strong>{email}</strong>. Toque nele pra entrar — vale por 30 minutos.</p>
          <p className="sd-mudo">Não chegou? Olhe a caixa de spam ou promoções.</p>
          <button type="button" className="sd-btn-sec" onClick={() => setEtapa('email')}>Usar outro e-mail</button>
        </div>
      )}
    </main>
  );
}

// ── Dados de nascimento ──────────────────────────────────────────────────────

function TelaDados({ perfil, onSalvo, onCancelar }) {
  // Cadastro novo: usa a última análise do e-mail; sem ela, o perfil salvo neste aparelho.
  const [local] = useState(() => (perfil?.precisaDados && !perfil?.sugestao ? lerPerfil() : null));
  const base = perfil?.precisaDados ? (perfil?.sugestao || local) : perfil;
  const [nome, setNome] = useState(base?.nome || '');
  const [data, setData] = useState(base?.dataNascimento || '');
  const [hora, setHora] = useState(base?.hora || '');
  const [naoSei, setNaoSei] = useState(!!base && !base.hora && !!base.dataNascimento);
  const cidadeBase = perfil?.cidade || local?.cidade || null;
  const [cidade, setCidade] = useState(cidadeBase);
  const [cidadeTexto, setCidadeTexto] = useState(cidadeBase ? `${cidadeBase.nome}, ${cidadeBase.uf}` : '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) { setErro('Confira a data de nascimento.'); return; }
    if (!naoSei && !/^\d{2}:\d{2}$/.test(hora)) { setErro('Informe a hora ou marque "não sei a hora".'); return; }
    setSalvando(true);
    const { ok, json } = await api('/api/seu-dia/perfil', {
      method: 'POST',
      body: {
        nome,
        dataNascimento: data,
        hora: naoSei ? null : hora,
        cidade: cidade ? { ibge: cidade.ibge, nome: cidade.nome, uf: cidade.uf, lat: cidade.lat, lon: cidade.lon, tz: cidade.tz } : null,
      },
    });
    setSalvando(false);
    if (!ok) { setErro(json?.error || 'Não conseguimos salvar agora.'); return; }
    evento('sd_dados_salvos', { com_hora: !naoSei, com_cidade: !!cidade });
    onSalvo(json.perfil);
  }

  return (
    <main className="sd-col">
      <header className="sd-cabecalho">
        <span className="sd-eyebrow">{perfil?.precisaDados ? 'ÚLTIMO PASSO' : 'SEUS DADOS'}</span>
        <h1>Quando você nasceu?</h1>
        {perfil?.precisaDados && (perfil?.sugestao || local) && (
          <p className="sd-mudo">Preenchemos com os dados do seu mapa. Confira antes de seguir.</p>
        )}
      </header>
      <form className="sd-card sd-form" onSubmit={salvar}>
        <label htmlFor="sd-nome">Primeiro nome</label>
        <input id="sd-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" maxLength={60} />

        <label htmlFor="sd-data">Data de nascimento</label>
        <input id="sd-data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />

        <label htmlFor="sd-hora">Hora de nascimento <span className="sd-dica">(a do relógio, como na certidão)</span></label>
        <input id="sd-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={naoSei} />
        <label className="sd-check">
          <input type="checkbox" checked={naoSei} onChange={(e) => setNaoSei(e.target.checked)} /> Não sei a hora
        </label>

        <label htmlFor="sd-cidade">Cidade onde nasceu <span className="sd-dica">(pras horas certas)</span></label>
        <CidadeAutocomplete
          tema="quiz"
          value={cidadeTexto}
          placeholder="Ex: Vitória, ES"
          inputClassName="sd-input-cidade"
          onChangeText={(t) => { setCidadeTexto(t); setCidade(null); }}
          onSelect={(m) => { setCidade(m); setCidadeTexto(`${m.nome}, ${m.uf}`); }}
        />
        {!cidade && cidadeTexto && <p className="sd-mudo">Escolha a cidade na lista — sem ela, as horas ficam aproximadas.</p>}

        {erro && <p className="sd-erro">{erro}</p>}
        <button type="submit" className="sd-btn" disabled={salvando}>{salvando ? 'Salvando…' : perfil?.precisaDados ? 'Criar minha área' : 'Salvar'}</button>
        {onCancelar && <button type="button" className="sd-btn-sec" onClick={onCancelar}>Cancelar</button>}
      </form>
    </main>
  );
}

// ── O app ────────────────────────────────────────────────────────────────────

const ABAS = ['inicio', 'hoje', 'semana', 'mapa', 'conta'];
// Título da faixa com o céu no topo de cada aba (o Início tem o céu grande).
const TITULO_ABA = { hoje: 'Hoje', semana: 'Sua semana', mapa: 'Meu mapa', conta: 'Sua conta' };

function AppSeuDia({ perfil, setPerfil, onEditar, onSair }) {
  // ?aba=hoje (aviso das 7h) abre direto no dia; o padrão é o Início.
  const [aba, setAbaEstado] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('aba');
      return ABAS.includes(q) ? q : 'inicio';
    } catch { return 'inicio'; }
  });
  const setAba = (a) => { setAbaEstado(a); try { window.scrollTo(0, 0); } catch {} };
  const [modal, setModal] = useState(false);

  const tz = perfil.cidade?.tz || 'America/Sao_Paulo';
  const calc = useMemo(() => montarPerfil({
    dataNascimento: perfil.dataNascimento,
    hora: perfil.hora,
    tz,
    lon: typeof perfil.cidade?.lon === 'number' ? perfil.cidade.lon : null,
  }), [perfil.dataNascimento, perfil.hora, tz, perfil.cidade?.lon]);

  const [hoje] = useState(() => hojeNoFuso(tz));
  const leitura = useMemo(() => leituraDoDia(calc, hoje, { horas: true }), [calc, hoje]);
  const semana = useMemo(() => proximosDias(calc, hoje, 7), [calc, hoje]);
  const depois = useMemo(() => proximosDias(calc, somarDias(hoje, 7), 23), [calc, hoje]);

  useEffect(() => {
    api('/api/seu-dia/visita', { method: 'POST' });
    evento('sd_visita', { acesso: perfil.acesso });
    try { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js'); } catch {}
  }, [perfil.acesso]);

  // A conta do Seu Dia é da própria pessoa: vira o perfil deste aparelho (anjo, Kin, BaZi abrem com ele).
  useEffect(() => {
    salvarPerfil({ nome: perfil.nome, dataNascimento: perfil.dataNascimento, hora: perfil.hora || null, cidade: perfil.cidade || null });
  }, [perfil.nome, perfil.dataNascimento, perfil.hora, perfil.cidade]);

  const completo = perfil.acesso === 'completo';
  const abrirModal = (origem) => { evento('sd_desbloquear_click', { origem }); setModal(true); };

  const ROTULOS = [
    ['inicio', 'casa', 'Início'],
    ['hoje', 'sol', 'Hoje'],
    ['semana', 'calendario', 'Semana'],
    ['mapa', 'mapa', 'Mapa'],
    ['conta', 'ajustes', 'Conta'],
  ];
  const irPraAba = (k) => { setAba(k); if (k === 'mapa') evento('sd_aba_mapa'); };
  // Desktop (≥ 960px): abas em linha — no Início logo abaixo do céu, nas outras no topo.
  // No celular elas são a barra fixa de baixo (.sd-abas).
  const abasDesktop = (
    <nav className={ma.abas} aria-label="Seções da Minha Área">
      {ROTULOS.map(([k, , rotulo]) => (
        <button
          key={k}
          type="button"
          className={`${ma.aba} ${aba === k ? ma.abaOn : ''}`}
          aria-current={aba === k ? 'page' : undefined}
          onClick={() => irPraAba(k)}
        >
          {k === 'mapa' ? 'Meu mapa' : rotulo}
        </button>
      ))}
    </nav>
  );

  return (
    <>
      {aba === 'inicio' && (
        <main>
          <AbaInicio perfil={perfil} leitura={leitura} hoje={hoje} abas={abasDesktop} onIr={(a) => { setAba(a); evento('sd_inicio_ir', { aba: a }); }} />
        </main>
      )}
      {aba !== 'inicio' && (
      <div className={ma.ma}>
      <FaixaCeu perfil={perfil} eyebrow="Minha Área" titulo={TITULO_ABA[aba]} />
      {abasDesktop}
      <main className={ma.abaCorpo}>
        {aba === 'hoje' && (
          <AbaHoje perfil={perfil} leitura={leitura} completo={completo} onDesbloquear={() => abrirModal('hoje')} />
        )}
        {aba === 'semana' && (
          <AbaSemana semana={semana} depois={depois} completo={completo} onDesbloquear={() => abrirModal('semana')} />
        )}
        {aba === 'mapa' && <AbaMapa perfil={perfil} />}
        {aba === 'conta' && (
          <AbaAjustes perfil={perfil} onEditar={onEditar} onSair={onSair} onDesbloquear={() => abrirModal('conta')} />
        )}
      </main>
      </div>
      )}

      <nav className="sd-abas" aria-label="Minha Área">
        {ROTULOS.map(([k, icone, rotulo]) => (
          <button
            key={k}
            type="button"
            className={aba === k ? 'is-on' : ''}
            aria-current={aba === k ? 'page' : undefined}
            onClick={() => irPraAba(k)}
          >
            <Icone nome={icone} />{rotulo}
          </button>
        ))}
      </nav>

      {modal && (
        <ModalListaEspera onFechar={() => setModal(false)} />
      )}
    </>
  );
}

const dataBR = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');

function BannerAcesso({ perfil, onDesbloquear }) {
  if (perfil.motivoAcesso === 'assinatura') {
    return <p className={ma.linhaMono}>Intuitive Completo ativo até {dataBR(perfil.assinatura?.acessoAte)}.</p>;
  }
  if (perfil.motivoAcesso === 'manual') {
    return (
      <p className={ma.linhaMono}>
        Seu 1º mês do Completo é por conta do Manual, até {dataBR(perfil.assinatura?.acessoAte)}.{' '}
        <button type="button" onClick={onDesbloquear}>Continuar depois</button>
      </p>
    );
  }
  if (perfil.motivoAcesso === 'teste') {
    const dias = perfil.testeDiasRestantes || 1;
    return <p className={ma.linhaMono}>Teste do Seu Dia Completo: {dias === 1 ? 'último dia' : `faltam ${dias} dias`}.</p>;
  }
  return (
    <p className={ma.linhaMono}>
      Seu teste acabou — o resumo do dia segue grátis.{' '}
      <button type="button" onClick={onDesbloquear}>Quero o Completo</button>
    </p>
  );
}

function AbaHoje({ perfil, leitura, completo, onDesbloquear }) {
  const l = leitura;
  const tom = TOM[l.tom];
  const [copiado, setCopiado] = useState(false);
  const extras = useMemo(() => camadasExtras(perfil, l.data), [perfil, l.data]);

  async function compartilhar() {
    const texto = `Meu dia hoje: ${l.titulo}. ${l.frase}`;
    const url = 'https://intuitiveconcept.com.br/seu-dia?utm_source=share&utm_medium=seu_dia';
    evento('sd_compartilhar', { tema: l.tema });
    try {
      if (navigator.share) { await navigator.share({ title: 'Seu Dia', text: texto, url }); return; }
      await navigator.clipboard.writeText(`${texto}\n${url}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  }

  const travado = (
    <section className="sd-card sd-travado">
      <div className="sd-travado-topo">
        <h2 className="sd-card-titulo">No Seu Dia Completo</h2>
        <Icone nome="cadeado" />
      </div>
      <ul>
        <li>As 5 lentes do seu dia, uma por uma</li>
        <li>Suas horas de força e de atenção</li>
        <li>A semana e os próximos 30 dias</li>
        <li>Como o dia mexe com cada parte do seu mapa</li>
        <li>O Kin Maia e o anjo do dia, cruzados com os seus</li>
      </ul>
      <p className="sd-borrado" aria-hidden="true">{l.chinesa.texto} {l.numerologia.texto}</p>
      <button type="button" className="sd-btn" onClick={onDesbloquear}>Desbloquear Seu Dia Completo</button>
    </section>
  );

  return (
    <>
      <BannerAcesso perfil={perfil} onDesbloquear={onDesbloquear} />

      <div className={ma.duas}>
        <div className={ma.coluna}>
          <section className={ma.diaHero} aria-labelledby="sd-titulo-dia">
            <div className={ma.hojeTopo}>
              <span className={ma.eyebrow}>{`${l.rotulo.semana} · ${l.rotulo.dia} de ${l.rotulo.mes}`}</span>
              <span className={ma.pilula}>{tom.rotulo}</span>
            </div>
            <h2 id="sd-titulo-dia" className={ma.diaTitulo}><TituloDoDia texto={l.titulo} /></h2>
            <p className={ma.diaFrase}>{l.frase}</p>
            <div className={ma.sistemasLinha}>
              <div className={ma.barras} aria-hidden="true">
                {Array.from({ length: l.totalLentes }, (_, i) => <span key={i} className={i < l.concordam ? ma.barraOn : ''} />)}
              </div>
              <span className={ma.sistemasTexto}>{l.concordam} de {l.totalLentes} sistemas apontam pra {l.temaNome.toLowerCase()}</span>
            </div>
          </section>

          <div className={ma.faceEvite}>
            <div className={ma.faceCol}>
              <span className={ma.rotuloFaca}>Faça</span>
              {(completo ? l.faca : l.faca.slice(0, 1)).map((f) => <p key={f}>{f}</p>)}
            </div>
            <div className={ma.faceCol}>
              <span className={ma.rotuloEvite}>Evite</span>
              {(completo ? l.evite : l.evite.slice(0, 1)).map((f) => <p key={f}>{f}</p>)}
            </div>
          </div>

          {completo ? (
            <>
              <PorQueTema l={l} />
              <SecaoHoras horas={l.horas} cidade={perfil.cidade?.nome} />
            </>
          ) : travado}

          <div className={ma.acoes}>
            <button type="button" className={ma.btnSec} onClick={compartilhar}>
              <Icone nome="compartilhar" /> {copiado ? 'Copiado!' : 'Compartilhar meu dia'}
            </button>
          </div>
        </div>

        {completo && (
          <div className={ma.coluna}>
            <SecaoChinesa l={l} />
            <SecaoAnimais l={l} />

            <h2 className="sd-secao">As outras lentes</h2>
            <Lente titulo="Numerologia" destaque={<span className="sd-numero">{l.numerologia.diaPessoal}</span>}>
              <p className="sd-lente-sub">Dia pessoal {l.numerologia.diaPessoal} · {l.numerologia.palavra}</p>
              <p>{l.numerologia.longo}</p>
              {l.numerologia.mesPalavra && (
                <p>Pano de fundo: o seu mês pessoal é {l.numerologia.mesPessoal} ({l.numerologia.mesPalavra}). O mês dá o clima; o dia, o movimento.</p>
              )}
              <p className="sd-mudo">{l.numerologia.conta}</p>
            </Lente>
            {l.lua && (
              <Lente titulo="A Lua no seu mapa" destaque={<Icone nome="lua" tamanho={30} />}>
                <p className="sd-lente-sub">Lua em {l.lua.signo} · {l.lua.clima}</p>
                <p>
                  Seu Sol é em {l.lua.signoSolar}{l.lua.signoLuaNatal ? ` e sua Lua de nascimento em ${l.lua.signoLuaNatal}` : ''}.
                  {' '}A Lua troca de signo a cada 2 ou 3 dias e dá o clima emocional do dia — hoje ela está em {l.lua.signo}.
                </p>
                <p>{l.lua.texto}{l.lua.retorno ? ` ${l.lua.retorno}` : ''}</p>
                <p className="sd-mudo">{l.lua.signo} × {l.lua.signoSolar}: {l.lua.aspectoExplica}</p>
              </Lente>
            )}
            <Lente titulo="Tarô do dia" destaque={<Icone nome="carta" tamanho={30} />}>
              <p className="sd-lente-sub">{l.tarot.nome}{l.tarot.invertida ? ' (invertida)' : ''}</p>
              {l.tarot.palavrasChave.length > 0 && (
                <div className="sd-chips">{l.tarot.palavrasChave.map((k) => <span key={k}>{k}</span>)}</div>
              )}
              <p>{l.tarot.texto}</p>
              <p className="sd-mudo">A sua carta sai da combinação da sua data de nascimento com a de hoje — outra pessoa tira outra carta.</p>
            </Lente>
            <Lente titulo="I Ching" destaque={<Icone nome="hexagrama" tamanho={30} />}>
              <p className="sd-lente-sub">{l.hexagrama.superior} sobre {l.hexagrama.inferior}</p>
              <p>{l.hexagrama.texto}</p>
              <p><strong>Favorece:</strong></p>
              <ul className="sd-lista-simples">{l.hexagrama.favoreceLista.map((x) => <li key={x}>{x}</li>)}</ul>
              <p><strong>Cuidado:</strong></p>
              <ul className="sd-lista-simples">{l.hexagrama.cuidadoLista.map((x) => <li key={x}>{x}</li>)}</ul>
              <p>{l.hexagrama.movimento}</p>
              <p className="sd-mudo">É a única lente igual pra todo mundo: sai só da data de hoje, não do seu mapa.</p>
            </Lente>
            {extras && <LentesExtras e={extras} />}
          </div>
        )}
      </div>
    </>
  );
}

function LentesExtras({ e }) {
  const s = seloDoKin(e.kinDia);
  const t = tomDoKin(e.kinDia);
  const a = dadosDoAnjo(e.anjoDia);
  const ta = TEXTO_ANJO[a.n];
  return (
    <>
      <Lente titulo="Kin Maia do dia" destaque={<span className="sd-numero">{e.kinDia}</span>}>
        <p className="sd-lente-sub">Kin {e.kinDia} · {nomeDoKin(e.kinDia)}</p>
        <p>{TEXTO_SELO[s.codigo].hoje} No tom {t.numero}: {TEXTO_TOM[t.numero].hoje}.</p>
        <p>
          {e.relacao
            ? TEXTO_RELACAO_DIA[e.relacao]
            : 'Hoje o Kin do dia não cruza com o seu oráculo: um dia neutro pra você no Tzolkin.'}
        </p>
        <p className="sd-mudo">
          O seu Kin é o {e.kinPessoa}, {nomeDoKin(e.kinPessoa)}. <Link href="/kin-maia">Entender meu Kin →</Link>
        </p>
      </Lente>
      <Lente titulo="Anjo destes dias" destaque={<span className="sd-numero">✶</span>}>
        <p className="sd-lente-sub">{a.nome} · {ta.dom}</p>
        <p>O Sol está no ponto do céu que {a.nome} rege. Bom momento pra pedir {ta.pedir[0]}.</p>
        <p>
          {e.anjoDia === e.guardiao
            ? `São os dias do seu anjo da guarda: a proteção de ${a.nome} está mais forte em você.`
            : `Seu anjo da guarda é ${dadosDoAnjo(e.guardiao).nome}${e.mente ? ` e o da sua mente, ${dadosDoAnjo(e.mente).nome}` : ''}.`}
        </p>
        <p className="sd-mudo"><a href={`/anjo-da-guarda/${a.slug}`}>Tudo sobre {a.nome} →</a></p>
      </Lente>
    </>
  );
}

function PorQueTema({ l }) {
  return (
    <section className={ma.secaoEd} aria-labelledby="sd-porque">
      <h2 id="sd-porque" className={ma.h2Ed}>Por que esse tema e esse tom?</h2>
      <p>Cada sistema pessoal vota num tema. O mais votado vira o título do dia.</p>
      <ul className={ma.votos}>
        {l.porQue.votos.map((v) => (
          <li key={v.lente} className={v.igual ? ma.votoOn : ''}>
            <span>{v.lente}</span><strong>{v.temasNomes}</strong>
          </li>
        ))}
      </ul>
      <p>O tom soma os sinais a favor (+) e contra (−) do dia: {l.porQue.pontos > 0 ? `+${l.porQue.pontos}` : l.porQue.pontos < 0 ? `−${Math.abs(l.porQue.pontos)}` : '0'} = {TOM[l.tom].rotulo.toLowerCase()}.</p>
      <ul className={ma.votos}>
        {l.porQue.sinais.map((x) => (
          <li key={x.texto}>
            <span>{x.texto}</span><strong className={x.peso > 0 ? ma.votoMais : ma.votoMenos}>{x.peso > 0 ? `+${x.peso}` : `−${Math.abs(x.peso)}`}</strong>
          </li>
        ))}
        {!l.porQue.sinais.length && <li><span>Nenhum sinal forte hoje</span><strong>0</strong></li>}
      </ul>
    </section>
  );
}

function SecaoChinesa({ l }) {
  const c = l.chinesa;
  return (
    <section className="sd-card">
      <div className="sd-chinesa-topo">
        <span lang="zh" className="sd-hanzi-grande" aria-hidden="true">{c.deusHanzi}</span>
        <div>
          <span className="sd-eyebrow">ASTROLOGIA CHINESA</span>
          <h2 className="sd-card-titulo-grande">Dia de {c.deusNome}</h2>
          <p className="sd-mudo">{c.pilarNome} <span lang="zh">{c.pilarHanzi}</span></p>
        </div>
      </div>
      <p>No seu mapa chinês você é <strong>{c.voce.elemento}</strong> — {c.voce.imagem}. Hoje o dia é <strong>{c.diaElemento}</strong>.</p>
      {c.porQue.map((t) => <p key={t}>{t}</p>)}
      <h3 className="sd-sub">O que esperar</h3>
      <p>{c.esperar}</p>
      <h3 className="sd-sub">Como usar</h3>
      <p>{c.usar}</p>
    </section>
  );
}

function SecaoAnimais({ l }) {
  const c = l.chinesa;
  return (
    <section className="sd-card">
      <h2 className="sd-card-titulo">Seus animais hoje</h2>
      <p>
        Todo dia tem um animal no calendário chinês. Hoje é {oAnimal(c.animalDia.animal)} <span lang="zh">{c.animalDia.hanzi}</span>.
        {' '}Ele conversa com os animais do seu mapa — e cada um deles cuida de uma área da sua vida.
      </p>
      {c.animais.map((a) => (
        <div key={a.pos} className="sd-animal">
          <div className="sd-animal-topo">
            <span lang="zh" className="sd-animal-hanzi" aria-hidden="true">{a.hanzi}</span>
            <div>
              <strong>{a.animal}</strong>
              <span className="sd-mudo"> · {a.rotulo} · {a.area}</span>
            </div>
          </div>
          <p className="sd-mudo">{a.explica}</p>
          {a.relacoes.map((r) => (
            <div key={r.tipo} className="sd-animal-rel">
              <span className={`sd-tag ${r.positivo ? 'sd-tom-fluxo' : 'sd-tom-tensao'}`}>{r.nome} <span lang="zh">{r.hanzi}</span></span>
              <p><strong>O que é:</strong> {r.oQue}</p>
              <p><strong>Na prática:</strong> {r.naPratica}</p>
            </div>
          ))}
          {a.neutro && <p className="sd-animal-neutro">{a.neutro}</p>}
        </div>
      ))}
    </section>
  );
}

function SecaoHoras({ horas, cidade }) {
  return (
    <section className="sd-card">
      <h2 className="sd-card-titulo">Suas horas hoje</h2>
      <p>O dia chinês tem 12 horas duplas, cada uma regida por um animal e um elemento. Aqui estão as que mais ajudam e a que mais atrapalha o seu mapa hoje.</p>
      <p className="sd-mudo">
        {horas.aproximado
          ? 'Horário de Brasília aproximado. Adicione sua cidade em Ajustes pra hora exata.'
          : `No relógio de ${cidade || 'sua cidade'}, já corrigido pela posição do sol.`}
      </p>
      {horas.forca.map((h) => <LinhaHora key={h.faixa} h={h} />)}
      {horas.atencao && <LinhaHora h={horas.atencao} />}
      {!horas.forca.length && !horas.atencao && <p>Hoje as horas estão equilibradas: nenhuma se destaca.</p>}
    </section>
  );
}

function Lente({ titulo, destaque, children }) {
  return (
    <section className="sd-card sd-lente">
      <div className="sd-lente-destaque" aria-hidden="true">{destaque}</div>
      <div className="sd-lente-corpo">
        <h3>{titulo}</h3>
        {children}
      </div>
    </section>
  );
}

function LinhaHora({ h }) {
  const forca = h.tipo === 'forca';
  return (
    <div className="sd-hora">
      <div className="sd-hora-faixa">
        <strong>{h.faixa}</strong>
        <span className={`sd-tag ${forca ? 'sd-tom-fluxo' : 'sd-tom-tensao'}`}>{forca ? 'FORÇA' : 'ATENÇÃO'}</span>
      </div>
      <div>
        <p className="sd-hora-deus">Hora {['Serpente', 'Cabra'].includes(h.animal) ? 'da' : 'do'} {h.animal} · {h.deusNome}</p>
        <p>{h.texto}</p>
      </div>
    </div>
  );
}

const TOM_CLASSE = { fluxo: 'tomFluxo', misto: '', tensao: 'tomTensao' };
const DIA_CURTO = (r) => `${r.semana.slice(0, 3)} ${r.curto}`;

function AbaSemana({ semana, depois, completo, onDesbloquear }) {
  return (
    <>
      <p className={ma.intro}>Cada dia lido pelo seu mapa: onde tem força e onde pede cuidado.</p>
      <ol className={ma.dias}>
        {semana.map((d, i) => {
          const travado = !completo && i > 0;
          const classeTom = d.melhor ? ma.tomMelhor : ma[TOM_CLASSE[d.tom]] || '';
          return (
            <li key={d.data} className={ma.diaLinha}>
              <span className={ma.diaRotulo}>{i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DIA_CURTO(d.rotulo)}</span>
              <div className={`${ma.diaMeio}${travado ? ' sd-borrado' : ''}`} aria-hidden={travado ? 'true' : undefined}>
                <p className={ma.diaMeioTitulo}>{d.titulo}</p>
                <p className={ma.diaMeioTexto}>{d.frase}</p>
                <p className={ma.diaMeioMeta}><span lang="zh">{d.deusHanzi}</span> {d.deusNome} · {d.pilarNome} · {d.concordam}/{d.totalLentes} sistemas</p>
              </div>
              <span className={`${ma.pilulaTom} ${classeTom}`}>{d.melhor ? 'Melhor dia' : TOM[d.tom].rotulo}</span>
            </li>
          );
        })}
      </ol>

      {completo ? (
        <section className={ma.secaoEd} aria-labelledby="sd-mes">
          <h2 id="sd-mes" className={ma.h2Ed}>Até o fim do mês</h2>
          <ul className={ma.mes}>
            {depois.map((d) => (
              <li key={d.data}>
                <span className={ma.mesData}>{DIA_CURTO(d.rotulo)}</span>
                <span className={`${ma.ponto} ${d.melhor ? ma.tomMelhor : ma[TOM_CLASSE[d.tom]] || ''}`} aria-hidden="true" />
                <span>{d.titulo}{d.melhor ? ' ★' : ''}{d.choqueCasa ? ' · atenção em casa' : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className={ma.acoes}>
          <button type="button" className={ma.btn} onClick={onDesbloquear}>Ver a semana e os próximos 30 dias</button>
        </div>
      )}
    </>
  );
}

// ── Ajustes (aviso das 7h, instalar, dados, conta) ───────────────────────────

function urlBase64ParaUint8(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function AbaAjustes({ perfil, onEditar, onSair, onDesbloquear }) {
  const [suporte, setSuporte] = useState({ push: false, ios: false, instalado: false });
  const [inscrito, setInscrito] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState('');
  const [promptInstalar, setPromptInstalar] = useState(null);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const instalado = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
    const push = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSuporte({ push, ios, instalado });
    if (push) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((s) => setInscrito(!!s))
        .catch(() => {});
    }
    const onPrompt = (e) => { e.preventDefault(); setPromptInstalar(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function ligarAviso() {
    setMsg('');
    setOcupado(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') { setMsg('Os avisos estão bloqueados nas configurações do navegador.'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ParaUint8(perfil.pushPublicKey) });
      const { ok } = await api('/api/seu-dia/push', { method: 'POST', body: { subscription: sub.toJSON() } });
      if (!ok) throw new Error('falhou');
      setInscrito(true);
      evento('sd_push_ativado');
    } catch {
      setMsg('Não conseguimos ativar agora. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  async function desligarAviso() {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api('/api/seu-dia/push', { method: 'DELETE', body: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setInscrito(false);
    } finally {
      setOcupado(false);
    }
  }

  async function instalar() {
    if (!promptInstalar) return;
    promptInstalar.prompt();
    try { await promptInstalar.userChoice; } catch {}
    setPromptInstalar(null);
    evento('sd_instalar');
  }

  const pushDisponivel = !!perfil.pushPublicKey;
  const precisaInstalarIos = suporte.ios && !suporte.instalado;

  return (
    <div className={ma.duas}>
      <div className={ma.coluna}>
        <section className={ma.contaSecao}>
          <span className={ma.eyebrow}>Todo dia</span>
          <h2 className={ma.h2Ed}>Aviso às 7h</h2>
          {!pushDisponivel && <p>Em breve.</p>}
          {pushDisponivel && precisaInstalarIos && (
            <p>No iPhone, primeiro instale o app (passo abaixo). Depois abra pelo ícone e ative o aviso aqui.</p>
          )}
          {pushDisponivel && !precisaInstalarIos && !suporte.push && <p>Este navegador não aceita avisos.</p>}
          {pushDisponivel && !precisaInstalarIos && suporte.push && (
            <>
              <p>{inscrito ? 'Ativado neste aparelho. Todo dia às 7h chega o tema do seu dia.' : 'Receba o tema do seu dia às 7h, sem abrir nada.'}</p>
              <button type="button" className={inscrito ? ma.btnSec : ma.btn} disabled={ocupado} onClick={inscrito ? desligarAviso : ligarAviso}>
                {inscrito ? 'Desligar o aviso' : 'Ativar aviso às 7h'}
              </button>
            </>
          )}
          {msg && <p className={ma.erro}>{msg}</p>}
        </section>

        {!suporte.instalado && (
          <section className={ma.contaSecao}>
            <span className={ma.eyebrow}>App</span>
            <h2 className={ma.h2Ed}>Instale na tela de início</h2>
            {promptInstalar ? (
              <button type="button" className={ma.btn} onClick={instalar}>Instalar o Seu Dia</button>
            ) : suporte.ios ? (
              <p>Toque em <strong>Compartilhar</strong> (o quadrado com a seta) e depois em <strong>Adicionar à Tela de Início</strong>.</p>
            ) : (
              <p>No menu do navegador, toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p>
            )}
          </section>
        )}
      </div>

      <div className={ma.coluna}>
        <section className={ma.contaSecao}>
          <span className={ma.eyebrow}>Seus dados</span>
          <p className={ma.dadosLinha}>
            {perfil.dataNascimento.split('-').reverse().join('/')}
            {perfil.hora ? ` às ${perfil.hora}` : ' · hora não informada'}
            {perfil.cidade ? ` · ${perfil.cidade.nome}, ${perfil.cidade.uf}` : ' · sem cidade'}
          </p>
          <button type="button" className={`${ma.btnSec} ${ma.btnPeq}`} onClick={onEditar}>Editar</button>
        </section>

        <SecaoAssinatura perfil={perfil} onDesbloquear={onDesbloquear} />

        <section className={ma.contaSecao}>
          <span className={ma.eyebrow}>Conta</span>
          <p>{perfil.email}</p>
          <button type="button" className={`${ma.btnSec} ${ma.btnPeq}`} onClick={onSair}>Sair</button>
        </section>
      </div>
    </div>
  );
}

function SecaoAssinatura({ perfil, onDesbloquear }) {
  const [renova, setRenova] = useState(!!perfil.assinatura?.renovaSozinha);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState('');
  const a = perfil.assinatura;

  async function cancelar() {
    if (!window.confirm('Cancelar a renovação automática? O acesso continua até o fim do período já pago.')) return;
    setOcupado(true);
    setMsg('');
    const { ok, json } = await api('/api/assinatura/cancelar', { method: 'POST' });
    setOcupado(false);
    if (!ok) { setMsg(json?.error || 'Não conseguimos cancelar agora.'); return; }
    setRenova(false);
    evento('sd_assinatura_cancelada');
    setMsg(`Renovação cancelada. Seu acesso continua até ${dataBR(a?.acessoAte)}.`);
  }

  return (
    <section className={ma.contaSecao}>
      <span className={ma.eyebrow}>Assinatura</span>
      <h2 className={ma.h2Ed}>Intuitive Completo</h2>
      {perfil.motivoAcesso === 'assinatura' ? (
        <>
          <p>Plano {a?.plano === 'anual' ? 'anual' : 'mensal'}, ativo até {dataBR(a?.acessoAte)}{renova ? ' — renova sozinho no cartão.' : '.'}</p>
          {renova ? (
            <button type="button" className={`${ma.btnSec} ${ma.btnPeq}`} disabled={ocupado} onClick={cancelar}>Cancelar renovação</button>
          ) : (
            <a className={`${ma.btnSec} ${ma.btnLink}`} href={`/assinar?plano=${a?.plano || 'anual'}`}>Renovar / somar mais tempo</a>
          )}
        </>
      ) : (
        <>
          <p>{perfil.motivoAcesso === 'manual'
            ? `Seu 1º mês é por conta do Manual, até ${dataBR(a?.acessoAte)}. Assine pra continuar depois.`
            : 'Seu Dia completo, Previsão do Ano, Human Design, Compatibilidade Completa e Oráculo ilimitado — e o Manual no anual.'}
          </p>
          <button type="button" className={ma.btn} onClick={onDesbloquear}>Ver planos</button>
        </>
      )}
      {msg && <p>{msg}</p>}
    </section>
  );
}

// ── Assinar (leva pro /assinar com o plano escolhido) ────────────────────────

function ModalListaEspera({ onFechar }) {
  const [plano, setPlano] = useState('anual');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onFechar]);

  const planos = [
    { id: 'anual', nome: 'Anual', preco: `${brl(PRECO_ASSINATURA_ANUAL)}/ano`, sub: `${brl(PRECO_ASSINATURA_ANUAL / 12)} por mês · inclui o Manual` },
    { id: 'mensal', nome: 'Mensal', preco: `${brl(PRECO_ASSINATURA_MENSAL)}/mês`, sub: 'Sem fidelidade' },
  ];

  return (
    <div className="sd-modal-fundo" onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="sd-modal" role="dialog" aria-modal="true" aria-labelledby="sd-modal-titulo">
        <button type="button" className="sd-fechar" aria-label="Fechar" onClick={onFechar}><Icone nome="x" /></button>
        <span className="sd-eyebrow">INTUITIVE COMPLETO</span>
        <h2 id="sd-modal-titulo">Tudo liberado, numa assinatura só.</h2>
        <ul className="sd-lista-beneficios sd-lista-compacta">
          <li><Icone nome="check" /> Seu Dia completo, com aviso às 7h</li>
          <li><Icone nome="check" /> Previsão do Ano, Human Design e Compatibilidade Completa</li>
          <li><Icone nome="check" /> Oráculo ilimitado</li>
          <li><Icone nome="check" /> No anual: o Manual do seu Mapa</li>
        </ul>
        <div role="radiogroup" aria-label="Plano" className="sd-planos">
          {planos.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={plano === p.id} className={`sd-plano${plano === p.id ? ' is-on' : ''}`} onClick={() => setPlano(p.id)}>
              <span><strong>{p.nome}</strong><span className="sd-mudo">{p.sub}</span></span>
              <strong>{p.preco}</strong>
            </button>
          ))}
        </div>
        <a className="sd-btn sd-btn-link" href={`/assinar?plano=${plano}`} onClick={() => evento('sd_assinar_click', { plano })}>Continuar — Pix ou cartão</a>
      </div>
    </div>
  );
}

// ── Ícones (traço) ───────────────────────────────────────────────────────────

const PATHS = {
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  casa: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  mapa: <path d="M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z" />,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />,
  ajustes: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  alerta: <><path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5M12 18h.01" /></>,
  cadeado: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  sino: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  compartilhar: <><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  lua: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  carta: <><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M12 8l1.5 3L12 14l-1.5-3z" /></>,
  hexagrama: <path d="M5 5h14M5 9h5M14 9h5M5 13h14M5 17h5M14 17h5" />,
};

function Icone({ nome, tamanho = 18 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[nome]}
    </svg>
  );
}

// ── Estilo ───────────────────────────────────────────────────────────────────

const CSS = `
  body { margin: 0; background: #0a0118; }
  @media (display-mode: standalone) { .site-nav { display: none; } }
  .sd-wrap { min-height: 100vh; background: #0a0118; color: #faf5ff; font-family: 'Cormorant Garamond', Georgia, serif; }
  /* O menu fica transparente por cima (position: absolute, 64px): o conteúdo começa embaixo dele. */
  .sd-col { max-width: 480px; margin: 0 auto; padding: 86px 18px 40px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; }
  @media (display-mode: standalone) { .sd-col { padding-top: 22px; } }
  .sd-centro { min-height: 60vh; display: flex; align-items: center; justify-content: center; }
  .sd-centro-texto { text-align: center; }
  .sd-spinner { width: 34px; height: 34px; border-radius: 999px; border: 3px solid #2e1f4a; border-top-color: #f5a524; animation: sdgira 0.9s linear infinite; }
  @keyframes sdgira { to { transform: rotate(360deg); } }

  .sd-eyebrow { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.2em; color: #f5a524; }
  .sd-cabecalho { display: flex; flex-direction: column; gap: 4px; }
  .sd-cabecalho h1, .sd-hero-entrar h1 { margin: 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 27px; line-height: 1.2; }
  .sd-hero-entrar { text-align: center; padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }
  .sd-hero-entrar h1 { font-size: 40px; }
  .sd-lead { font-size: 20px; line-height: 1.5; color: #e9dcff; margin: 0; }
  .sd-mudo { color: #cdbbe8; font-size: 16px; margin: 0; }
  .sd-mudo a { color: #f5d48a; }
  .sd-dica { text-transform: none; letter-spacing: 0; font-family: 'Cormorant Garamond', serif; font-size: 14px; color: #cdbbe8; }

  .sd-card { background: #150a28; border: 1px solid #2e1f4a; border-radius: 18px; padding: 18px 16px; display: flex; flex-direction: column; gap: 10px; }
  .sd-card p { margin: 0; font-size: 18px; line-height: 1.45; }
  .sd-card h2 { margin: 0; }
  .sd-card-titulo { font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px; letter-spacing: 0.05em; }
  .sd-secao { margin: 10px 0 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 17px; }

  .sd-btn { min-height: 50px; border-radius: 999px; border: 0; background: #f2c77b; color: #1a1020; font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px; letter-spacing: 0.04em; cursor: pointer; padding: 0 20px; }
  .sd-btn:disabled { opacity: 0.6; cursor: default; }
  .sd-btn-link { display: flex; align-items: center; justify-content: center; text-decoration: none; }
  .sd-btn-sec { min-height: 48px; border-radius: 999px; border: 1px solid rgba(243,233,218,.25); background: transparent; color: #faf5ff; font-family: 'Cinzel', serif; font-weight: 700; font-size: 13px; letter-spacing: 0.04em; cursor: pointer; padding: 0 18px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
  .sd-codigo { text-align: center; font-family: 'Courier New', monospace !important; font-size: 34px !important; letter-spacing: 0.4em; padding-left: 0.4em !important; }
  .sd-codigo-acoes { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .sd-link-btn:disabled { color: #8a7aa8; text-decoration: none; cursor: default; }
  .sd-link-btn { background: none; border: 0; color: #f5a524; font: inherit; text-decoration: underline; cursor: pointer; padding: 0; min-height: 32px; text-align: left; }

  .sd-form label { font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #cdbbe8; }
  .sd-form input:not([type=checkbox]), .sd-input-cidade { width: 100%; box-sizing: border-box; min-height: 48px; background: #0a0118; color: #faf5ff; border: 1px solid #4a2f6e; border-radius: 12px; padding: 10px 14px; font-family: 'Cormorant Garamond', serif; font-size: 18px; color-scheme: dark; }
  .sd-form input:disabled { opacity: 0.4; }
  .sd-form .sd-check { display: flex; align-items: center; gap: 8px; text-transform: none; letter-spacing: 0; font-family: 'Cormorant Garamond', serif; font-size: 17px; color: #faf5ff; min-height: 32px; }
  .sd-erro { color: #fca5a5 !important; font-size: 16px !important; }
  .sd-aviso { margin: 0; padding: 12px 14px; border-radius: 12px; background: #3a2208; color: #fdba74; font-size: 17px; }

  .sd-lista-beneficios { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 18px; }
  .sd-lista-beneficios li { display: flex; gap: 10px; align-items: flex-start; }
  .sd-lista-beneficios svg { flex: none; margin-top: 3px; color: #f5a524; }
  .sd-lista-compacta { font-size: 17px; gap: 8px; }
  .sd-lista-compacta svg { color: #86efac; }


  .sd-hero { padding: 22px 18px; }
  .sd-hero-topo { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
  .sd-hero h2 { font-family: 'Cinzel', serif; font-weight: 700; font-size: 25px; line-height: 1.2; }
  .sd-frase { font-size: 20px !important; }
  .sd-alinhamento { display: flex; align-items: center; gap: 10px; font-size: 16px; color: #cdbbe8; }
  .sd-pontos { display: inline-flex; gap: 5px; }
  .sd-pontos span { width: 9px; height: 9px; border-radius: 999px; border: 1px solid #f5a524; }
  .sd-pontos span.on { background: #f5a524; }

  .sd-tag { font-family: 'Cinzel', serif; font-weight: 700; font-size: 10px; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 999px; white-space: nowrap; text-transform: uppercase; }
  .sd-tom-fluxo { color: #86efac; background: #12331f; }
  .sd-tom-misto { color: #e9dcff; background: #2a1d45; }
  .sd-tom-tensao { color: #fdba74; background: #3a2208; }
  .sd-tom-melhor { color: #fcd34d; background: #3a2a08; }

  .sd-grade-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .sd-fe { padding: 14px 12px; }
  .sd-fe p { font-size: 17px; }
  .sd-fe-titulo { display: flex; align-items: center; gap: 6px; font-family: 'Cinzel', serif; font-weight: 700; font-size: 12px; letter-spacing: 0.14em; }
  .sd-verde { color: #86efac; }
  .sd-laranja { color: #fdba74; }

  .sd-lente { flex-direction: row; gap: 14px; align-items: flex-start; }
  .sd-lente-destaque { flex: none; width: 52px; height: 52px; border-radius: 14px; border: 1px solid #3b2a5c; display: flex; align-items: center; justify-content: center; color: #f5a524; }
  .sd-lente-corpo { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .sd-lente h3 { margin: 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px; letter-spacing: 0.04em; }
  .sd-lente-sub { color: #f5a524; font-size: 17px !important; }
  .sd-hanzi { font-family: 'Noto Serif SC', serif; font-weight: 600; font-size: 19px; }
  .sd-numero { font-family: 'Cinzel', serif; font-weight: 700; font-size: 24px; }

  .sd-porque summary { cursor: pointer; font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px; letter-spacing: 0.04em; color: #f5a524; min-height: 32px; display: flex; align-items: center; }
  .sd-porque p { font-size: 17px !important; }
  .sd-votos { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .sd-votos li { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-top: 1px solid #2e1f4a; font-size: 17px; }
  .sd-votos li.on strong { color: #f5a524; }
  .sd-chinesa-topo { display: flex; gap: 14px; align-items: center; }
  .sd-hanzi-grande { flex: none; font-family: 'Noto Serif SC', serif; font-weight: 600; font-size: 40px; color: #f5a524; line-height: 1; }
  .sd-card-titulo-grande { margin: 2px 0 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 21px; }
  .sd-sub { margin: 6px 0 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 13px; letter-spacing: 0.06em; color: #f5a524; }
  .sd-animal { display: flex; flex-direction: column; gap: 6px; padding-top: 12px; border-top: 1px solid #2e1f4a; }
  .sd-animal-topo { display: flex; gap: 10px; align-items: center; font-size: 18px; }
  .sd-animal-hanzi { flex: none; width: 38px; height: 38px; border-radius: 10px; border: 1px solid #3b2a5c; display: flex; align-items: center; justify-content: center; font-family: 'Noto Serif SC', serif; font-weight: 600; font-size: 19px; color: #f5a524; }
  .sd-animal-rel { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; margin-top: 2px; }
  .sd-animal-neutro { color: #cdbbe8; font-style: italic; }
  .sd-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .sd-chips span { font-size: 15px; padding: 3px 10px; border-radius: 999px; border: 1px solid #3b2a5c; color: #e9dcff; }
  .sd-lista-simples { margin: 0; padding-left: 20px; font-size: 17px; line-height: 1.45; }
  .sd-relacao { display: flex; gap: 10px; align-items: flex-start; }
  .sd-bolinha { flex: none; width: 30px; height: 30px; border-radius: 999px; display: flex; align-items: center; justify-content: center; }
  .sd-bolinha-ok { background: #12331f; color: #86efac; }
  .sd-bolinha-atencao { background: #3a2208; color: #fdba74; }

  .sd-hora { display: flex; gap: 12px; padding-top: 10px; border-top: 1px solid #2e1f4a; }
  .sd-hora-faixa { flex: none; width: 104px; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; font-family: 'Cinzel', serif; font-size: 13px; }
  .sd-hora-deus { font-weight: 600; }

  .sd-travado ul { margin: 0; padding-left: 20px; font-size: 18px; line-height: 1.5; }
  .sd-travado-topo { display: flex; justify-content: space-between; align-items: center; color: #f5a524; }
  .sd-borrado { filter: blur(5px); user-select: none; pointer-events: none; }

  .sd-compartilhar { align-self: stretch; }

  .sd-dia-topo { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-family: 'Cinzel', serif; font-size: 13px; text-transform: capitalize; }
  .sd-dia-titulo { font-family: 'Cinzel', serif; font-weight: 700; font-size: 17px !important; }
  .sd-mes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .sd-mes li { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid #2e1f4a; font-size: 17px; }
  .sd-mes-data { flex: none; width: 78px; font-family: 'Cinzel', serif; font-size: 12px; color: #cdbbe8; text-transform: capitalize; }
  .sd-ponto { flex: none; width: 10px; height: 10px; border-radius: 999px; padding: 0; }
  .sd-ponto.sd-tom-fluxo { background: #86efac; }
  .sd-ponto.sd-tom-misto { background: #6b5a8e; }
  .sd-ponto.sd-tom-tensao { background: #fb923c; }
  .sd-ponto.sd-tom-melhor { background: #fcd34d; }

  .sd-abas { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); background: rgba(7,4,13,.96); border-top: 1px solid rgba(242,199,123,.16); padding: 8px 8px calc(12px + env(safe-area-inset-bottom)); }
  .sd-abas > * { min-height: 54px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: none; border: 0; color: #b9a9c9; text-decoration: none; font-family: 'Geist Mono', var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; }
  .sd-abas > .is-on { color: #f2c77b; }
  /* Desktop: abas em linha (minhaArea.module.css) no lugar da barra de baixo. */
  @media (min-width: 960px) { .sd-abas { display: none; } }

  .sd-modal-fundo { position: fixed; inset: 0; z-index: 60; background: rgba(5, 0, 12, 0.78); display: flex; align-items: flex-end; justify-content: center; }
  @media (min-width: 560px) { .sd-modal-fundo { align-items: center; } }
  .sd-modal { position: relative; width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto; box-sizing: border-box; background: #120824; border: 1px solid #3b2a5c; border-radius: 22px 22px 0 0; padding: 22px 18px calc(22px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 14px; }
  @media (min-width: 560px) { .sd-modal { border-radius: 22px; } }
  .sd-modal h2 { margin: 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 24px; }
  .sd-modal p { margin: 0; font-size: 18px; line-height: 1.45; }
  .sd-fechar { position: absolute; top: 10px; right: 10px; width: 44px; height: 44px; border-radius: 999px; border: 0; background: transparent; color: #cdbbe8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .sd-planos { display: flex; flex-direction: column; gap: 10px; }
  .sd-plano { min-height: 66px; border-radius: 16px; border: 1px solid #2e1f4a; background: #150a28; color: #faf5ff; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; text-align: left; cursor: pointer; font-family: 'Cormorant Garamond', serif; font-size: 17px; }
  .sd-plano > span { display: flex; flex-direction: column; }
  .sd-plano strong { font-family: 'Cinzel', serif; font-size: 15px; }
  .sd-plano.is-on { border: 2px solid #f5a524; }
`;
