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

export default function ResultadoPage() {
  const params = useParams();
  const [analise, setAnalise] = useState(null);
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [mostrarManual, setMostrarManual] = useState(false);

  useEffect(() => {
    async function buscarAnalise() {
      try {
        const { data, error } = await supabase
          .from('analises')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error || !data) {
          setErro('Análise não encontrada');
        } else {
          setAnalise(data);
          
          // Verificar se voltou do pagamento e se comprou o manual
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('manual') === 'true' && data.comprou_manual) {
            setMostrarManual(true);
            // Gerar manual completo
            const manualGerado = gerarManualCompleto(data);
            setManual(manualGerado);
          }
        }
      } catch (error) {
        setErro('Erro ao carregar análise');
      } finally {
        setLoading(false);
      }
    }

    buscarAnalise();
  }, [params.id]);

  const renderSecao = (secao) => {
    if (!secao) return null;
    return (
      <div className="prose prose-invert prose-lg max-w-none">
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

  const margemEsq = 15;
  const margemDir = 15;
  const larguraPagina = 210;
  const larguraTexto = larguraPagina - margemEsq - margemDir;
  const pageH = doc.internal.pageSize.getHeight();
  let y = 20;

  // Função simplificada que mantém mais conteúdo
  const limparTexto = (texto) => {
    if (!texto) return '';
    return String(texto)
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/^#{1,6}\s/gm, '') // Remove markdown headers
      .replace(/\n{3,}/g, '\n\n') // Max 2 line breaks
      .trim();
  };

  // Função que adiciona texto SEM cortar
  const adicionarTextoCompleto = (texto, tamanho = 9) => {
    if (!texto) return;
    
    doc.setFontSize(tamanho);
    doc.setTextColor(30, 30, 30);

    const textoLimpo = limparTexto(texto);
    
    // Dividir em parágrafos
    const paragrafos = textoLimpo.split('\n\n');
    
    paragrafos.forEach(paragrafo => {
      if (!paragrafo.trim()) return;
      
      // Quebrar cada parágrafo em linhas que cabem na página
      const linhas = doc.splitTextToSize(paragrafo.trim(), larguraTexto);
      
      linhas.forEach(linha => {
        // Se não cabe na página, criar nova
        if (y > pageH - 25) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(linha, margemEsq, y);
        y += 4; // Espaçamento menor entre linhas
      });
      
      y += 3; // Pequeno espaço entre parágrafos
    });
  };

  // Cabeçalho
  doc.setFontSize(16);
  doc.setTextColor(147, 51, 234);
  doc.text('MANUAL DOS PODERES OCULTOS', larguraPagina / 2, y, { align: 'center' });
  y += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Exclusivo para ${analise.nome}`, larguraPagina / 2, y, { align: 'center' });
  y += 8;
  
  doc.text(`${analise.signo} | Número ${analise.numero_vida}`, larguraPagina / 2, y, { align: 'center' });
  y += 15;

  // Log para debug - ver o que está sendo capturado
  console.log('Manual objeto:', manual);
  console.log('Introdução conteúdo length:', manual?.introducao?.conteudo?.length);

  // Array com TODAS as seções e seus conteúdos completos
  const todasSecoes = [
    {
      titulo: 'INTRODUÇÃO',
      conteudo: manual?.introducao?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'PODERES OCULTOS', 
      conteudo: manual?.poderes_ocultos?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'ARQUÉTIPOS DE PODER',
      conteudo: manual?.arquetipos?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'LINGUAGEM VIBRACIONAL',
      conteudo: manual?.linguagem?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'RITUAIS SAGRADOS',
      conteudo: manual?.rituais?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'BLOQUEIOS ENERGÉTICOS',
      conteudo: manual?.bloqueios?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'LIMPEZA ENERGÉTICA',
      conteudo: manual?.limpeza?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'SEXUALIDADE SAGRADA',
      conteudo: manual?.sexualidade?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'GEOMETRIA SAGRADA',
      conteudo: manual?.geometria?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'MAGNETISMO PESSOAL',
      conteudo: manual?.magnetismo?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'CALENDÁRIO LUNAR',
      conteudo: manual?.calendario_lunar?.conteudo || 'Conteúdo não encontrado'
    },
    {
      titulo: 'PLANO 90 DIAS',
      conteudo: manual?.plano_90_dias?.conteudo || 'Conteúdo não encontrado'
    }
  ];

  // Adicionar cada seção COMPLETA
  todasSecoes.forEach((secao, index) => {
    console.log(`Seção ${secao.titulo} - Tamanho: ${secao.conteudo.length} caracteres`);
    
    // Título da seção
    if (y > pageH - 40) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(147, 51, 234);
    doc.text(secao.titulo, margemEsq, y);
    y += 8;

    // Conteúdo COMPLETO da seção
    adicionarTextoCompleto(secao.conteudo, 8);
    
    y += 10; // Espaço entre seções
  });

  // Salvar
  doc.save(`Manual_Completo_${analise.nome.replace(/\s+/g, '_')}.pdf`);
};

  const handleComprarManual = async () => {
    setProcessandoPagamento(true);
    
    try {
      const response = await fetch('/api/criar-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: params.id })
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const { url, error } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        alert(error || 'Erro ao processar pagamento. Tente novamente.');
        setProcessandoPagamento(false);
      }
    } catch (error) {
      alert('Erro ao processar pagamento. Tente novamente.');
      setProcessandoPagamento(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando sua análise espiritual...</p>
        </div>
      </div>
    );
  }

  if (erro || !analise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Ops!</h1>
          <p className="text-xl">{erro}</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-block bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-full"
            >
              Voltar para a Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-block bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-full text-sm"
          >
            ← Home
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {mostrarManual ? 'Manual dos Poderes Ocultos' : 'Sua Análise Espiritual'}, {analise.nome}
          </h1>
          <div className="flex justify-center gap-6 text-lg">
            <span className="bg-purple-500/20 px-4 py-2 rounded-full">
              {analise.signo}
            </span>
            <span className="bg-pink-500/20 px-4 py-2 rounded-full">
              Número {analise.numero_vida}
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          
          {/* Análise Gratuita */}
          {!mostrarManual && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-500/20">
              <div className="space-y-6">
                {analise.analise_completa
                  .split('##')
                  .filter(section => section.trim())
                  .map((section, index) => {
                    const [title, ...content] = section
                      .split('\n')
                      .filter(line => line.trim());

                    return (
                      <div key={index} className="mb-8">
                        <h2 className="text-3xl font-bold mb-4 text-purple-300">
                          {title.trim()}
                        </h2>
                        <div className="space-y-4 text-purple-100 leading-relaxed text-lg">
                          {content.map((paragraph, pIndex) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;

                            if (trimmed.match(/^\d+\./)) {
                              return (
                                <div key={pIndex} className="flex gap-3 items-start">
                                  <span className="text-2xl">✨</span>
                                  <p className="flex-1">{trimmed}</p>
                                </div>
                              );
                            }

                            return <p key={pIndex} className="text-justify">{trimmed}</p>;
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-16 p-8 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl border-2 border-purple-400/30">
                <h3 className="text-2xl font-bold mb-4 text-center">
                  Quer Descobrir AINDA MAIS?
                </h3>
                <p className="text-center text-purple-200 mb-6">
                  Esta análise revelou apenas a superfície do seu mapa espiritual.
                </p>

                <div className="text-center">
                  <div className="mb-4">
                    <span className="text-gray-400 line-through text-xl">R$ 97,00</span>
                    <span className="text-4xl font-bold text-green-400 ml-4">R$ 47,00</span>
                  </div>

                  <button 
                    onClick={handleComprarManual}
                    disabled={processandoPagamento}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {processandoPagamento ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando...
                      </span>
                    ) : (
                      'Desbloquear Manual Completo'
                    )}
                  </button>

                  <p className="text-sm text-purple-300 mt-4">
                    Pagamento 100% seguro • Garantia de 7 dias
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Completo */}
          {mostrarManual && manual && (
            <div className="space-y-16">
              {/* Confirmação de Pagamento */}
              <div className="text-center p-8 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-3xl border-2 border-green-400/30">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-bold mb-4 text-green-300">
                  Pagamento Confirmado!
                </h2>
                <p className="text-xl text-green-200 mb-6">
                  Seu Manual dos Poderes Ocultos foi desbloqueado com sucesso.
                </p>
                <button 
                  onClick={handleDownloadPDF}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  📥 Baixar PDF Completo
                </button>
              </div>

              {/* Seções do Manual */}
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

              {/* Footer do Manual */}
              <div className="text-center py-16 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl border-2 border-purple-400/30">
                <h2 className="text-3xl font-bold mb-6">
                  ✨ Que sua jornada seja iluminada, {analise.nome} ✨
                </h2>
                <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
                  Você tem em mãos um tesouro de conhecimento ancestral + ciência moderna.
                  Agora, a transformação depende de VOCÊ.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}