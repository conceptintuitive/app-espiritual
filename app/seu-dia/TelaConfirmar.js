'use client';

// "Esta é você?" — primeira vez na Minha Área depois do redesign (nov/2026):
// mostra nome, data, hora e cidade do perfil antes de abrir o mapa. "Sim, sou
// eu" grava perfil_confirmado_em (migração 0021, best effort) e guarda também
// no aparelho; "Corrigir meus dados" abre a TelaDados (salvar lá também confirma).

import { useState } from 'react';
import s from './minhaArea.module.css';

const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

export default function TelaConfirmar({ perfil, onConfirmar, onCorrigir }) {
  const [enviando, setEnviando] = useState(false);
  const cidade = perfil.cidade ? `${perfil.cidade.nome}, ${perfil.cidade.uf}` : null;
  const dados = [
    { k: 'Nome', v: (perfil.nome || '').trim() || null },
    { k: 'Nascimento', v: dataBR(perfil.dataNascimento) },
    { k: 'Hora', v: perfil.hora ? perfil.hora.slice(0, 5) : null, vazio: 'Não sei' },
    { k: 'Cidade', v: cidade, vazio: 'Não informada' },
  ];

  return (
    <main className={`${s.ma} ${s.confirmar}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/olho/e1.webp" alt="" className={s.confirmarImg} />
      <div className={s.confirmarVeu} aria-hidden="true" />
      <div className={s.confirmarCol}>
        <div className={s.confirmarCabeca}>
          <span className={s.eyebrow}>Primeiro acesso</span>
          <h1 className={s.confirmarH1}>Esta é <i>você?</i></h1>
          <p className={s.confirmarSub}>Seu mapa inteiro sai destes dados. Confira uma vez e pronto.</p>
        </div>

        <dl className={s.dados}>
          {dados.map((d) => (
            <div key={d.k} className={s.dado}>
              <dt>{d.k}</dt>
              <dd className={d.v ? '' : s.dadoVazio}>{d.v || d.vazio || '—'}</dd>
            </div>
          ))}
        </dl>

        <div className={s.botoes}>
          <button
            type="button"
            className={s.btn}
            disabled={enviando}
            onClick={async () => { setEnviando(true); await onConfirmar(); setEnviando(false); }}
          >
            {enviando ? 'Abrindo…' : 'Sim, sou eu'}
          </button>
          <button type="button" className={s.btnSec} onClick={onCorrigir}>Corrigir meus dados</button>
          <p className={s.nota}>Leituras de outras pessoas neste e-mail ficam guardadas, fechadas, no fim da Minha Área.</p>
        </div>
      </div>
    </main>
  );
}
