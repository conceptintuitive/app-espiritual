'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ResultadoPage() {
  const params = useParams();
  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

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
        }
      } catch (error) {
        setErro('Erro ao carregar análise');
      } finally {
        setLoading(false);
      }
    }

    buscarAnalise();
  }, [params.id]);

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
        </div>
      </div>
    );
  }

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
            
            <div className="space-y-6">
              {analise.analise_completa.split('##').filter(section => section.trim()).map((section, index) => {
                const [title, ...content] = section.split('\n').filter(line => line.trim());
                
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
                
                <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg">
                  Desbloquear Manual Completo
                </button>
                
                <p className="text-sm text-purple-300 mt-4">
                  Pagamento 100% seguro • Garantia de 7 dias
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-purple-300 hover:text-purple-200 underline">
            Fazer nova análise
          </Link>
        </div>

      </div>
    </div>
  );
}