'use client';

import { useRef, useState } from 'react';
import { getArquetipoPrincipal, TOTAL_COMBINACOES } from '@/lib/arquetipoCard';

const MESTRES = new Set([11, 22, 33]);

export default function SeloArquetipo({ firstName, signo, numeroVida, objetivoPrincipal }) {
  const cardRef = useRef(null);
  const [baixando, setBaixando] = useState(false);

  if (!signo || !numeroVida) return null;

  const arquetipo = getArquetipoPrincipal({ signo, numeroVida, objetivoPrincipal });
  const nome = firstName || 'Você';
  const ehMestre = MESTRES.has(Number(numeroVida));

  async function handleBaixar() {
    if (!cardRef.current || baixando) return;
    setBaixando(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0118',
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `selo-${arquetipo.chave.toLowerCase()}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Meu Selo do Arquétipo',
          text: `Descobri que meu arquétipo é ${arquetipo.nome} — descubra o seu:`,
        });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `selo-${arquetipo.chave.toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Erro ao gerar selo:', e);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div className="selo-wrap">
      <div ref={cardRef} className="selo-card">
        <span className="selo-eyebrow">✦ Intuitive Concept</span>
        <span className="selo-emoji">{arquetipo.emoji}</span>
        <span className="selo-label">Seu Arquétipo</span>
        <h2 className="selo-nome">{arquetipo.nome}</h2>
        <p className="selo-motto">"{arquetipo.motto}"</p>
        <div className="selo-divider" />
        <div className="selo-stats">
          <span>☀️ {signo}</span>
          <span>🔢 Número {numeroVida}{ehMestre ? ' · Mestre' : ''}</span>
        </div>
        <p className="selo-raridade">1 em ~{TOTAL_COMBINACOES.toLocaleString('pt-BR')} combinações possíveis de Sol + Número + Arquétipo</p>
        <p className="selo-nome-pessoa">{nome}</p>
        <p className="selo-footer">descubra o seu em intuitiveconcept.com.br</p>
      </div>

      <button className="selo-btn" onClick={handleBaixar} disabled={baixando}>
        {baixando ? '⏳ Gerando…' : '📥 Baixar meu selo'}
      </button>

      <style jsx>{`
        .selo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          margin: 28px 0;
        }
        .selo-card {
          width: 100%;
          max-width: 340px;
          aspect-ratio: 4 / 5;
          border-radius: 22px;
          border: 1px solid rgba(216, 180, 254, 0.28);
          background:
            radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.28), transparent 55%),
            radial-gradient(circle at 50% 100%, rgba(236, 72, 153, 0.16), transparent 60%),
            #0a0118;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 28px 22px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        .selo-eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 10.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #f0c870;
          margin-bottom: 6px;
        }
        .selo-emoji { font-size: 40px; line-height: 1; margin-bottom: 4px; }
        .selo-label {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(233, 213, 255, 0.72);
        }
        .selo-nome {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 28px;
          color: #faf5ff;
          margin: 4px 0 2px;
          text-wrap: balance;
        }
        .selo-motto {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 15px;
          color: #fbcfe8;
          margin: 0 0 12px;
        }
        .selo-divider {
          width: 60px;
          height: 1px;
          background: rgba(216, 180, 254, 0.3);
          margin-bottom: 12px;
        }
        .selo-stats {
          display: flex;
          gap: 14px;
          font-size: 13.5px;
          color: #faf5ff;
          margin-bottom: 14px;
        }
        .selo-raridade {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 12px;
          color: rgba(233, 213, 255, 0.6);
          max-width: 240px;
          line-height: 1.4;
          margin: 0 0 16px;
        }
        .selo-nome-pessoa {
          font-family: 'Cinzel', serif;
          font-size: 13px;
          letter-spacing: 0.04em;
          color: #faf5ff;
          margin: 0 0 4px;
        }
        .selo-footer {
          font-size: 10.5px;
          color: rgba(233, 213, 255, 0.5);
          margin: 0;
        }
        .selo-btn {
          font-family: 'Cinzel', serif;
          font-size: 13px;
          letter-spacing: 0.04em;
          color: #fff;
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          border: none;
          padding: 12px 24px;
          border-radius: 999px;
          cursor: pointer;
        }
        .selo-btn:disabled { opacity: 0.6; cursor: default; }
      `}</style>
    </div>
  );
}
