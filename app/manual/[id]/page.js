'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { gerarManualCompleto } from '@/lib/manual-completo';

export default function ManualPage() {
  const params = useParams();
  const [manual, setManual] = useState(null);
  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secaoAtual, setSecaoAtual] = useState(0);
  const [tamanhoFonte, setTamanhoFonte] = useState('text-lg');
  const [lendoAudio, setLendoAudio] = useState(false);
  const [audioDisponivel, setAudioDisponivel] = useState(false);
  const supabase = createClientComponentClient();

  const handleCompartilhar = async () => {
    const textoCompartilhar = `Descobri meu propósito de vida com o Manual dos Poderes Ocultos! 🔮✨`;
    const urlCompartilhar = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Manual dos Poderes Ocultos',
          text: textoCompartilhar,
          url: urlCompartilhar
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Erro ao compartilhar:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(urlCompartilhar);
        alert('✅ Link copiado para área de transferência!');
      } catch (error) {
        console.log('Erro ao copiar:', error);
        alert('❌ Não foi possível copiar o link.');
      }
    }
  };

  useEffect(() => {
    async function carregarManual() {
      try {
        const { data: analise, error } = await supabase
          .from('analises')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;

        // Comentado temporariamente para teste
        // if (!analise.comprou_manual) {
        //   window.location.href = `/resultado/${params.id}`;
        //   return;
        // }

        setAnalise(analise);

        const manualGerado = gerarManualCompleto(
          analise.nome,
          analise.data_nascimento,
          analise.signo,
          analise.numero_vida
        );

        setManual(manualGerado);

        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'comprou_manual', {
            event_category: 'conversion',
            event_label: 'Manual Completo',
            value: 47.00,
            currency: 'BRL'
          });
        }

      } catch (error) {
        console.error('Erro ao carregar manual:', error);
        alert('Erro ao carregar manual. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    carregarManual();
  }, [params.id, supabase]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setAudioDisponivel(true);
    }
  }, []);

  const handleDownloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const elemento = document.getElementById('manual-content');
      
      if (!elemento) {
        alert('Conteúdo não encontrado');
        return;
      }

      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#1a0b2e'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`manual-completo-${analise?.nome || 'espiritual'}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleLerTexto = () => {
    if (!audioDisponivel) {
      alert('Seu navegador não suporta leitura de áudio.');
      return;
    }

    if (lendoAudio) {
      window.speechSynthesis.cancel();
      setLendoAudio(false);
      return;
    }

    const secoes = Object.entries(manual);
    const [chave, secao] = secoes[secaoAtual];
    const texto = `${secao.titulo}. ${secao.conteudo}`;

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setLendoAudio(true);
    utterance.onend = () => setLendoAudio(false);
    utterance.onerror = () => {
      setLendoAudio(false);
      alert('Erro ao ler texto.');
    };

    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">✨ Preparando seu Manual Sagrado...</p>
        </div>
      </div>
    );
  }

  if (!manual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
        <div className="text-center text-white">
          <h1 className="text-4xl mb-4">❌ Erro</h1>
          <p>Não foi possível carregar o manual.</p>
        </div>
      </div>
    );
  }

  const secoes = Object.entries(manual);
  const [chave, secao] = secoes[secaoAtual];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      
      <header className="bg-black/80 backdrop-blur-md py-4 sticky top-0 z-50 border-b border-purple-500/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h1 className="text-2xl font-bold">🔮 Seu Manual Espiritual</h1>
            
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={handleCompartilhar}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-all"
              >
                📤 Compartilhar
              </button>

              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-xs">Texto:</span>
                <button
                  onClick={() => setTamanhoFonte('text-base')}
                  className={`px-2 py-1 rounded text-sm transition-all ${tamanhoFonte === 'text-base' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setTamanhoFonte('text-lg')}
                  className={`px-2 py-1 rounded text-base transition-all ${tamanhoFonte === 'text-lg' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setTamanhoFonte('text-xl')}
                  className={`px-2 py-1 rounded text-lg transition-all ${tamanhoFonte === 'text-xl' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setTamanhoFonte('text-2xl')}
                  className={`px-2 py-1 rounded text-xl transition-all ${tamanhoFonte === 'text-2xl' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  A
                </button>
              </div>

<button
  onClick={handleLerTexto}
  className={`px-4 py-2 rounded-lg text-sm transition-all ${
    lendoAudio 
      ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
      : 'bg-green-600 hover:bg-green-700'
  }`}
>
  {lendoAudio ? '⏸️ Pausar' : '🔊 Ouvir'}
</button>

              <button 
                onClick={() => window.print()}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-all"
              >
                📄 Imprimir
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg text-sm transition-all"
              >
                💾 Baixar PDF
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${((secaoAtual + 1) / secoes.length) * 100}%` }}
              />
            </div>
            <p className="text-center text-sm mt-2 text-purple-300">
              Seção {secaoAtual + 1} de {secoes.length}
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        
        <div 
          id="manual-content"
          className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-16 shadow-2xl border-2 border-purple-500/30 mb-8"
        >
          
          <div className="text-center mb-12">
            <div className="inline-block bg-purple-600/30 px-6 py-2 rounded-full mb-6">
              <span className="text-sm uppercase tracking-wider">Capítulo {secaoAtual + 1}</span>
            </div>
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {secao.titulo}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
          </div>

          <div className="prose prose-invert max-w-none">
<div 
  className={`leading-relaxed`}
  style={{ 
    whiteSpace: 'pre-wrap', 
    lineHeight: '1.8',
    fontSize: '20px',
    fontWeight: '400'
  }}
>
              {secao.conteudo}
            </div>
          </div>

          <div className="flex justify-between items-center mt-16 pt-8 border-t border-purple-500/30 flex-wrap gap-4">
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setLendoAudio(false);
                setSecaoAtual(Math.max(0, secaoAtual - 1));
              }}
              disabled={secaoAtual === 0}
              className="bg-purple-600/50 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold transition-all"
            >
              ← Anterior
            </button>

            <div className="text-center">
              <p className="text-purple-300 text-sm mb-2">Progresso</p>
              <p className="text-2xl font-bold">{Math.round(((secaoAtual + 1) / secoes.length) * 100)}%</p>
            </div>

            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setLendoAudio(false);
                setSecaoAtual(Math.min(secoes.length - 1, secaoAtual + 1));
              }}
              disabled={secaoAtual === secoes.length - 1}
              className="bg-pink-600/50 hover:bg-pink-600 disabled:opacity-30 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold transition-all"
            >
              Próximo →
            </button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
          <h3 className="text-xl font-bold mb-4 text-purple-300">📚 Índice do Manual</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {secoes.map(([key, sec], index) => (
              <button
                key={key}
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setLendoAudio(false);
                  setSecaoAtual(index);
                }}
                className={`text-left p-3 rounded-lg transition-all ${
                  index === secaoAtual 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white/5 hover:bg-white/10 text-purple-200'
                }`}
              >
                <span className="text-sm opacity-70">Cap. {index + 1}</span>
                <p className="font-semibold text-sm">{sec.titulo}</p>
              </button>
            ))}
          </div>
        </div>

        {secaoAtual === secoes.length - 1 && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-2xl p-8 mt-8 border-2 border-green-500/50 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold mb-4 text-green-300">
              Parabéns! Você Completou Seu Manual Espiritual
            </h3>
            <p className="text-xl text-green-200 mb-6">
              Você deu o primeiro passo na sua jornada de transformação.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button 
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setLendoAudio(false);
                  setSecaoAtual(0);
                }}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold transition-all"
              >
                🔄 Reler do Início
              </button>
              <button 
                onClick={handleCompartilhar}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all"
              >
                📤 Compartilhar
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold transition-all"
              >
                💾 Salvar em PDF
              </button>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer className="bg-black/50 backdrop-blur-md py-8 mt-12 border-t border-purple-500/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-purple-300 mb-4">✨ Seu manual foi criado com amor e tecnologia espiritual ✨</p>
          <div className="flex justify-center gap-4 text-sm text-purple-400 flex-wrap">
            <a href="/" className="hover:text-purple-200 transition-colors">Nova Análise</a>
            <span>•</span>
            <a href={`/resultado/${params.id}`} className="hover:text-purple-200 transition-colors">Ver Resumo</a>
            <span>•</span>
            <button onClick={handleCompartilhar} className="hover:text-purple-200 transition-colors">
              Compartilhar
            </button>
            <span>•</span>
            <button onClick={handleDownloadPDF} className="hover:text-purple-200 transition-colors">
              Download PDF
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}