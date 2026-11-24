'use client';

// /avaliar?t=<token>&r=<resposta> — destino dos botões do e-mail de avaliação
// (lib/avaliacao.js). A resposta é gravada aqui, por POST, e não no GET do
// link: robô de antivírus que abre link de e-mail não vota. Depois, 1 frase
// opcional + a autorização pra publicar (desmarcada; só primeiro nome + signo).

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import r from '../resultado/[id]/resultado.module.css';

const RESPOSTAS = { bate_muito: 'Bate muito', em_parte: 'Em parte', nao_bate: 'Não bate' };

async function enviar(corpo) {
  const res = await fetch('/api/avaliacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  return res.json().catch(() => ({ ok: false }));
}

function Avaliar() {
  const params = useSearchParams();
  const t = params.get('t') || '';
  const inicial = RESPOSTAS[params.get('r')] ? params.get('r') : null;
  const [resposta, setResposta] = useState(inicial);
  const [estado, setEstado] = useState(inicial ? 'gravando' : 'escolher'); // escolher | gravando | gravado | enviado | erro
  const [quem, setQuem] = useState(null);
  const [frase, setFrase] = useState('');
  const [autoriza, setAutoriza] = useState(false);
  const gravouRef = useRef(false);

  const gravar = async (resp) => {
    setResposta(resp);
    setEstado('gravando');
    const d = await enviar({ t, resposta: resp });
    if (d?.ok) {
      setQuem({ nome: d.nome, signo: d.signo });
      setEstado('gravado');
      try { window?.gtag?.('event', 'avaliacao_manual', { resposta: resp }); } catch {}
    } else setEstado(d?.erro === 'link' ? 'erro' : 'gravado');
  };

  useEffect(() => {
    if (inicial && !gravouRef.current) { gravouRef.current = true; gravar(inicial); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mandarFrase = async (e) => {
    e.preventDefault();
    setEstado('gravando');
    await enviar({ t, resposta, frase, autoriza });
    try { window?.gtag?.('event', 'avaliacao_frase', { autoriza }); } catch {}
    setEstado('enviado');
  };

  if (!t || estado === 'erro') {
    return (
      <div className={r.centro}>
        <h1 className={r.centroTitulo}>Link inválido</h1>
        <p className={r.texto}>Esse link de avaliação não funciona mais. Se quiser falar com a gente: conceptintuitive@gmail.com</p>
        <Link className={r.link} href="/">Ir pro site</Link>
      </div>
    );
  }

  if (estado === 'escolher') {
    return (
      <div className={r.centro}>
        <span className={r.eyebrow}>O Manual do seu Mapa</span>
        <h1 className={r.centroTitulo}>Ele bate com você?</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
          <button type="button" className={`${r.btn} ${r.btnLargo}`} onClick={() => gravar('bate_muito')}>Bate muito</button>
          <button type="button" className={r.btnSec} onClick={() => gravar('em_parte')}>Em parte</button>
          <button type="button" className={r.btnSec} onClick={() => gravar('nao_bate')}>Não bate</button>
        </div>
      </div>
    );
  }

  if (estado === 'gravando') {
    return <div className={r.centro}><div className={r.spinner} /><p className={r.texto}>Salvando…</p></div>;
  }

  if (estado === 'enviado') {
    return (
      <div className={r.centro}>
        <h1 className={r.centroTitulo}>Obrigada!</h1>
        <p className={r.texto}>Recebemos.{autoriza && frase.trim() ? ' A sua frase pode aparecer no site com o seu primeiro nome e signo.' : ''}</p>
        <Link className={r.link} href="/seu-dia">Ir pra Minha Área</Link>
      </div>
    );
  }

  // gravado: resposta salva, frase opcional
  return (
    <div className={r.centro}>
      <span className={r.eyebrow}>Resposta salva: {RESPOSTAS[resposta]}</span>
      <h1 className={r.centroTitulo}>Obrigada!</h1>
      <form onSubmit={mandarFrase} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 420, textAlign: 'left' }}>
        <label className={r.rotulo} htmlFor="frase">Quer contar em uma frase? (opcional)</label>
        <textarea id="frase" className={r.campo} rows={3} maxLength={280} value={frase} onChange={(e) => setFrase(e.target.value)}
          placeholder={resposta === 'nao_bate' ? 'O que não bateu?' : 'O que mais bateu com você?'} style={{ minHeight: 96, paddingTop: 12, resize: 'vertical' }} />
        {resposta === 'bate_muito' && (
          <label className={r.presenteCheck}>
            <input type="checkbox" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} />
            <span>
              Pode publicar no site{quem?.nome ? `, como “${quem.nome}${quem.signo ? ` · ${quem.signo}` : ''}”` : ', só com o meu primeiro nome e signo'}
            </span>
          </label>
        )}
        <button type="submit" className={`${r.btn} ${r.btnLargo}`} disabled={!frase.trim()}>Enviar</button>
        <p className={r.nota}>Nada de sobrenome, e-mail ou foto. Você pode pedir pra tirar a qualquer momento: conceptintuitive@gmail.com</p>
      </form>
    </div>
  );
}

export default function Pagina() {
  return (
    <div className={r.pagina}>
      <Suspense fallback={<div className={r.centro}><div className={r.spinner} /></div>}>
        <Avaliar />
      </Suspense>
    </div>
  );
}
