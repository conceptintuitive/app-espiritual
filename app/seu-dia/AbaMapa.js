'use client';

// Aba "Mapa" do Seu Dia: todos os sistemas da pessoa juntos, a síntese
// cruzada (lib/mapaSintese.js) e um card 1080x1920 pro story, desenhado no
// próprio navegador (canvas) — sem servidor, sem dados na URL.
// Grátis pra todo mundo: é o que a pessoa compartilha.
// Card (nov/2026): dois modelos com o céu real da pessoa, "Céu" (padrão) e
// "Número"; antes de gerar, a pessoa escolhe pelas miniaturas. Desenho em
// ./cardStory.js, textos em lib/cardStory.js.

import { useMemo, useRef, useState } from 'react';
import { dadosDoCard } from '@/lib/cardStory';
import { desenharCard, canvasParaBlob } from './cardStory';
import { sistemasDaPessoa, sinteseDoMapa, previaDoManual, TEMAS } from '@/lib/mapaSintese';
import ma from './minhaArea.module.css';
import { BotoesCadeado } from './Cadeado';

function evento(nome, params = {}) {
  try { window.gtag?.('event', nome, { event_category: 'seu_dia', ...params }); } catch {}
}

const listaHumana = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

export default function AbaMapa({ perfil }) {
  // Quem tem o Manual (pago agora ou no anual) vê o conselho da tensão; quem
  // não tem vê só a frase e, no fim, a prévia do Manual com os temas dela.
  const temManual = !!perfil.mapa?.pago || perfil.motivoAcesso === 'manual';
  const sistemas = useMemo(() => sistemasDaPessoa({
    dataNascimento: perfil.dataNascimento,
    hora: perfil.hora || null,
    cidade: perfil.cidade || null,
  }), [perfil.dataNascimento, perfil.hora, perfil.cidade]);
  const s = useMemo(() => sinteseDoMapa(sistemas), [sistemas]);
  const previa = useMemo(() => previaDoManual(s), [s]);
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState('');
  const nome = (perfil.nome || '').split(' ')[0];

  // Card do story: abre a escolha, desenha os dois modelos e mostra as miniaturas.
  const dadosCard = useMemo(() => dadosDoCard({
    nome: perfil.nome, dataNascimento: perfil.dataNascimento, hora: perfil.hora || null, cidade: perfil.cidade || null,
  }), [perfil.nome, perfil.dataNascimento, perfil.hora, perfil.cidade]);
  const [escolhendo, setEscolhendo] = useState(false);
  const [modelo, setModelo] = useState('ceu');
  const [previas, setPrevias] = useState({});
  const cards = useRef({});

  async function abrirEscolha() {
    setEscolhendo(true);
    setAviso('');
    evento('sd_mapa_card_abrir');
    try {
      for (const m of ['ceu', 'numero']) {
        if (cards.current[m]) continue;
        const cv = await desenharCard(m, dadosCard);
        cards.current[m] = cv;
        const url = cv.toDataURL('image/jpeg', 0.82);
        setPrevias((p) => ({ ...p, [m]: url }));
      }
    } catch {
      setAviso('Não deu pra desenhar o card agora. Tente de novo.');
    }
  }

  async function compartilharCard() {
    const cv = cards.current[modelo];
    if (!cv) return;
    setGerando(true);
    setAviso('');
    evento('sd_mapa_card', { modelo });
    try {
      const blob = await canvasParaBlob(cv);
      const arquivo = new File([blob], `meu-mapa-${modelo}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: 'Meu mapa', text: 'O céu do dia em que eu cheguei · intuitiveconcept.com.br/ceu' });
      } else {
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
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className={ma.duas}>
      <div className={ma.coluna}>
        <p className={ma.intro}>
          {nome ? `${nome}, ` : ''}{sistemas.length - 1} sistemas lidos juntos. Onde eles concordam é o que mais define você.
        </p>

        <section className={ma.secaoEd} aria-labelledby="mp-repete">
          <span id="mp-repete" className={ma.eyebrow}>O que seu mapa repete</span>
          {s.repete.length > 0 ? s.repete.map((r) => (
            <div key={r.tema} className={ma.temaGrande}>
              <h2 className={ma.temaNome}>{r.nome}</h2>
              <span className={ma.temaQuem}>{r.sistemas.length} sistemas dizem isso: {listaHumana(r.sistemas)}</span>
              <p className={ma.temaFrase}>{r.frase}</p>
            </div>
          )) : (
            <>
              <p className={ma.temaFrase}>Seu mapa é plural: cada sistema puxa pra um lado, e isso também é uma assinatura. Seus temas mais fortes:</p>
              {s.ranking.slice(0, 3).map((r) => (
                <div key={r.tema} className={ma.temaGrande}>
                  <h2 className={ma.temaNome}>{TEMAS[r.tema].nome}</h2>
                  <p className={ma.temaFrase}>{TEMAS[r.tema].frase}</p>
                </div>
              ))}
            </>
          )}
        </section>

        {s.tensao && (
          <section className={ma.secaoEd} aria-labelledby="mp-tensao">
            <span id="mp-tensao" className={ma.eyebrow}>Onde você se divide</span>
            <div className={ma.temaGrande}>
              <h2 className={ma.temaNome}>{s.tensao.nomeA} <span>×</span> {s.tensao.nomeB}</h2>
              <span className={ma.temaQuem}>
                {s.tensao.nomeA}: {listaHumana(s.tensao.sistemasA)} · {s.tensao.nomeB}: {listaHumana(s.tensao.sistemasB)}
              </span>
              <p className={ma.temaFrase}>{temManual ? s.tensao.texto : s.tensao.frase}</p>
            </div>
          </section>
        )}
      </div>

      <div className={ma.coluna}>
        <section className={ma.secaoEd} aria-labelledby="mp-sistemas">
          <h2 id="mp-sistemas" className={ma.h2Ed}>Seus sistemas</h2>
          <div>
            {sistemas.map((c) => (
              <a key={c.chave} href={c.href} className={ma.mapaLinha} onClick={() => evento('sd_mapa_sistema', { destino: c.chave })}>
                <span className={ma.mapaRotulo}>{c.sistema}</span>
                <span className={ma.mapaValor}>
                  {c.valor}
                  <span className={ma.sistemasSub} style={{ display: 'block' }}>{c.sub}</span>
                </span>
                <span className={ma.seta} aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>

        <section className={ma.secaoEd} aria-labelledby="mp-story">
          <span id="mp-story" className={ma.eyebrow}>Pro seu story</span>
          <p>Um card com o céu do dia em que você chegou e o seu mapa, no tamanho do story.</p>
          {!escolhendo ? (
            <div>
              <button type="button" className={ma.btn} onClick={abrirEscolha}>Gerar meu card</button>
            </div>
          ) : (
            <>
              <div className={ma.cardOpcoes} role="radiogroup" aria-label="Modelo do card">
                {[['ceu', 'Céu'], ['numero', 'Número']].map(([m, rotulo]) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={modelo === m}
                    className={`${ma.cardOpcao} ${modelo === m ? ma.cardOpcaoOn : ''}`}
                    onClick={() => setModelo(m)}
                  >
                    {previas[m]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={previas[m]} alt={`Prévia do card ${rotulo}`} />
                      : <span className={ma.cardCarregando}>Desenhando…</span>}
                    <span className={ma.cardRotulo}>{rotulo}</span>
                  </button>
                ))}
              </div>
              <div>
                <button type="button" className={ma.btn} onClick={compartilharCard} disabled={gerando || !previas[modelo]}>
                  {gerando ? 'Gerando…' : 'Compartilhar no story'}
                </button>
              </div>
            </>
          )}
          {aviso && <p>{aviso}</p>}
        </section>
      </div>

      {/* Sem Manual: o mapa inteiro fica aberto (é o que a pessoa divulga) e,
          no fim, a prévia do que o Manual traz pra ELA (lib/mapaSintese.js →
          previaDoManual: títulos fixos por tema/tensão, começo borrado). */}
      {!temManual && (
        <section className={ma.previaManual} aria-labelledby="mp-previa">
          <h2 id="mp-previa" className={ma.h2Ed}>No Manual do seu Mapa</h2>
          {previa.map((x) => (
            <div key={x.chave} className={ma.previaLinha}>
              <p className={ma.previaTitulo}>{x.titulo}</p>
              <p className={ma.cadeadoBorrado} aria-hidden="true">{x.inicio}</p>
            </div>
          ))}
          <BotoesCadeado
            perfil={perfil}
            origem="mapa"
            rotuloResultado="Desbloquear o Manual do seu Mapa"
            rotuloQuiz="Ver a prévia grátis do meu Manual"
            nota="e ganhe 30 dias do Seu Dia Completo"
          />
        </section>
      )}
    </div>
  );
}
