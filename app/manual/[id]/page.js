'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { gerarManualCompleto } from '@/lib/manual-completo';

// Componente para renderizar previsões de forma interativa
function SecaoPrevisoesInterativa({ conteudo }) {
  const [expandido2025, setExpandido2025] = useState(false);
  const [expandido2026, setExpandido2026] = useState(false);
  
  // Extrair informações do conteúdo
  const match2025 = conteudo.match(/2025 - Ano Pessoal (\d+)[^\n]*\n([^\n]+)\n\n\*\*Energia do Ano:\*\*\n([^\n]+)\n\n\*\*Onde Focar:\*\*\n([^\n]+)/);
  const match2026 = conteudo.match(/2026 - Ano Pessoal (\d+)[^\n]*\n([^\n]+)\n\n\*\*Energia do Ano:\*\*\n([^\n]+)\n\n\*\*Onde Focar:\*\*\n([^\n]+)/);
  
  const dados2025 = match2025 ? {
    ano: match2025[1],
    tema: match2025[2],
    energia: match2025[3],
    foco: match2025[4]
  } : null;

  const dados2026 = match2026 ? {
    ano: match2026[1],
    tema: match2026[2],
    energia: match2026[3],
    foco: match2026[4]
  } : null;

  if (!dados2025 || !dados2026) {
    return (
      <section className="mb-16 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20">
        <div className="prose prose-invert prose-lg max-w-none">
          <div style={{ whiteSpace: 'pre-wrap' }}>{conteudo}</div>
        </div>
      </section>
    );
  }

  const trimestres2025 = [
    "Cuide das relações importantes. Isso será sua âncora o ano todo. Família é prioridade.",
    "Acelere! Seus projetos ganham momentum. A energia está A FAVOR. Seja visível.",
    "Meio do ano — momento de revisar rotas e ajustar o que não está funcionando.",
    "Celebre o que construiu! Agradeça pelos aprendizados. Prepare-se para 2026."
  ];

  const trimestres2026 = [
    "Ano de introspecção profunda. Medite, estude, conecte-se consigo. Solidão é sagrada agora.",
    "Sabedoria se aprofunda. Insights chegam em meditação. Continue na jornada interna.",
    "Aprofunde ainda mais. Os mistérios se revelam camada por camada. Paciência com o processo.",
    "Sabedoria PROFUNDA adquirida. Você não é mais quem era. Prepare-se para 2027!"
  ];

  return (
    <div className="mb-16">
      <div className="bg-gradient-to-br from-purple-950/80 via-indigo-950/80 to-black/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/30">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            📅 Previsões Numerológicas
          </h2>
          <p className="text-purple-300 text-xl">Sua jornada para 2025 e 2026</p>
        </div>

        {/* Card 2025 */}
        <div className="bg-gradient-to-br from-purple-900/60 to-indigo-900/60 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-4xl font-bold text-white mb-2">
                2025 - Ano Pessoal {dados2025.ano}
              </h3>
              <p className="text-2xl text-purple-300 font-semibold">
                {dados2025.tema}
              </p>
            </div>
            <button
              onClick={() => setExpandido2025(!expandido2025)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 whitespace-nowrap"
            >
              {expandido2025 ? '👆 Recolher' : '👇 Ver Detalhes'}
            </button>
          </div>

          <div className="bg-black/30 rounded-xl p-6 mb-6">
            <p className="text-purple-200 leading-relaxed">
              <strong className="text-purple-400">Energia:</strong> {dados2025.energia}
            </p>
            <p className="text-purple-200 leading-relaxed mt-3">
              <strong className="text-purple-400">Foco:</strong> {dados2025.foco}
            </p>
          </div>

          {expandido2025 && (
            <div className="mt-8 space-y-6">
              <TimelineCardInterativo numero="1" titulo="Janeiro-Março (Plantio)" conteudo={trimestres2025[0]} cor="from-green-600 to-emerald-600" />
              <TimelineCardInterativo numero="2" titulo="Abril-Junho (Crescimento)" conteudo={trimestres2025[1]} cor="from-blue-600 to-cyan-600" />
              <TimelineCardInterativo numero="3" titulo="Julho-Setembro (Ajustes)" conteudo={trimestres2025[2]} cor="from-orange-600 to-amber-600" />
              <TimelineCardInterativo numero="4" titulo="Outubro-Dezembro (Colheita)" conteudo={trimestres2025[3]} cor="from-purple-600 to-pink-600" />
            </div>
          )}
        </div>

        {/* Card 2026 */}
        <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-4xl font-bold text-white mb-2">
                2026 - Ano Pessoal {dados2026.ano}
              </h3>
              <p className="text-2xl text-purple-300 font-semibold">
                {dados2026.tema}
              </p>
            </div>
            <button
              onClick={() => setExpandido2026(!expandido2026)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 whitespace-nowrap"
            >
              {expandido2026 ? '👆 Recolher' : '👇 Ver Detalhes'}
            </button>
          </div>

          <div className="bg-black/30 rounded-xl p-6 mb-6">
            <p className="text-purple-200 leading-relaxed">
              <strong className="text-purple-400">Energia:</strong> {dados2026.energia}
            </p>
            <p className="text-purple-200 leading-relaxed mt-3">
              <strong className="text-purple-400">Foco:</strong> {dados2026.foco}
            </p>
          </div>

          {expandido2026 && (
            <div className="mt-8 space-y-6">
              <TimelineCardInterativo numero="1" titulo="Janeiro-Março (Plantio)" conteudo={trimestres2026[0]} cor="from-green-600 to-emerald-600" />
              <TimelineCardInterativo numero="2" titulo="Abril-Junho (Crescimento)" conteudo={trimestres2026[1]} cor="from-blue-600 to-cyan-600" />
              <TimelineCardInterativo numero="3" titulo="Julho-Setembro (Ajustes)" conteudo={trimestres2026[2]} cor="from-orange-600 to-amber-600" />
              <TimelineCardInterativo numero="4" titulo="Outubro-Dezembro (Colheita)" conteudo={trimestres2026[3]} cor="from-purple-600 to-pink-600" />
            </div>
          )}

          {dados2026.ano === '1' && (
            <div className="mt-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl p-6">
              <h4 className="text-2xl font-bold text-yellow-400 mb-3">🎉 2026 É SEU ANO DE RENASCIMENTO!</h4>
              <p className="text-white">Você inicia um NOVO CICLO DE 9 ANOS. Tudo que plantar em 2026 se desenvolve pelos próximos 9 anos.</p>
            </div>
          )}

          {dados2026.ano === '9' && (
            <div className="mt-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 rounded-2xl p-6">
              <h4 className="text-2xl font-bold text-blue-400 mb-3">🌊 2026 É SEU ANO DE ENCERRAMENTO!</h4>
              <p className="text-white">Você FINALIZA um ciclo de 9 anos. É hora de liberar profundamente o que não te serve mais.</p>
            </div>
          )}
        </div>

        <details className="mt-8">
          <summary className="text-purple-300 text-lg cursor-pointer hover:text-purple-200 transition">
            📖 Ver análise completa em texto
          </summary>
          <div className="mt-6 prose prose-invert prose-lg max-w-none">
            <div style={{ whiteSpace: 'pre-wrap' }}>{conteudo}</div>
          </div>
        </details>
      </div>
    </div>
  );
}

function TimelineCardInterativo({ numero, titulo, conteudo, cor }) {
  return (
    <div className={`bg-gradient-to-r ${cor} rounded-xl p-6 transform hover:scale-102 transition-all duration-300 hover:shadow-2xl`}>
      <div className="flex items-start gap-4">
        <div className="bg-white/20 backdrop-blur rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">{numero}</span>
        </div>
        <div className="flex-1">
          <h4 className="text-xl font-bold text-white mb-3">{titulo}</h4>
          <p className="text-white/90 leading-relaxed">{conteudo}</p>
        </div>
      </div>
    </div>
  );
}

export default function ManualPage() {
  const params = useParams();
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function carregarManual() {
      try {
        const { data: analise, error } = await supabase
          .from('analises')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;

        if (!analise.comprou_manual) {
          window.location.href = `/resultado/${params.id}`;
          return;
        }

        const manualGerado = gerarManualCompleto(
          analise.nome,
          analise.data_nascimento,
          analise.signo,
          analise.numero_vida
        );

        setManual(manualGerado);
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar manual.');
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
      <header className="bg-black/50 backdrop-blur-md py-6 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            🔮 {manual.introducao?.titulo?.replace('💫 Bem vinda(o), ', '').replace(' 💫', '')}
          </h1>
          
          <button
            onClick={() => {
              const texto = `✨ Acabei de receber meu Manual dos Poderes Ocultos personalizado! 🔮\n\nAnálise completa de Numerologia + Astrologia + Previsões 2025/2026.\n\nConfere: ${window.location.href}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartilhar
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {Object.entries(manual).map(([key, secao]) => {
          if (key === 'analise_numerologica') {
            return <SecaoPrevisoesInterativa key={key} conteudo={secao.conteudo} />;
          }

          return (
            <section key={key} className="mb-16 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20">
              <h2 className="text-4xl font-bold mb-6 text-purple-300">{secao.titulo}</h2>
              <div className="prose prose-invert prose-lg max-w-none">
                <div style={{ whiteSpace: 'pre-wrap' }}>{secao.conteudo}</div>
              </div>
            </section>
          );
        })}
      </div>

      <footer className="bg-black/50 backdrop-blur-md py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>✨ Seu manual foi gerado com amor e tecnologia espiritual ✨</p>
        </div>
      </footer>
    </div>
  );
}