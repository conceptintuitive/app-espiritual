'use client';

// Tela de Direct Post do TikTok, nas regras das Content Sharing Guidelines:
// mostra pra qual conta vai (creator_info), a prévia do post, título e
// descrição editáveis, privacidade SEM valor padrão (só as opções da conta),
// comentários desmarcados por padrão (e travados se a conta desligou),
// divulgação de conteúdo comercial desligada por padrão, e o consentimento
// com a Confirmação de Uso de Música antes de qualquer botão de postar.
// "Aprovar" agenda pro cron das 7h (com estas escolhas); "Postar agora" envia já.

import { useEffect, useState } from 'react';

const PRIVACIDADE = {
  PUBLIC_TO_EVERYONE: 'Todo mundo',
  MUTUAL_FOLLOW_FRIENDS: 'Amigos (quem se segue)',
  FOLLOWER_OF_CREATOR: 'Seguidores',
  SELF_ONLY: 'Só eu',
};
const MUSICA = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
const MARCA = 'https://www.tiktok.com/legal/page/global/bc-policy/en';

const cor = { fundo: '#07040d', texto: '#f3e9da', ouro: '#f2c77b', apagado: '#b9a9c9', linha: 'rgba(242,199,123,.2)' };
const btn = (principal) => ({ padding: '11px 18px', borderRadius: 999, border: principal ? 0 : `1px solid ${cor.ouro}`, background: principal ? cor.ouro : 'transparent', color: principal ? '#1a1020' : cor.texto, fontWeight: 600, cursor: 'pointer' });
const campo = { width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${cor.linha}`, background: '#140c22', color: cor.texto, font: 'inherit', boxSizing: 'border-box' };
const dataBR = (d) => d.split('-').reverse().slice(0, 2).join('/');

function Dia({ dia, criador, aoMudar }) {
  const [f, setF] = useState({
    titulo: dia.aprovacao?.titulo || dia.titulo || '',
    descricao: dia.aprovacao?.descricao || dia.descricao || '',
    privacy_level: dia.aprovacao?.privacy_level || '',
    permitir_comentarios: dia.aprovacao ? !dia.aprovacao.disable_comment : false,
    auto_add_music: dia.aprovacao?.auto_add_music ?? false,
    divulgacao: !!dia.aprovacao?.divulgacao,
    brand_organic_toggle: !!dia.aprovacao?.brand_organic_toggle,
    brand_content_toggle: !!dia.aprovacao?.brand_content_toggle,
    consentimento: false,
  });
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const opcoes = criador?.privacy_level_options || [];
  const faltaMarca = f.divulgacao && !f.brand_organic_toggle && !f.brand_content_toggle;
  const pode = !!criador && f.privacy_level && f.consentimento && !faltaMarca && !(f.brand_content_toggle && f.privacy_level === 'SELF_ONLY');

  async function enviar(acao) {
    setEnviando(true);
    setMsg('');
    try {
      const r = await fetch('/api/admin/tiktok', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: dia.data, acao, ...f }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setMsg(acao === 'postar_agora' ? 'Enviado. Pode levar alguns minutos pro post aparecer no seu perfil do TikTok.' : acao === 'aprovar' ? `Aprovado: sai às 7h de ${dataBR(dia.data)} com estas escolhas.` : 'Aprovação desfeita.');
      aoMudar();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!dia.pronto) {
    return <section style={{ borderTop: `1px solid ${cor.linha}`, padding: '20px 0' }}><h2 style={{ fontWeight: 400 }}>{dataBR(dia.data)}</h2><p style={{ color: cor.apagado }}>Ainda não gerado (o cron de domingo gera a semana).</p></section>;
  }

  return (
    <section style={{ borderTop: `1px solid ${cor.linha}`, padding: '24px 0' }}>
      <h2 style={{ fontWeight: 400, margin: '0 0 4px' }}>{dataBR(dia.data)} · {dia.tema}</h2>
      <p style={{ color: cor.apagado, margin: '0 0 12px' }}>{dia.item}</p>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }} aria-label="Prévia do post">
        {dia.imagens.map((src, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={`Foto ${k + 1} do post`} width={144} height={180} style={{ borderRadius: 6, flex: '0 0 auto' }} />
        ))}
      </div>

      {dia.postado?.status === 'ok' ? (
        <p style={{ color: cor.ouro }}>Já enviado pro TikTok (id {dia.postado.post_id}).</p>
      ) : (
        <div style={{ display: 'grid', gap: 14, maxWidth: 640, marginTop: 12 }}>
          <label>Título<input style={campo} maxLength={90} value={f.titulo} onChange={(e) => set('titulo', e.target.value)} /></label>
          <label>Descrição<textarea style={{ ...campo, minHeight: 140 }} maxLength={4000} value={f.descricao} onChange={(e) => set('descricao', e.target.value)} /></label>

          <label>Quem pode ver este post
            <select style={campo} value={f.privacy_level} onChange={(e) => set('privacy_level', e.target.value)} required>
              <option value="" disabled>Escolha</option>
              {opcoes.map((o) => (
                <option key={o} value={o} disabled={o === 'SELF_ONLY' && f.brand_content_toggle} title={o === 'SELF_ONLY' && f.brand_content_toggle ? 'Conteúdo de marca não pode ser privado' : undefined}>
                  {PRIVACIDADE[o] || o}
                </option>
              ))}
            </select>
          </label>

          <fieldset style={{ border: `1px solid ${cor.linha}`, borderRadius: 8 }}>
            <legend>Interações</legend>
            <label style={{ opacity: criador?.comment_disabled ? 0.5 : 1 }}>
              <input type="checkbox" checked={f.permitir_comentarios} disabled={!!criador?.comment_disabled} onChange={(e) => set('permitir_comentarios', e.target.checked)} /> Permitir comentários
              {criador?.comment_disabled && <small> (desligado nas configurações da sua conta)</small>}
            </label>
            <br />
            <label><input type="checkbox" checked={f.auto_add_music} onChange={(e) => set('auto_add_music', e.target.checked)} /> Adicionar música automaticamente</label>
          </fieldset>

          <fieldset style={{ border: `1px solid ${cor.linha}`, borderRadius: 8 }}>
            <legend>Divulgação de conteúdo comercial</legend>
            <label><input type="checkbox" checked={f.divulgacao} onChange={(e) => set('divulgacao', e.target.checked)} /> Este post promove uma marca, produto ou serviço</label>
            {f.divulgacao && (
              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                <label><input type="checkbox" checked={f.brand_organic_toggle} onChange={(e) => set('brand_organic_toggle', e.target.checked)} /> Sua marca: você está promovendo a si mesma ou o seu negócio. O post vai ser marcado como &quot;Conteúdo promocional&quot;.</label>
                <label><input type="checkbox" checked={f.brand_content_toggle} onChange={(e) => { set('brand_content_toggle', e.target.checked); if (e.target.checked && f.privacy_level === 'SELF_ONLY') set('privacy_level', ''); }} /> Conteúdo de marca: você está promovendo outra marca. O post vai ser marcado como &quot;Parceria paga&quot;.</label>
                {faltaMarca && <small style={{ color: '#ffb4a8' }}>Marque pelo menos uma das opções.</small>}
              </div>
            )}
          </fieldset>

          <label>
            <input type="checkbox" checked={f.consentimento} onChange={(e) => set('consentimento', e.target.checked)} />{' '}
            Ao postar, você concorda com a <a href={MUSICA} target="_blank" rel="noreferrer" style={{ color: cor.ouro }}>Confirmação de Uso de Música do TikTok</a>
            {f.brand_content_toggle && <> e com a <a href={MARCA} target="_blank" rel="noreferrer" style={{ color: cor.ouro }}>Política de Conteúdo de Marca</a></>}.
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" style={{ ...btn(true), opacity: pode && !enviando ? 1 : 0.5 }} disabled={!pode || enviando} onClick={() => enviar('aprovar')}>Aprovar pra postar às 7h de {dataBR(dia.data)}</button>
            <button type="button" style={{ ...btn(false), opacity: pode && !enviando ? 1 : 0.5 }} disabled={!pode || enviando} onClick={() => enviar('postar_agora')}>Postar agora</button>
            {dia.aprovacao && <button type="button" style={btn(false)} disabled={enviando} onClick={() => enviar('desfazer')}>Desfazer aprovação</button>}
          </div>
          {dia.aprovacao && <p style={{ color: cor.ouro, margin: 0 }}>Aprovado em {new Date(dia.aprovacao.aprovado_em).toLocaleString('pt-BR')}: {PRIVACIDADE[dia.aprovacao.privacy_level] || dia.aprovacao.privacy_level}.</p>}
        </div>
      )}
      {msg && <p role="status" style={{ color: cor.apagado }}>{msg}</p>}
    </section>
  );
}

export default function AprovarTikTok() {
  const [estado, setEstado] = useState({ carregando: true });
  async function carregar() {
    try {
      const r = await fetch('/api/admin/tiktok', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setEstado(j);
    } catch (err) {
      setEstado({ erro: err.message });
    }
  }
  useEffect(() => { carregar(); }, []);

  const c = estado.criador;
  return (
    <main style={{ minHeight: '100vh', background: cor.fundo, color: cor.texto, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px 80px' }}>
        <h1 style={{ fontWeight: 400, color: cor.ouro, margin: '0 0 8px' }}>Postar no TikTok</h1>
        {estado.carregando && <p>Carregando…</p>}
        {estado.erro && <p style={{ color: '#ffb4a8' }}>{estado.erro}</p>}
        {estado.erroCriador && <p style={{ color: '#ffb4a8' }}>Não consegui ler a sua conta do TikTok ({estado.erroCriador}). Conecte de novo em /api/tiktok/connect. Enquanto isso, nada é postado direto.</p>}
        {c && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.creator_avatar_url && <img src={c.creator_avatar_url} alt="" width={48} height={48} style={{ borderRadius: '50%' }} />}
            <div>
              <div>Postando como <strong>{c.creator_nickname}</strong>{c.creator_username ? ` (@${c.creator_username})` : ''}</div>
              <small style={{ color: cor.apagado }}>Os posts vão como fotos (carrossel) direto pro seu perfil.</small>
            </div>
          </div>
        )}
        {estado.dias && !estado.directPostLigado && (
          <p style={{ color: cor.apagado }}>TIKTOK_DIRECT_POST está desligado: as aprovações ficam guardadas, mas o cron das 7h segue mandando pros rascunhos. &quot;Postar agora&quot; funciona.</p>
        )}
        {(estado.dias || []).map((d) => <Dia key={d.data} dia={d} criador={c} aoMudar={carregar} />)}
        {estado.dias && (
          <form method="post" action="/api/admin/entrar?sair=1"><button type="submit" style={{ ...btn(false), marginTop: 24 }}>Sair</button></form>
        )}
      </div>
    </main>
  );
}
