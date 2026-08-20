// lib/assistente.js
// Assistente de IA conversacional, contextual ao mapa (numerologia + astrologia)
// de cada análise. Diferente de lib/ia.js (que gera as seções fixas do manual em
// JSON estruturado), aqui a resposta é texto livre, curto, pra uma pergunta aberta.

const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(apiKey, body, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < maxRetries) continue;
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[Assistente] Groq erro HTTP:', res.status, txt.slice(0, 200));
      return null;
    }
    return res;
  }
  return null;
}

function buildSystemPrompt(perfil) {
  const pontos = [
    perfil.signo && `Sol em ${perfil.signo}`,
    perfil.signo_lua && `Lua em ${perfil.signo_lua}`,
    perfil.signo_ascendente && `Ascendente em ${perfil.signo_ascendente}`,
    perfil.signo_venus && `Vênus em ${perfil.signo_venus}`,
    perfil.signo_marte && `Marte em ${perfil.signo_marte}`,
  ].filter(Boolean).join(', ');

  const numeros = [
    perfil.numero_vida && `Número de Vida ${perfil.numero_vida}`,
    perfil.numero_alma && `Número da Alma ${perfil.numero_alma}`,
    perfil.numero_expressao && `Expressão ${perfil.numero_expressao}`,
    perfil.ano_pessoal && `Ano Pessoal ${perfil.ano_pessoal}`,
  ].filter(Boolean).join(', ');

  return `Você é o assistente do Intuitive Concept, especializado em interpretar o mapa espiritual (numerologia + astrologia) de ${perfil.nome || 'a pessoa'} a partir dos dados reais dela.

Mapa astral: ${pontos || 'não informado'}.
Numerologia: ${numeros || 'não informado'}.
Objetivo declarado por ela: ${perfil.objetivo_principal || 'não informado'}.

Regras:
- Responda SEMPRE em português brasileiro, em 2ª pessoa ("você"), tom próximo, direto e específico — conecte a resposta aos dados concretos do mapa dela, nunca genérico de horóscopo de jornal.
- Respostas curtas: no máximo ~120 palavras.
- Não invente dados do mapa que não foram informados acima.
- Se a pergunta for sobre diagnóstico médico, aconselhamento financeiro de risco, ou qualquer coisa fora do escopo espiritual/comportamental, redirecione com gentileza sem responder o pedido.`;
}

// perfil: linha da tabela `analises` (ou subconjunto dos campos usados acima)
// historico: array [{ role: 'user'|'assistant', content }] em ordem cronológica
// pergunta: string da nova pergunta
export async function responderPergunta({ perfil, historico, pergunta }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[Assistente] GROQ_API_KEY não configurada');
    return null;
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(perfil || {}) },
    ...(Array.isArray(historico) ? historico : []).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: pergunta },
  ];

  const res = await callGroq(apiKey, {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 400,
  });
  if (!res) return null;

  const data = await res.json().catch(() => null);
  return data?.choices?.[0]?.message?.content?.trim() || null;
}
