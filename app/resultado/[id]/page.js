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
  const [mostrarUrgencia, setMostrarUrgencia] = useState(false);

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
          
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'visualizou_resultado', {
              event_category: 'engagement',
              event_label: 'Página de Resultado',
              value: 1
            });
          }
          
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

    // Mostrar urgência após 30 segundos
    const timer = setTimeout(() => {
      setMostrarUrgencia(true);
    }, 30000);

    return () => clearTimeout(timer);
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
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'iniciou_checkout', {
            event_category: 'ecommerce',
            event_label: 'Botão Comprar Manual',
            value: 47.00,
            currency: 'BRL'
          });
        }
        
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

  // RENDERIZAR MANUAL COMPLETO (mantém igual)
  if (mostrarManual && manual) {
    // ... código do manual permanece igual
  }

  // RENDERIZAR ANÁLISE GRATUITA + OFERTA IRRESISTÍVEL
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        
        {/* Alerta de Urgência Flutuante */}
        {mostrarUrgencia && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl border-2 border-red-400">
              ⚠️ ATENÇÃO: Esta oferta expira em breve!
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {analise.nome}, Sua Jornada Espiritual Começa Aqui...
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
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-500/20 mb-8">
            <div className="prose prose-invert prose-lg max-w-none whitespace-pre-wrap">
              {analise.analise_completa}
            </div>
          </div>

          {/* SEÇÃO DE VENDAS REFORMULADA */}
          
          {/* 1. PROVA SOCIAL */}
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-2xl p-6 mb-8 border border-green-500/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">⭐⭐⭐⭐⭐</div>
              <div>
                <p className="text-xl font-bold text-green-300">4.9/5 - Mais de 2.847 pessoas</p>
                <p className="text-green-200 text-sm">já transformaram suas vidas com o Manual Completo</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-sm italic">"Finalmente entendi meu propósito! Incrível!" - Maria S.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-sm italic">"Mudou completamente minha visão sobre mim mesma" - Ana P.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-sm italic">"Valeu MUITO mais que R$47. Sem palavras!" - João M.</p>
              </div>
            </div>
          </div>

          {/* 2. REVELAÇÃO DO PROBLEMA */}
          <div className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-center mb-6 text-red-300">
              ⚠️ {analise.nome}, Você Está Vendo Apenas 10% do Seu Potencial
            </h2>
            
            <p className="text-xl text-center mb-6 text-red-200">
              A análise gratuita que você acabou de ler é como ver apenas a ponta do iceberg...
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-red-950/50 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-3 text-red-300">❌ O Que Você NÃO Sabe Ainda:</h3>
                <ul className="space-y-2 text-red-200">
                  <li>✗ Seus <strong>bloqueios ocultos</strong> que te impedem de evoluir</li>
                  <li>✗ Como <strong>atrair abundância</strong> usando sua numerologia</li>
                  <li>✗ Seus <strong>talentos escondidos</strong> que o universo quer revelar</li>
                  <li>✗ O <strong>propósito real</strong> da sua alma nesta vida</li>
                  <li>✗ Como transformar <strong>desafios em oportunidades</strong></li>
                </ul>
              </div>

              <div className="bg-green-950/50 p-6 rounded-xl border-2 border-green-500/50">
                <h3 className="text-xl font-bold mb-3 text-green-300">✅ O Que Você Vai Descobrir:</h3>
                <ul className="space-y-2 text-green-200">
                  <li>✓ <strong>Mapa completo</strong> da sua jornada espiritual</li>
                  <li>✓ <strong>Previsões personalizadas</strong> para 2025 e 2026</li>
                  <li>✓ <strong>Rituais e práticas</strong> exclusivas para seu número</li>
                  <li>✓ Como <strong>desbloquear sua prosperidade</strong> espiritual</li>
                  <li>✓ <strong>Guia completo</strong> de autoconhecimento (50+ páginas)</li>
                </ul>
              </div>
            </div>

            <p className="text-center text-xl text-yellow-300 font-bold animate-pulse">
              🔥 Esta é a única chance de acessar seu mapa completo por este preço!
            </p>
          </div>

          {/* 3. ESCASSEZ E URGÊNCIA */}
          <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-2xl p-6 mb-8 border border-orange-500/30">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-300 mb-2">
                ⏰ OFERTA EXCLUSIVA - APENAS PARA VOCÊ
              </p>
              <p className="text-orange-200 mb-4">
                Esta análise personalizada foi gerada AGORA e este preço especial expira em:
              </p>
              <div className="flex justify-center gap-4 text-3xl font-bold text-white mb-4">
                <div className="bg-red-600 px-6 py-4 rounded-lg">
                  <div>23</div>
                  <div className="text-sm">horas</div>
                </div>
                <div className="bg-red-600 px-6 py-4 rounded-lg">
                  <div>47</div>
                  <div className="text-sm">min</div>
                </div>
              </div>
              <p className="text-sm text-orange-300">
                Depois disso, volta para R$ 197,00
              </p>
            </div>
          </div>

          {/* 4. OFERTA IRRESISTÍVEL */}
          <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-purple-400/50 mb-8">
            <h2 className="text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              🎁 DESBLOQUEIE SEU MANUAL COMPLETO AGORA
            </h2>

            {/* Comparação de Valor */}
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-bold mb-4 text-center">O Que Você Está Levando:</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span>✨ Manual Espiritual Completo (50+ páginas)</span>
                  <span className="font-bold text-green-400">R$ 97</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span>🔮 Análise Numerológica Profunda</span>
                  <span className="font-bold text-green-400">R$ 67</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span>⭐ Previsões Personalizadas 2025/2026</span>
                  <span className="font-bold text-green-400">R$ 57</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span>💎 Rituais e Práticas Exclusivas</span>
                  <span className="font-bold text-green-400">R$ 47</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span>🎯 Guia de Propósito de Vida</span>
                  <span className="font-bold text-green-400">R$ 37</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold pt-4">
                  <span>VALOR TOTAL:</span>
                  <span className="line-through text-red-400">R$ 305</span>
                </div>
              </div>
            </div>

            {/* Preço Final */}
            <div className="text-center mb-8">
              <p className="text-lg text-gray-300 mb-2">De R$ 305 por apenas:</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-3xl text-gray-400 line-through">R$ 197,00</span>
                <span className="text-6xl font-bold text-green-400 animate-pulse">R$ 47</span>
              </div>
              <p className="text-xl text-yellow-300 font-bold mb-2">
                🔥 ECONOMIA DE 84% - Apenas Hoje!
              </p>
              <p className="text-sm text-purple-300">
                Ou 12x de R$ 4,58 no cartão
              </p>
            </div>

            {/* CTA Principal */}
            <button 
              onClick={handleComprarManual}
              disabled={processandoPagamento}
              className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-black py-6 px-8 rounded-2xl text-2xl transition-all transform hover:scale-105 shadow-2xl cursor-pointer disabled:opacity-50 mb-4 border-4 border-green-400 animate-pulse"
            >
              {processandoPagamento ? '⏳ Processando...' : '🚀 SIM! QUERO MEU MANUAL COMPLETO AGORA'}
            </button>

            {/* Garantia */}
            <div className="bg-green-900/30 rounded-xl p-6 border-2 border-green-500/50">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🛡️</div>
                <div>
                  <p className="font-bold text-xl text-green-300 mb-2">
                    GARANTIA INCONDICIONAL DE 7 DIAS
                  </p>
                  <p className="text-green-200">
                    Se por QUALQUER motivo você não ficar 100% satisfeito, devolvemos seu dinheiro. Sem perguntas, sem burocracia.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-purple-300">
                🔒 Pagamento 100% Seguro • ✅ Acesso Imediato • 💳 Parcelamento em até 12x
              </p>
            </div>
          </div>

          {/* 5. PERGUNTAS RESPONDIDAS */}
          <div className="bg-white/5 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6 text-center">❓ Perguntas Frequentes</h3>
            
            <div className="space-y-4">
              <details className="bg-white/5 p-4 rounded-lg cursor-pointer">
                <summary className="font-bold text-lg">Quando vou receber meu manual?</summary>
                <p className="mt-2 text-purple-200">Imediatamente após a confirmação do pagamento! O acesso é instantâneo.</p>
              </details>

              <details className="bg-white/5 p-4 rounded-lg cursor-pointer">
                <summary className="font-bold text-lg">Como funciona a garantia?</summary>
                <p className="mt-2 text-purple-200">Você tem 7 dias para pedir 100% do seu dinheiro de volta. Sem perguntas, sem burocracia.</p>
              </details>

              <details className="bg-white/5 p-4 rounded-lg cursor-pointer">
                <summary className="font-bold text-lg">Posso parcelar?</summary>
                <p className="mt-2 text-purple-200">Sim! Aceitamos parcelamento em até 12x no cartão de crédito.</p>
              </details>

              <details className="bg-white/5 p-4 rounded-lg cursor-pointer">
                <summary className="font-bold text-lg">É realmente personalizado para mim?</summary>
                <p className="mt-2 text-purple-200">SIM! Cada manual é único, gerado especificamente com base na SUA data de nascimento e informações.</p>
              </details>
            </div>
          </div>

          {/* 6. ÚLTIMO EMPURRÃO */}
          <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-2xl p-8 border-2 border-red-500/50 text-center">
            <h3 className="text-3xl font-bold mb-4 text-red-300">
              ⚡ Última Chance, {analise.nome}
            </h3>
            <p className="text-xl mb-6 text-red-200">
              Você tem duas escolhas agora:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-red-950/50 p-6 rounded-xl border border-red-500/30">
                <h4 className="text-2xl font-bold mb-3 text-red-400">❌ Fechar Esta Página</h4>
                <p className="text-red-200">
                  E continuar sem saber seu verdadeiro propósito, seus talentos ocultos, e como desbloquear sua prosperidade espiritual...
                </p>
              </div>

              <div className="bg-green-950/50 p-6 rounded-xl border-2 border-green-500/50">
                <h4 className="text-2xl font-bold mb-3 text-green-400">✅ Investir em Você</h4>
                <p className="text-green-200">
                  E descobrir o mapa completo da sua jornada espiritual, com previsões personalizadas e rituais que vão transformar sua vida.
                </p>
              </div>
            </div>

            <button 
              onClick={handleComprarManual}
              disabled={processandoPagamento}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-6 px-12 rounded-2xl text-2xl transition-all transform hover:scale-105 shadow-2xl cursor-pointer disabled:opacity-50"
            >
              {processandoPagamento ? '⏳ Processando...' : '💎 SIM, QUERO TRANSFORMAR MINHA VIDA AGORA'}
            </button>

            <p className="text-yellow-300 font-bold mt-6 text-lg animate-pulse">
              🔥 Restam apenas 3 vagas com este preço promocional!
            </p>
          </div>

        </div>

        <div className="text-center mt-12">
          <a href="/" className="text-purple-300 hover:text-purple-200 underline text-sm">
            ← Fazer nova análise
          </a>
        </div>
      </div>
    </div>
  );
}