'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { gerarManualCompleto } from '@/lib/manual-completo';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ResultadoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const mostrarManual = searchParams.get('manual') === 'true';
  
  const [analise, setAnalise] = useState(null);
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  useEffect(() => {
    async function buscarAnalise() {
      console.log('ID recebido:', params.id);
      
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
          
          // Se voltou do pagamento, gerar manual completo
          if (mostrarManual) {
            const manualGerado = gerarManualCompleto(
              data.nome,
              data.data_nascimento,
              data.signo,
              data.numero_vida
            );
            setManual(manualGerado);
          }
        }
      } catch (error) {
        setErro('Erro ao carregar análise');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      buscarAnalise();
    }
  }, [params.id, mostrarManual]);

  const handleComprarManual = async () => {
    setProcessandoPagamento(true);
    
    try {
      const response = await fetch('/api/criar-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analiseId: params.id })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao processar pagamento. Tente novamente.');
      }
    } catch (error) {
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessandoPagamento(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando...</p>
        </div>
      </div>
    );
  }

  if (erro || !analise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h1 className="text-3xl font-bold mb-4">Ops!</h1>
          <p className="text-xl mb-4">{erro}</p>
          <a href="/" className="text-purple-300 hover:text-purple-200 underline">
            Voltar para a Home
          </a>
        </div>
      </div>
    );
  }

  // RENDERIZAR MANUAL COMPLETO
  if (mostrarManual && manual) {
    const renderSecao = (secao) => {
      if (!secao || !secao.conteudo) return null;
      return (
        <div className="mb-12" key={secao.titulo}>
          <h2 className="text-3xl font-bold mb-6 text-purple-300 border-b-2 border-purple-500/30 pb-3">
            {secao.titulo}
          </h2>
          <div 
            className="prose prose-invert prose-lg max-w-none"
            style={{ fontSize: '16px', lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{ 
              __html: secao.conteudo
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300">$1</strong>')
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>')
            }}
          />
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎉 Manual Completo Desbloqueado!
            </h1>
            <p className="text-2xl text-purple-200 mb-6">
              {analise.nome}, seu guia espiritual completo
            </p>
            <div className="flex justify-center gap-6 text-lg">
              <span className="bg-purple-500/20 px-6 py-3 rounded-full">
                {analise.signo}
              </span>
              <span className="bg-pink-500/20 px-6 py-3 rounded-full">
                Número {analise.numero_vida}
              </span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-16 shadow-2xl border border-purple-500/20">
              {Object.values(manual).map((secao, index) => {
                if (secao && secao.titulo && secao.conteudo) {
                  return renderSecao(secao);
                }
                return null;
              })}

              <div className="mt-16 pt-12 border-t border-purple-500/20 text-center">
                <button
                  onClick={() => window.print()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl mr-4"
                >
                  📄 Imprimir
                </button>
                <p className="text-purple-300 text-sm mt-6">
                  ✨ Guarde este manual em um local sagrado
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <a href="/" className="text-purple-300 hover:text-purple-200 underline">
              ← Fazer nova análise
            </a>
          </div>
        </div>
      </div>
    );
  }

  // RENDERIZAR ANÁLISE GRATUITA
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Sua Análise Espiritual, {analise.nome}
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
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-500/20">
            <div className="prose prose-invert prose-lg max-w-none whitespace-pre-wrap">
              {analise.analise_completa}
            </div>

            <div className="mt-16 p-8 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl border-2 border-purple-400/30">
              <h3 className="text-2xl font-bold mb-4 text-center">
                🔮 Quer Descobrir AINDA MAIS?
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
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {processandoPagamento ? '⏳ Processando...' : '🚀 Desbloquear Manual Completo'}
                </button>
                
                <p className="text-sm text-purple-300 mt-4">
                  🔒 Pagamento seguro • ✅ Garantia 7 dias
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-purple-300 hover:text-purple-200 underline">
            ← Fazer nova análise
          </a>
        </div>
      </div>
    </div>
  );
}