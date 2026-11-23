'use client';

// Pedaços da aba Hoje usados também fora da Minha Área (a prévia "Como é por
// dentro" do /assinar e a "Depois do mapa" da home): o tema do dia com
// Faça/Evite e uma linha das horas. Estilo em minhaArea.module.css (precisa
// estar dentro de .ma; a linha das horas, dentro de .abaCorpo).
// Arquivo leve de propósito (sem lib/seuDia.js nem o céu): a home importa.

import ma from './minhaArea.module.css';

// Pessoa de exemplo das prévias do Hoje (/assinar e home). Não é ninguém real.
export const EXEMPLO_DIA = { dataNascimento: '1992-04-03', hora: '09:30', tz: 'America/Sao_Paulo', lon: -46.63 };
export const TOM_ROTULO = { fluxo: 'Dia a favor', misto: 'Dia misto', tensao: 'Dia de atenção' };

// "Ação com direção." → "Ação com <i>direção.</i>" (última palavra em itálico dourado)
export function TituloDoDia({ texto }) {
  const i = texto.lastIndexOf(' ');
  if (i < 0) return <i>{texto}</i>;
  return <>{texto.slice(0, i + 1)}<i>{texto.slice(i + 1)}</i></>;
}

/** Tema do dia (rótulo, título, frase, barrinhas) + Faça/Evite. */
export function DiaResumo({ l, rotuloTom }) {
  return (
    <>
      <section className={ma.diaHero} aria-labelledby="sd-titulo-dia">
        <div className={ma.hojeTopo}>
          <span className={ma.eyebrow}>{`${l.rotulo.semana} · ${l.rotulo.dia} de ${l.rotulo.mes}`}</span>
          <span className={ma.pilula}>{rotuloTom}</span>
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
          {l.faca.map((f) => <p key={f}>{f}</p>)}
        </div>
        <div className={ma.faceCol}>
          <span className={ma.rotuloEvite}>Evite</span>
          {l.evite.map((f) => <p key={f}>{f}</p>)}
        </div>
      </div>
    </>
  );
}

/** Uma hora de força ou de atenção ("Suas horas hoje"). */
export function LinhaHora({ h }) {
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
