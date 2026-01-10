module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/lib/calculos.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Calcular Número da Vida
__turbopack_context__.s([
    "PERFIS_SIGNOS",
    ()=>PERFIS_SIGNOS,
    "SIGNIFICADOS_NUMEROS",
    ()=>SIGNIFICADOS_NUMEROS,
    "calcularNumeroVida",
    ()=>calcularNumeroVida,
    "calcularSigno",
    ()=>calcularSigno
]);
function calcularNumeroVida(dataNascimento) {
    const numeros = dataNascimento.replace(/\D/g, '');
    let soma = 0;
    for (let num of numeros){
        soma += parseInt(num);
    }
    while(soma > 9 && ![
        11,
        22,
        33
    ].includes(soma)){
        soma = soma.toString().split('').reduce((a, b)=>a + parseInt(b), 0);
    }
    return soma;
}
function calcularSigno(dia, mes) {
    if (mes === 3 && dia >= 21 || mes === 4 && dia <= 19) return 'Áries';
    if (mes === 4 && dia >= 20 || mes === 5 && dia <= 20) return 'Touro';
    if (mes === 5 && dia >= 21 || mes === 6 && dia <= 20) return 'Gêmeos';
    if (mes === 6 && dia >= 21 || mes === 7 && dia <= 22) return 'Câncer';
    if (mes === 7 && dia >= 23 || mes === 8 && dia <= 22) return 'Leão';
    if (mes === 8 && dia >= 23 || mes === 9 && dia <= 22) return 'Virgem';
    if (mes === 9 && dia >= 23 || mes === 10 && dia <= 22) return 'Libra';
    if (mes === 10 && dia >= 23 || mes === 11 && dia <= 21) return 'Escorpião';
    if (mes === 11 && dia >= 22 || mes === 12 && dia <= 21) return 'Sagitário';
    if (mes === 12 && dia >= 22 || mes === 1 && dia <= 19) return 'Capricórnio';
    if (mes === 1 && dia >= 20 || mes === 2 && dia <= 18) return 'Aquário';
    return 'Peixes';
}
const SIGNIFICADOS_NUMEROS = {
    1: {
        titulo: "O Líder",
        desc: "Pioneiro, independente, inovador",
        desafios: "Egoísmo, impaciência, arrogância",
        potenciais: "Empreendedorismo, coragem, originalidade"
    },
    2: {
        titulo: "O Diplomata",
        desc: "Cooperativo, sensível, pacificador",
        desafios: "Dependência emocional, indecisão",
        potenciais: "Mediação, empatia, parceria"
    },
    3: {
        titulo: "O Comunicador",
        desc: "Criativo, expressivo, sociável",
        desafios: "Superficialidade, dispersão",
        potenciais: "Arte, escrita, inspiração"
    },
    4: {
        titulo: "O Construtor",
        desc: "Prático, disciplinado, trabalhador",
        desafios: "Rigidez, teimosia",
        potenciais: "Organização, persistência"
    },
    5: {
        titulo: "O Aventureiro",
        desc: "Livre, versátil, curioso",
        desafios: "Instabilidade, impulsividade",
        potenciais: "Adaptabilidade, comunicação"
    },
    6: {
        titulo: "O Cuidador",
        desc: "Responsável, amoroso, protetor",
        desafios: "Controle excessivo, sacrifício",
        potenciais: "Cura, ensino, família"
    },
    7: {
        titulo: "O Místico",
        desc: "Analítico, introspectivo, espiritual",
        desafios: "Isolamento, frieza",
        potenciais: "Sabedoria, espiritualidade"
    },
    8: {
        titulo: "O Realizador",
        desc: "Ambicioso, poderoso, material",
        desafios: "Materialismo, domínio",
        potenciais: "Liderança, prosperidade"
    },
    9: {
        titulo: "O Humanitário",
        desc: "Compassivo, idealista, universal",
        desafios: "Mártir, desilusão",
        potenciais: "Filantropia, cura global"
    },
    11: {
        titulo: "O Iluminado",
        desc: "Intuitivo, inspirador, visionário",
        desafios: "Ansiedade, idealismo extremo",
        potenciais: "Iluminação, inspiração"
    },
    22: {
        titulo: "O Construtor Mestre",
        desc: "Visionário prático, realizador",
        desafios: "Pressão interna",
        potenciais: "Grandes realizações"
    },
    33: {
        titulo: "O Mestre Curador",
        desc: "Amor universal, cura planetária",
        desafios: "Sobrecarga emocional",
        potenciais: "Cura em massa"
    }
};
const PERFIS_SIGNOS = {
    'Áries': {
        elemento: 'Fogo',
        regente: 'Marte',
        desc: 'Corajoso, impulsivo, pioneiro',
        dons: 'Liderança, coragem',
        desafios: 'Impaciência, agressividade'
    },
    'Touro': {
        elemento: 'Terra',
        regente: 'Vênus',
        desc: 'Estável, sensual, persistente',
        dons: 'Determinação, lealdade',
        desafios: 'Teimosia, possessividade'
    },
    'Gêmeos': {
        elemento: 'Ar',
        regente: 'Mercúrio',
        desc: 'Comunicativo, versátil, curioso',
        dons: 'Inteligência, adaptação',
        desafios: 'Superficialidade, dispersão'
    },
    'Câncer': {
        elemento: 'Água',
        regente: 'Lua',
        desc: 'Emotivo, protetor, intuitivo',
        dons: 'Empatia, cuidado',
        desafios: 'Insegurança, apego'
    },
    'Leão': {
        elemento: 'Fogo',
        regente: 'Sol',
        desc: 'Carismático, generoso, dramático',
        dons: 'Criatividade, liderança',
        desafios: 'Orgulho, vaidade'
    },
    'Virgem': {
        elemento: 'Terra',
        regente: 'Mercúrio',
        desc: 'Analítico, perfeccionista, prestativo',
        dons: 'Organização, discernimento',
        desafios: 'Crítica excessiva, ansiedade'
    },
    'Libra': {
        elemento: 'Ar',
        regente: 'Vênus',
        desc: 'Equilibrado, charmoso, diplomático',
        dons: 'Harmonia, justiça',
        desafios: 'Indecisão, dependência'
    },
    'Escorpião': {
        elemento: 'Água',
        regente: 'Plutão',
        desc: 'Intenso, magnético, transformador',
        dons: 'Profundidade, regeneração',
        desafios: 'Ciúme, vingança'
    },
    'Sagitário': {
        elemento: 'Fogo',
        regente: 'Júpiter',
        desc: 'Otimista, aventureiro, filosófico',
        dons: 'Sabedoria, expansão',
        desafios: 'Exagero, irresponsabilidade'
    },
    'Capricórnio': {
        elemento: 'Terra',
        regente: 'Saturno',
        desc: 'Ambicioso, disciplinado, responsável',
        dons: 'Persistência, estrutura',
        desafios: 'Frieza, pessimismo'
    },
    'Aquário': {
        elemento: 'Ar',
        regente: 'Urano',
        desc: 'Inovador, humanitário, independente',
        dons: 'Originalidade, visão futura',
        desafios: 'Distanciamento, rebeldia'
    },
    'Peixes': {
        elemento: 'Água',
        regente: 'Netuno',
        desc: 'Compassivo, sonhador, místico',
        dons: 'Intuição, criatividade',
        desafios: 'Fuga da realidade, vítima'
    }
};
}),
"[project]/lib/ia.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "gerarAnaliseEspiritual",
    ()=>gerarAnaliseEspiritual
]);
async function gerarAnaliseEspiritual(dados) {
    const { nome, signo, numeroVida, significado, perfilSigno } = dados;
    const prompt = `Você é uma mestra espiritual experiente em numerologia, astrologia, e neurociencia.

DADOS DO CONSULENTE:
Nome: ${nome}
Signo Solar: ${signo} (${perfilSigno.elemento}, regido por ${perfilSigno.regente})
Número da Vida: ${numeroVida} - "${significado.titulo}"

TAREFA:
Crie uma análise espiritual personalizada, profunda e acolhedora seguindo EXATAMENTE esta estrutura:

 🌟 **SEU PERFIL ENERGÉTICO**

[Escreva 2-3 parágrafos combinando a energia do signo ${signo} com o número ${numeroVida}. Seja específico sobre como essas energias se manifestam na vida de ${nome}. Use o nome da pessoa. Tom místico mas acessível.]

 💫 **MISSÃO DE ALMA**

[Explique o propósito de vida baseado no número ${numeroVida} e signo ${signo}. O que ${nome} veio fazer nesta encarnação? Quais dons trouxe? 2 parágrafos.]

 ⚡ **DESAFIOS KÁRMICOS**

[Liste 3 desafios principais que ${nome} precisa transcender, baseados nos dados. Seja compassivo mas direto.]

1. [Desafio 1 + como superar]
2. [Desafio 2 + como superar]
3. [Desafio 3 + como superar]

 🔮 **POTENCIAIS OCULTOS**

[Revele 3 talentos/dons que ${nome} ainda não desenvolveu completamente mas que estão latentes.]

1. [Potencial 1]
2. [Potencial 2]
3. [Potencial 3]

 💎 **MENSAGEM FINAL**

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
                        content: 'Você é uma mestra espiritual especializada em numerologia, astrologia, e neurociencia conhecida por leituras profundas e precisas.'
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
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/gerar-analise/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$calculos$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/calculos.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ia$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ia.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
;
;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://mqeyesahzuzrubwarce.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXllc2FoenV6eHJ1YndhcmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODQ3ODksImV4cCI6MjA3NTM2MDc4OX0.6KqqNBlp-QyyOKyNkpRp6QBgw_B0gMPoePutT5v9Jps"));
async function POST(request) {
    try {
        const body = await request.json();
        const { nome, email, dataNascimento, horaNascimento, cidade } = body;
        // Validações
        if (!nome || !email || !dataNascimento) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Por favor, preencha todos os campos obrigatórios'
            }, {
                status: 400
            });
        }
        // Processar data (formato: DD/MM/AAAA)
        const [dia, mes, ano] = dataNascimento.split('/').map(Number);
        // Validar data
        if (!dia || !mes || !ano || dia > 31 || mes > 12) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Data inválida. Use o formato DD/MM/AAAA'
            }, {
                status: 400
            });
        }
        // Calcular
        const numeroVida = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$calculos$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calcularNumeroVida"])(dataNascimento);
        const signo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$calculos$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calcularSigno"])(dia, mes);
        const significado = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$calculos$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SIGNIFICADOS_NUMEROS"][numeroVida];
        const perfilSigno = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$calculos$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PERFIS_SIGNOS"][signo];
        console.log('Gerando análise para:', nome, signo, numeroVida);
        // Gerar análise com IA (com fallback)
        let analiseCompleta;
        try {
            analiseCompleta = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ia$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["gerarAnaliseEspiritual"])({
                nome,
                signo,
                numeroVida,
                significado,
                perfilSigno
            });
            console.log('Análise gerada com IA com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar análise com IA, usando fallback:', error);
            // Fallback: análise simples sem IA
            analiseCompleta = `🌟 **SEU PERFIL ENERGÉTICO**

${nome}, você nasceu sob o signo de ${signo}, elemento ${perfilSigno.elemento}, regido por ${perfilSigno.regente}.

Seu Número de Vida é ${numeroVida}: "${significado.titulo}"

${significado.descricao}

💫 **CARACTERÍSTICAS DO SEU SIGNO**

${perfilSigno.caracteristicas}

🔮 **PRÓXIMOS PASSOS**

Esta é apenas uma prévia da sua análise. Para desbloquear insights mais profundos sobre seu mapa energético completo, incluindo desafios kármicos, potenciais ocultos e seu plano de 90 dias, continue para a análise completa.`;
        }
        // Salvar no banco
        const { data, error } = await supabase.from('analises').insert([
            {
                nome,
                email,
                data_nascimento: dataNascimento,
                hora_nascimento: horaNascimento || null,
                cidade: cidade || null,
                signo,
                numero_vida: numeroVida,
                analise_completa: analiseCompleta
            }
        ]).select().single();
        if (error) {
            console.error('Erro ao salvar no banco:', error);
            throw error;
        }
        console.log('Análise salva no banco, ID:', data.id);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            analiseId: data.id,
            signo,
            numeroVida,
            significado: significado.titulo
        });
    } catch (error) {
        console.error('Erro na API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Erro ao processar análise. Tente novamente.'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7d95268d._.js.map