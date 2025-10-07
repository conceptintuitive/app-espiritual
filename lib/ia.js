export async function gerarAnaliseEspiritual(dados) {
  const { nome, signo, numeroVida, significado, perfilSigno } = dados;
  
  const prompt = `Você é uma mestra espiritual experiente em numerologia e astrologia.

DADOS DO CONSULENTE:
Nome: ${nome}
Signo Solar: ${signo} (${perfilSigno.elemento}, regido por ${perfilSigno.regente})
Número da Vida: ${numeroVida} - "${significado.titulo}"

TAREFA:
Crie uma análise espiritual personalizada, profunda e acolhedora seguindo EXATAMENTE esta estrutura:

## 🌟 SEU PERFIL ENERGÉTICO

[Escreva 2-3 parágrafos combinando a energia do signo ${signo} com o número ${numeroVida}. Seja específico sobre como essas energias se manifestam na vida de ${nome}. Use o nome da pessoa. Tom místico mas acessível.]

## 💫 MISSÃO DE ALMA

[Explique o propósito de vida baseado no número ${numeroVida} e signo ${signo}. O que ${nome} veio fazer nesta encarnação? Quais dons trouxe? 2 parágrafos.]

## ⚡ DESAFIOS KÁRMICOS

[Liste 3 desafios principais que ${nome} precisa transcender, baseados nos dados. Seja compassivo mas direto.]

1. [Desafio 1 + como superar]
2. [Desafio 2 + como superar]
3. [Desafio 3 + como superar]

## 🔮 POTENCIAIS OCULTOS

[Revele 3 talentos/dons que ${nome} ainda não desenvolveu completamente mas que estão latentes.]

1. [Potencial 1]
2. [Potencial 2]
3. [Potencial 3]

## 💎 MENSAGEM FINAL

[Mensagem inspiradora e empoderadora para ${nome}. Termine criando curiosidade sobre "segredos mais profundos do seu mapa" que não foram revelados aqui. 1-2 parágrafos.]

IMPORTANTE:
- Use SEMPRE o nome "${nome}" para personalizar
- Seja específico, NÃO genérico
- Tom acolhedor, místico, revelador
- Evite clichês tipo "você é especial"
- Foque em insights práticos e transformadores`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é uma mestra espiritual especializada em numerologia e astrologia, conhecida por leituras profundas e precisas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Erro na API do Groq');
    }
    
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Erro ao gerar análise:', error);
    throw new Error('Não foi possível gerar a análise espiritual. Tente novamente.');
  }
}