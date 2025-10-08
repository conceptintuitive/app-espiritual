'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { gerarManualCompleto } from '@/lib/manual-completo';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ManualPage() {
  const params = useParams();
  const [analise, setAnalise] = useState(null);
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acesso, setAcesso] = useState(false);

  useEffect(() => {
    async function verificarAcesso() {
      const { data, error } = await supabase
        .from('analises')
        .select('*')
        .eq('id', params.id)
        .single();

      if (data?.comprou_manual) {
        setAcesso(true);
        setAnalise(data);
        
        const manualGerado = gerarManualCompleto(data);
        setManual(manualGerado);
      } else if (data) {
        setAnalise(data);
      }
      setLoading(false);
    }

    verificarAcesso();
  }, [params.id]);

  const renderSecao = (secao) => {
    if (!secao) return null;

    return (
      <div className="max-w-none">
        <div 
          style={{ 
            fontSize: '18px',
            lineHeight: '1.4',
            color: '#e2e8f0'
          }}
          dangerouslySetInnerHTML={{ 
            __html: secao.conteudo
              .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #d8b4fe;">$1</strong>')
              .replace(/^### (.*$)/gim, '<h3 style="font-size: 22px; font-weight: bold; color: #d8b4fe; margin-top: 16px; margin-bottom: 8px;">$1</h3>')
              .replace(/^## (.*$)/gim, '<h2 style="font-size: 26px; font-weight: bold; color: #e9d5ff; margin-top: 20px; margin-bottom: 12px;">$1</h2>')
              .replace(/^# (.*$)/gim, '<h1 style="font-size: 30px; font-weight: bold; color: #f3e8ff; margin-top: 24px; margin-bottom: 16px;">$1</h1>')
              .replace(/^- (.*$)/gim, '<div style="margin-left: 16px; margin-bottom: 2px;">• $1</div>')
              .replace(/^✅ (.*$)/gim, '<div style="display: flex; align-items: flex-start; gap: 4px; margin-bottom: 2px;"><span style="color: #4ade80; font-size: 14px;">✅</span><span>$1</span></div>')
              .replace(/^❌ (.*$)/gim, '<div style="display: flex; align-items: flex-start; gap: 4px; margin-bottom: 2px;"><span style="color: #f87171; font-size: 14px;">❌</span><span>$1</span></div>')
              .replace(/^✨ (.*$)/gim, '<div style="display: flex; align-items: flex-start; gap: 4px; margin-bottom: 2px;"><span style="color: #facc15; font-size: 14px;">✨</span><span>$1</span></div>')
              .replace(/\n\n\n+/g, '<div style="height: 12px;"></div>')
              .replace(/\n\n/g, '<div style="height: 4px;"></div>')
              .replace(/\n/g, '<br>')
          }}
        />
      </div>
    );
  };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const margemEsq = 20;
    const larguraPagina = 210;
    const larguraTexto = larguraPagina - 40;
    const pageH = doc.internal.pageSize.getHeight();
    let y = 20;

    const limparTexto = (texto) => {
      return String(texto ?? "")
        .replace(/[^\x00-\x7F]/g, "")
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^#{1,6}\s/gm, '')
        .replace(/^[-•✨✅❌⚠️🔥💎🌟]/gm, '• ')
        .replace(/\n\n+/g, '\n\n')
        .replace(/&[a-zA-Z]+;/g, '')
        .trim();
    };

    const adicionarTexto = (texto, tamanho = 11, cor = [0, 0, 0]) => {
      doc.setFontSize(tamanho);
      doc.setTextColor(...cor);

      const textoLimpo = limparTexto(texto);
      const linhas = doc.splitTextToSize(textoLimpo, larguraTexto);

      linhas.forEach(linha => {
        if (y > pageH - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(linha, margemEsq, y);
        y += tamanho * 0.5;
      });

      y += 5;
    };

    doc.setFontSize(22);
    doc.setTextColor(147, 51, 234);
    doc.text('MANUAL DOS PODERES OCULTOS', larguraPagina / 2, y, { align: 'center' });

    y += 10;
    doc.setFontSize(16);
    doc.text(`Exclusivo para ${analise.nome}`, larguraPagina / 2, y, { align: 'center' });

    y += 20;

    const secoes = [
      { titulo: 'INTRODUCAO', conteudo: manual.introducao?.conteudo || '' },
      { titulo: 'PODERES OCULTOS', conteudo: manual.poderes_ocultos?.conteudo || '' },
      { titulo: 'ARQUETIPOS', conteudo: manual.arquetipos?.conteudo || '' },
      { titulo: 'LINGUAGEM', conteudo: manual.linguagem?.conteudo || '' },
      { titulo: 'RITUAIS', conteudo: manual.rituais?.conteudo || '' },
      { titulo: 'BLOQUEIOS', conteudo: manual.bloqueios?.conteudo || '' },
      { titulo: 'LIMPEZA', conteudo: manual.limpeza?.conteudo || '' },
      { titulo: 'SEXUALIDADE', conteudo: manual.sexualidade?.conteudo || '' },
      { titulo: 'GEOMETRIA', conteudo: manual.geometria?.conteudo || '' },
      { titulo: 'MAGNETISMO', conteudo: manual.magnetismo?.conteudo || '' },
      { titulo: 'CALENDARIO LUNAR', conteudo: manual.calendario_lunar?.conteudo || '' },
      { titulo: 'PLANO 90 DIAS', conteudo: manual.plano_90_dias?.conteudo || '' }
    ];

    secoes.forEach((secao, index) => {
      if (!secao.conteudo) return;

      if (index > 0) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(147, 51, 234);
      doc.text(secao.titulo, margemEsq, y);
      y += 15;

      adicionarTexto(secao.conteudo, 10, [50, 50, 50]);
    });

    doc.save(`Manual_Espiritual_${analise.nome.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-xl">Preparando seu manual espiritual...</p>
        </div>
      </div>
    );
  }

  if (!acesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-purple-200 mb-8">
            Este manual está disponível apenas após a compra do Manual Completo por R$ 47,00
          </p>
          <Link
            href={`/resultado/${params.id}`}
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
          >
            Voltar para Análise
          </Link>
        </div>
      </div>
    );
  }

  if (!manual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white flex items-center justify-center">
        <p>Erro ao carregar manual.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        
        <div className="text-center mb-16">
          <div className="mb-4">
            <Link href="/" className="text-purple-300 hover:text-purple-200 text-sm">
              ← Voltar
            </Link>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            ✨ Manual dos Poderes Ocultos
          </h1>
          <p className="text-2xl md:text-3xl text-purple-300 mb-4">
            Exclusivo para {analise.nome}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="bg-purple-500/20 px-6 py-2 rounded-full text-lg">
              {analise.signo}
            </span>
            <span className="bg-pink-500/20 px-6 py-2 rounded-full text-lg">
              Número {analise.numero_vida}
            </span>
          </div>
        </div>

        <div className="space-y-16">
          
          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.introducao.titulo}
            </h2>
            {renderSecao(manual.introducao)}
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.poderes_ocultos.titulo}
            </h2>
            {renderSecao(manual.poderes_ocultos)}
          </section>

          <section className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-3xl p-8 md:p-12 border-2 border-purple-400/30">
            <h2 className="text-4xl font-bold mb-8 text-purple-200">
              {manual.arquetipos.titulo}
            </h2>
            {renderSecao(manual.arquetipos)}
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.linguagem.titulo}
            </h2>
            {renderSecao(manual.linguagem)}
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.rituais.titulo}
            </h2>
            {renderSecao(manual.rituais)}
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.bloqueios.titulo}
            </h2>
            {renderSecao(manual.bloqueios)}
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.limpeza.titulo}
            </h2>
            {renderSecao(manual.limpeza)}
          </section>

          <section className="bg-gradient-to-r from-red-900/20 to-pink-900/20 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-pink-500/20">
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-8">
              <strong>⚠️ CONTEÚDO ADULTO:</strong> Esta seção é para maiores de 18 anos.
            </div>
            <h2 className="text-4xl font-bold mb-8 text-pink-300">
              {manual.sexualidade.titulo}
            </h2>
            {renderSecao(manual.sexualidade)}
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.geometria.titulo}
            </h2>
            {renderSecao(manual.geometria)}
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.magnetismo.titulo}
            </h2>
            {renderSecao(manual.magnetismo)}
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-8 text-purple-300">
              {manual.calendario_lunar.titulo}
            </h2>
            {renderSecao(manual.calendario_lunar)}
          </section>

          <section className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 backdrop-blur-lg rounded-3xl p-8 md:p-12 border-2 border-green-400/30">
            <h2 className="text-4xl font-bold mb-8 text-green-300">
              {manual.plano_90_dias.titulo}
            </h2>
            {renderSecao(manual.plano_90_dias)}
          </section>

          <section className="text-center py-16 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl border-2 border-purple-400/30">
            <h2 className="text-3xl font-bold mb-6">
              💎 Seu Manual Está Completo
            </h2>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Você tem em mãos um tesouro de conhecimento ancestral + ciência moderna.
              Agora, a transformação depende de VOCÊ.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={handleDownloadPDF}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg"
              >
                📥 Baixar PDF Completo
              </button>
              
              <p className="text-sm text-purple-300">
                Salve para ler offline sempre que precisar
              </p>
            </div>
          </section>

        </div>

        <div className="text-center mt-16 pt-8 border-t border-purple-500/20">
          <p className="text-purple-300 mb-4">
            ✨ Que sua jornada seja iluminada, {analise.nome} ✨
          </p>
          <Link href="/" className="text-purple-400 hover:text-purple-300 underline">
            Voltar para Home
          </Link>
        </div>

      </div>
    </div>
  );
}