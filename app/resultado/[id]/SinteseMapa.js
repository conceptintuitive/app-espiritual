'use client';

// Topo do /resultado (nov/2026): o que mais de um sistema repete e onde a
// pessoa se divide, das tabelas de lib/mapaSintese.js (sem IA), com quem
// votou em cada coisa. Entra via next/dynamic (ssr:false) em page.js: os
// cálculos (BaZi, anjos, Kin) ficam fora do JS inicial, como os do topo.
// O card do story é o modelo "sintese" de app/seu-dia/cardStory.js (o mesmo
// motor do card do Meu Mapa), carregado só no toque.

import { useMemo, useRef, useState } from 'react';
import { sistemasDaPessoa, destaqueDoMapa } from '@/lib/mapaSintese';
import r from './resultado.module.css';

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'resultado', ...params }); } catch {}
}

const DO = { 'Astrologia chinesa': 'da sua' };
const minusculo = (s) => (s.startsWith('Kin') ? s : s.charAt(0).toLowerCase() + s.slice(1));
// "do seu signo solar (Sagitário)" · "da sua astrologia chinesa (Metal Yin) e do seu anjo da guarda (Nithael)"
function deOnde(quem) {
  const itens = quem.map((q) => `${DO[q.sistema] || 'do seu'} ${minusculo(q.sistema)} (${q.valor})`);
  return itens.length <= 1 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/**
 * @param {{ dados: { nome: string, dataNascimento: string, hora: string|null, cidade: object|null },
 *   id: string, pago: boolean }} props
 */
export default function SinteseMapa({ dados, id, pago }) {
  const d = useMemo(() => destaqueDoMapa(sistemasDaPessoa({
    dataNascimento: dados.dataNascimento, hora: dados.hora, cidade: dados.cidade,
  })), [dados]);

  const [estado, setEstado] = useState('idle'); // idle | desenhando | pronto | erro
  const [previa, setPrevia] = useState(null);
  const [aviso, setAviso] = useState('');
  const card = useRef(null);

  if (!d.convergencia && !d.tensao) return null;
  const c = d.convergencia;
  const t = d.tensao;

  // 1º toque: desenha o card e mostra a prévia. 2º toque: compartilha. O
  // navigator.share precisa do toque "fresco" (o iOS recusa se o desenho
  // demorar entre o toque e o share), por isso são dois passos.
  async function abrirCard() {
    setEstado('desenhando');
    setAviso('');
    evento('resultado_sintese_card', { acao: 'abrir' });
    try {
      const [{ dadosDoCard }, { desenharCard }] = await Promise.all([import('@/lib/cardStory'), import('@/app/seu-dia/cardStory')]);
      const cv = await desenharCard('sintese', dadosDoCard(dados));
      card.current = cv;
      setPrevia(cv.toDataURL('image/jpeg', 0.82));
      setEstado('pronto');
    } catch {
      setEstado('erro');
      setAviso('Não deu pra desenhar o card agora. Tente de novo.');
    }
  }

  async function postar() {
    const cv = card.current;
    if (!cv) return;
    setAviso('');
    try {
      const { canvasParaBlob } = await import('@/app/seu-dia/cardStory');
      const blob = await canvasParaBlob(cv);
      const arquivo = new File([blob], 'meu-mapa.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [arquivo] })) {
        evento('resultado_sintese_card', { acao: 'postar' });
        await navigator.share({ files: [arquivo], title: 'Meu mapa', text: 'Faça o seu mapa grátis · intuitiveconcept.com.br' });
      } else {
        evento('resultado_sintese_card', { acao: 'baixar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = arquivo.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setAviso('Imagem baixada. É só postar no story.');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setAviso('Não deu pra gerar a imagem agora. Tente de novo.');
    }
  }

  return (
    <section className={`${r.secao} ${r.sintese}`} aria-labelledby="sintese">
      <span id="sintese" className={r.eyebrow}>O que o seu mapa cruzou</span>

      <div className={r.sinteseGrade}>
        {c && (
          <div className={r.sinteseBloco}>
            <p className={r.rotulo}>{c.rotulo}</p>
            <h2 className={r.sinteseTema}>{c.nome}</h2>
            <p className={r.texto}>{c.frase}</p>
            <ul className={r.sinteseQuem}>
              {c.quem.map((q) => (
                <li key={q.sistema}>
                  <span className={r.rotulo}>{q.sistema}</span>
                  <span className={r.sinteseValor}>{q.valor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {t && (
          <div className={r.sinteseBloco}>
            <p className={r.rotulo}>Onde você se divide</p>
            <h2 className={r.sinteseTensao}>{t.nomeA} <span aria-label="versus">×</span> {t.nomeB}</h2>
            <p className={r.sinteseFrase}>{t.frase}</p>
            <p className={r.sinteseOrigem}>
              {t.nomeA} vem {deOnde(t.quemA)}. {t.nomeB} vem {deOnde(t.quemB)}.
            </p>
            {pago ? (
              <a className={r.sinteseLink} href={`/manual/${id}`} onClick={() => evento('resultado_sintese_manual', { pago: true })}>
                O que fazer com essa divisão está no seu Manual →
              </a>
            ) : (
              <a className={r.sinteseLink} href="#comprar" onClick={() => evento('resultado_sintese_manual', { pago: false })}>
                O que fazer com essa divisão está no Manual do seu Mapa ↓
              </a>
            )}
          </div>
        )}
      </div>

      <div className={r.sinteseCard}>
        {previa && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previa} alt="Prévia do card do story com o seu mapa" />
        )}
        <div className={r.sinteseCardAcoes}>
          {estado === 'pronto' ? (
            <button type="button" className={r.btn} onClick={postar}>Postar no story</button>
          ) : (
            <button type="button" className={r.btnSec} onClick={abrirCard} disabled={estado === 'desenhando'}>
              {estado === 'desenhando' ? 'Desenhando o seu card…' : 'Compartilhar no story'}
            </button>
          )}
          {aviso && <p className={r.sinteseOrigem} role="status">{aviso}</p>}
        </div>
      </div>
    </section>
  );
}
