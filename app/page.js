'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    dataNascimento: '',
    horaNascimento: '',
    cidade: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await fetch('/api/gerar-analise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      // ✅ LOGS DE DEBUG
      console.log('Status da resposta:', response.status);
      console.log('Dados retornados:', data);

      if (data.ok || data.success) {
        const id = data.id || data.analiseId;
        console.log('ID encontrado:', id);
        router.push(`/resultado/${id}`);
      } else {
        console.log('Caiu no else, mostrando erro');
        setErro(data.error || 'Erro ao gerar análise');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro no catch:', error);
      setErro('Erro ao processar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ✨ Desvende Seu Mapa Espiritual
          </h1>
          <p className="text-xl text-purple-200">
            Descubra os segredos da sua alma através da Numerologia e Astrologia
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-purple-500/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome"
                required
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-white placeholder-purple-300"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-white placeholder-purple-300"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200">
                Data de Nascimento *
              </label>
              <input
                type="text"
                name="dataNascimento"
                required
                value={formData.dataNascimento}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-white placeholder-purple-300"
                placeholder="DD/MM/AAAA"
              />
              <p className="text-xs text-purple-300 mt-1">Formato: 15/03/1990</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200">
                Hora de Nascimento (opcional)
              </label>
              <input
                type="text"
                name="horaNascimento"
                value={formData.horaNascimento}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-white placeholder-purple-300"
                placeholder="14:30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200">
                Cidade de Nascimento (opcional)
              </label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-white placeholder-purple-300"
                placeholder="São Paulo, SP"
              />
            </div>

            {erro && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gerando sua análise espiritual...
                </span>
              ) : (
                '✨ Revelar Meu Mapa Espiritual'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-purple-300">
            <p>🔒 Seus dados estão seguros e protegidos</p>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="font-bold mb-2">Numerologia Precisa</h3>
            <p className="text-purple-300 text-sm">Descubra seu Número da Vida e missão</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🔮</div>
            <h3 className="font-bold mb-2">Mapa Astral</h3>
            <p className="text-purple-300 text-sm">Entenda suas energias cósmicas</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="font-bold mb-2">100% Personalizado</h3>
            <p className="text-purple-300 text-sm">Análise única gerada para você</p>
          </div>
        </div>
      </div>
    </div>
  );
}