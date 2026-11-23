'use client';

// Autocomplete de município brasileiro — usado na etapa 3 do quiz (app/page.js,
// tema 'ma'), na TelaDados do Seu Dia, nas ferramentas grátis e na pergunta
// "Em que cidade?" do Olho Cósmico (/ceu).
//
// - A base (public/data/municipios-br.json, ~83 KB gzip) só é baixada no
//   primeiro foco do campo, nunca no carregamento da página.
// - Texto livre continua valendo: se a pessoa não escolher uma sugestão, o
//   pai recebe só o texto (onChangeText) e `selecionado` fica null.
// - Teclado: ↑/↓ navegam, Enter escolhe, Esc fecha.

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { buscarMunicipios, carregarMunicipios, rotuloMunicipio } from '@/lib/municipios';

const TEMAS = {
  quiz: {
    lista: {
      background: '#12121e', border: '1px solid rgba(139,92,246,.35)', borderRadius: 14,
      boxShadow: '0 12px 32px rgba(0,0,0,.5)',
    },
    item: { fontFamily: 'var(--F)', fontSize: 15, color: '#f0eff4', padding: '11px 16px', textAlign: 'left' },
    ativo: { background: 'rgba(139,92,246,.22)' },
    uf: { color: '#9896a8' },
  },
  // Minha Área / home (nov/2026): dourado, Geist
  ma: {
    lista: {
      background: '#110a1a', border: '1px solid rgba(242,199,123,.3)', borderRadius: 12,
      boxShadow: '0 12px 32px rgba(0,0,0,.6)',
    },
    item: { fontFamily: "var(--font-geist-sans), 'Geist', system-ui, sans-serif", fontSize: 15, color: '#f3e9da', padding: '11px 16px', textAlign: 'left' },
    ativo: { background: 'rgba(242,199,123,.14)' },
    uf: { color: '#b9a9c9' },
  },
  olho: {
    lista: {
      background: 'rgba(20,14,30,.96)', border: '1px solid rgba(242,199,123,.35)', borderRadius: 12,
      boxShadow: '0 12px 32px rgba(0,0,0,.6)', backdropFilter: 'blur(6px)',
    },
    item: { fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#fff', padding: '9px 14px', textAlign: 'center' },
    ativo: { background: 'rgba(242,199,123,.16)' },
    uf: { color: 'rgba(242,199,123,.8)', fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '.1em' },
  },
};

/**
 * @param {{
 *   value: string,
 *   onChangeText: (texto: string) => void,
 *   onSelect: (m: import('@/lib/municipios').Municipio) => void,
 *   tema?: 'quiz' | 'ma' | 'olho',
 *   id?: string,
 *   placeholder?: string,
 *   inputStyle?: object,
 *   inputClassName?: string,
 *   onKeyDown?: (e: KeyboardEvent, aberto: boolean) => void,
 *   inputRef?: { current: HTMLInputElement|null },
 *   abrirPraCima?: boolean,
 * }} props
 */
export default function CidadeAutocomplete({
  value, onChangeText, onSelect, tema = 'quiz', placeholder = 'Ex: São Paulo, SP', id,
  inputStyle, inputClassName, onKeyDown, inputRef, abrirPraCima = false,
}) {
  const t = TEMAS[tema] || TEMAS.quiz;
  const listaId = useId();
  const [lista, setLista] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [ativoBruto, setAtivo] = useState(0);
  const fecharTimer = useRef(null);

  useEffect(() => () => clearTimeout(fecharTimer.current), []);

  // Sugestões derivadas do texto (sem state extra). O destaque volta pra 1ª
  // opção quando o texto muda (onChange abaixo) e nunca passa do fim da lista.
  const sugestoes = useMemo(() => (lista ? buscarMunicipios(lista, value) : []), [lista, value]);
  const ativo = Math.min(ativoBruto, Math.max(0, sugestoes.length - 1));

  function garantirBase() {
    if (lista) return;
    // Se a base falhar, o campo segue como texto livre (sem sugestões).
    carregarMunicipios().then(setLista).catch(() => {});
  }

  function escolher(m) {
    onSelect(m);
    setAberto(false);
  }

  const mostrar = aberto && sugestoes.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={listaId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        className={inputClassName}
        style={inputStyle}
        onFocus={() => { garantirBase(); setAberto(true); }}
        onBlur={() => { fecharTimer.current = setTimeout(() => setAberto(false), 150); }}
        onChange={(e) => { onChangeText(e.target.value); setAberto(true); setAtivo(0); }}
        onKeyDown={(e) => {
          if (mostrar && e.key === 'ArrowDown') { e.preventDefault(); setAtivo((i) => (i + 1) % sugestoes.length); return; }
          if (mostrar && e.key === 'ArrowUp') { e.preventDefault(); setAtivo((i) => (i - 1 + sugestoes.length) % sugestoes.length); return; }
          if (mostrar && e.key === 'Enter') { e.preventDefault(); escolher(sugestoes[ativo]); return; }
          if (e.key === 'Escape') setAberto(false);
          onKeyDown?.(e, mostrar);
        }}
      />
      {mostrar && (
        <ul
          id={listaId}
          role="listbox"
          style={{
            position: 'absolute', left: 0, right: 0, zIndex: 30, listStyle: 'none', margin: 0, padding: '6px 0',
            maxHeight: 264, overflowY: 'auto',
            ...(abrirPraCima ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
            ...t.lista,
          }}
        >
          {sugestoes.map((m, i) => (
            <li
              key={m.ibge}
              role="option"
              aria-selected={i === ativo}
              // mousedown (e não click) pra escolher antes do blur fechar a lista
              onMouseDown={(e) => { e.preventDefault(); escolher(m); }}
              onMouseEnter={() => setAtivo(i)}
              style={{ cursor: 'pointer', ...t.item, ...(i === ativo ? t.ativo : null) }}
            >
              {m.nome}<span style={t.uf}>{tema === 'olho' ? `  ${m.uf}` : `, ${m.uf}`}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { rotuloMunicipio };
