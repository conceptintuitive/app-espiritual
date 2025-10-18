'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { gerarManualCompleto } from '@/lib/manual-completo';

export default function ManualPage() {
  const params = useParams();
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function carregarManual() {
      try {
        // Buscar análise do usuário
        const { data: analise, error } = await supabase
          .from('analises')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;

        // Verificar se comprou
        if (!analise.comprou_manual) {
          window.location.href = `/resultado/${params.id}`;
          return;
        }

        // Gerar manual completo
        const manualGerado = gerarManualCompleto(
          analise.nome,
          analise.data_nascimento,
          analise.signo,
          analise.numero_vida
        );

        setManual(manualGerado);

        // 🎯 EVENTO: Comprou manual (CONVERSÃO FINAL)
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'comprou_manual', {
            event_category: 'conversion',
            event_label: 'Manual Completo',
            value: 47.00,
            currency: 'BRL'
          });

          // Conversão do Google Ads
          window.gtag('event', 'conversion', {
            'send_to': 'AW-16938088515/XXXXX', // Substitua XXXXX pelo ID real
            'value': 47.00,
            'currency': 'BRL',
            'transaction_id': params.id
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando seu manual...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md py-6 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">
            🔮 Manual Completo - {manual.introducao?.titulo?.replace('💫 Bem vinda(o), ', '').replace(' 💫', '')}
          </h1>
        </div>
      </header>

      {/* Conteúdo do Manual */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {Object.entries(manual).map(([key, secao]) => (
          <section key={key} className="mb-16 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20">
            <h2 className="text-4xl font-bold mb-6 text-purple-300">
              {secao.titulo}
            </h2>
            <div className="prose prose-invert prose-lg max-w-none">
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {secao.conteudo}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-md py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>✨ Seu manual foi gerado com amor e tecnologia espiritual ✨</p>
        </div>
      </footer>
    </div>
  );
}