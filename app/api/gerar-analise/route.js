import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Garante Node runtime (evita Edge)
export const runtime = 'nodejs';

// ===== Env =====
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Loga no build se faltar algo (aparece nos logs da Vercel)
if (!SUPABASE_URL) console.error('[BOOT] Faltando NEXT_PUBLIC_SUPABASE_URL');
if (!SERVICE_KEY)  console.error('[BOOT] Faltando SUPABASE_SERVICE_ROLE_KEY');

const supabase = (SUPABASE_URL && SERVICE_KEY)
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

/* ================= Helpers ================= */

function brToISODate(d) { // "DD/MM/AAAA" -> "AAAA-MM-DD"
  if (!d) return null;
  const [dd, mm, yyyy] = String(d).split('/');
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function reduceWithMasters(n) {
  const isMaster = (x) => x === 11 || x === 22 || x === 33;
  let sum = n;
  while (sum > 9 && !isMaster(sum)) {
    sum = String(sum).split('').reduce((s, d) => s + Number(d), 0);
  }
  return sum;
}

function numberFromName(name, mode = 'all', treatYAsVowel = true) {
  const vowels = treatYAsVowel ? /[AEIOUY]/ : /[AEIOU]/;
  const letters = (name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '').toUpperCase();

  let total = 0;
  for (const ch of letters) {
    const code = ch.charCodeAt(0) - 64; // A=1..Z=26
    let v = code % 9; if (v === 0) v = 9;
    const isVowel = vowels.test(ch);
    if (mode === 'vowels' && !isVowel) continue;
    if (mode === 'consonants' && isVowel) continue;
    total += v;
  }
  return reduceWithMasters(total);
}

function lifePathFromISO(iso) {
  const raw = iso.replace(/\D/g, '').split('').reduce((s,n)=>s+Number(n),0);
  return reduceWithMasters(raw);
}

function birthdayNumber(iso) {
  return reduceWithMasters(Number(iso.slice(8,10)));
}

const SIGNOS = [
  { nome:'Áries',start:'03-21',end:'04-19', elemento:'Fogo', modalidade:'Cardinal', regente:'Marte' },
  { nome:'Touro',start:'04-20',end:'05-20', elemento:'Terra', modalidade:'Fixo', regente:'Vênus' },
  { nome:'Gêmeos',start:'05-21',end:'06-20', elemento:'Ar', modalidade:'Mutável', regente:'Mercúrio' },
  { nome:'Câncer',start:'06-21',end:'07-22', elemento:'Água', modalidade:'Cardinal', regente:'Lua' },
  { nome:'Leão',start:'07-23',end:'08-22', elemento:'Fogo', modalidade:'Fixo', regente:'Sol' },
  { nome:'Virgem',start:'08-23',end:'09-22', elemento:'Terra', modalidade:'Mutável', regente:'Mercúrio' },
  { nome:'Libra',start:'09-23',end:'10-22', elemento:'Ar', modalidade:'Cardinal', regente:'Vênus' },
  { nome:'Escorpião',start:'10-23',end:'11-21', elemento:'Água', modalidade:'Fixo', regente:'Marte/Plutão' },
  { nome:'Sagitário',start:'11-22',end:'12-21', elemento:'Fogo', modalidade:'Mutável', regente:'Júpiter' },
  { nome:'Capricórnio',start:'12-22',end:'01-19', elemento:'Terra', modalidade:'Cardinal', regente:'Saturno' },
  { nome:'Aquário',start:'01-20',end:'02-18', elemento:'Ar', modalidade:'Fixo', regente:'Saturno/Urano' },
  { nome:'Peixes',start:'02-19',end:'03-20', elemento:'Água', modalidade:'Mutável', regente:'Júpiter/Netuno' },
];
function sunSignFromISO(iso) {
  const m = Number(iso.slice(5,7)), d = Number(iso.slice(8,10));
  const inRange = (m,d,s,e)=>{
    const [sm,sd]=s.split('-').map(Number), [em,ed]=e.split('-').map(Number);
    if (sm<=em) return (m>sm || (m===sm && d>=sd)) && (m<em || (m===em && d<=ed));
    return (m>sm || (m===sm && d>=sd)) || (m<em || (m===em && d<=ed));
  };
  return SIGNOS.find(s=>inRange(m,d,s.start,s.end));
}

const PERSONAL_YEAR_MEANINGS = {
  1:'Inícios e decisões corajosas.',2:'Parcerias e paciência.',3:'Comunicação e visibilidade.',4:'Trabalho e base sólida.',
  5:'Mudanças e oportunidades.',6:'Cuidado com casa/estética/vínculos.',7:'Estudo e introspecção.',8:'Colheita e poder material.',
  9:'Fechamentos e cura.',11:'Insights e missão.',22:'Construção em grande escala.',33:'Serviço elevado.'
};
const NUM_MEANINGS = {
  11:{titulo:'Mestre 11 — Inspiração',luz:['Intuição elevada e visão espiritual.','Capacidade de inspirar coletivos.'],sombra:['Oscila entre euforia e autoexigência.','Precisa aterrar ideias em rotina.']},
  3:{titulo:'Expressão e Criatividade',luz:['Comunicação e encanto social.'],sombra:['Dispersão se não há rotina.']},
  4:{titulo:'Estrutura e Disciplina',luz:['Organização e constância.'],sombra:['Rigidez e excesso de controle.']},
  5:{titulo:'Liberdade e Versatilidade',luz:['Adaptação e carisma.'],sombra:['Impulsividade e muitos estímulos.']},
  9:{titulo:'Humanitarismo e Propósito',luz:['Empatia e visão global.'],sombra:['Idealismo ferido; falta de limites.']},
};
const ELEMENT_TIPS = {
  Fogo:'Ação, coragem e metas semanais.',
  Terra:'Rotina, métricas e consistência.',
  Ar:'Estudo, trocas e conteúdo.',
  Água:'Intuição, estética e autocuidado.'
};

function buildAnalysis({nome, isoDate, lifePath, birthdayNum, expr, soul, perso, sun, personalYearNum}) {
  const year = new Date().getUTCFullYear();
  const num = NUM_MEANINGS[lifePath] || {};
  const exprM = NUM_MEANINGS[expr] || {};
  const soulM = NUM_MEANINGS[soul] || {};
  const persoM = NUM_MEANINGS[perso] || {};
  const pyText = PERSONAL_YEAR_MEANINGS[personalYearNum] || '';
  const elementTip = sun ? ELEMENT_TIPS[sun.elemento] : '';
  return [
    '## Introdução',
    `${nome}, abaixo está uma leitura integrada de Numerologia e Astrologia baseada no seu nome e na sua data de nascimento (${isoDate}).`,
    `Você nasce com o Sol em **${sun?.nome}** (${sun?.elemento}, ${sun?.modalidade}, regido por ${sun?.regente}).`,
    '## Essência do Caminho (Número de Vida)',
    `Número de Vida: **${lifePath} — ${num.titulo || ''}**`,
    `• Dia de Nascimento: **${birthdayNum}** (expressão pessoal).`,
    '1. Potenciais (luz): ' + (num.luz ? num.luz.join(' ') : ''),
    '2. Desafios (sombra): ' + (num.sombra ? num.sombra.join(' ') : ''),
    '3. Foco prático: transforme o número em ações semanais simples.',
    '## Ano Pessoal ' + year,
    `Número: **${personalYearNum}**`,
    `1. Direção do ciclo: ${pyText}`,
    '2. Dica: valide decisões com o tema do ano.',
    '3. Planejamento: metas em sprints de 4 semanas.',
    '## Expressão (Destino) — Pelo Nome Completo',
    `Número: **${expr}**`,
    '## Desejo da Alma (Vogais)',
    `Número: **${soul}**`,
    '## Personalidade (Consoantes)',
    `Número: **${perso}**`,
    '## Sol',
    `Elemento: **${sun?.elemento}** • Modalidade: **${sun?.modalidade}** • Regência: **${sun?.regente}**`,
    `1. Qualidade central do seu Sol: ${elementTip}`,
    '## Recomendações',
    '1. Três metas do mês alinhadas ao Ano Pessoal.',
    '2. Painel de hábitos com 4 hábitos-chave.',
    '3. 10 min/dia de presença (meditação/journaling).',
  ].join('\n');
}

/* ================ Handler ================ */

export async function POST(req) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'ENV do Supabase faltando (URL/Service Key).' },
        { status: 500 }
      );
    }

    // Aceita JSON e também form submissions
    const ct = req.headers.get('content-type') || '';
    let body = {};
    if (ct.includes('application/json')) {
      body = await req.json();
    } else if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      body = Object.fromEntries(form);
    } else {
      body = await req.json().catch(() => ({}));
    }

    const { nome, email, dataNascimento, horaNascimento, cidade } = body;

    const isoDate = brToISODate(dataNascimento);
    if (!isoDate) {
      return NextResponse.json({ ok:false, error:'Data inválida. Use DD/MM/AAAA.' }, { status:400 });
    }

    const lifePath = lifePathFromISO(isoDate);
    const birthdayNum = birthdayNumber(isoDate);
    const expr = numberFromName(nome, 'all');
    const soul = numberFromName(nome, 'vowels');
    const perso = numberFromName(nome, 'consonants');
    const sun = sunSignFromISO(isoDate);

    const year = new Date().getUTCFullYear();
    const dayR = reduceWithMasters(Number(isoDate.slice(8,10)));
    const monR = reduceWithMasters(Number(isoDate.slice(5,7)));
    const uni  = reduceWithMasters(String(year).split('').reduce((s,n)=>s+Number(n),0));
    const personalYearNum = reduceWithMasters(dayR + monR + uni);

    const analiseCompleta = buildAnalysis({
      nome, isoDate, lifePath, birthdayNum, expr, soul, perso, sun, personalYearNum
    });

    const payload = {
      nome,
      email,
      data_nascimento: isoDate,           // tipo DATE na tabela
      hora_nascimento: horaNascimento || null,
      cidade: cidade || null,
      numero_vida: lifePath,              // INT
      signo: sun?.nome || null,
      analise_completa: analiseCompleta,  // TEXT
    };

    const { data, error } = await supabase
      .from('analises')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('[INSERT_ERROR]', error);
      return NextResponse.json({ ok:false, error:`DB: ${error.message}` }, { status:500 });
    }

    return NextResponse.json({ ok:true, id: data.id }, { status:200 });
  } catch (e) {
    console.error('[API_ERROR]', e);
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
