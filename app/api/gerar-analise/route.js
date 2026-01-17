import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Log para debug
console.log('🔑 SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔑 SUPABASE_KEY existe?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function parseDataISO(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m, d };
}

function calcularSigno(dataISO) {
  const p = parseDataISO(dataISO);
  if (!p) return '';
  const { m, d } = p;
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Áries';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Touro';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Gêmeos';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Câncer';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Leão';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Virgem';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Libra';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Escorpião';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Sagitário';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Capricórnio';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Aquário';
  if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return 'Peixes';
  return '';
}

function reduzirNumero(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

function calcularNumeroVida(dataISO) {
  const p = parseDataISO(dataISO);
  if (!p) return 0;
  const soma = String(p.y).split('').reduce((a, b) => a + Number(b), 0) +
                String(p.m).split('').reduce((a, b) => a + Number(b), 0) +
                String(p.d).split('').reduce((a, b) => a + Number(b), 0);
  return reduzirNumero(soma);
}

export async function POST(request) {
  console.log('📨 POST /api/gerar-analise chamado');
  
  try {
    const body = await request.json();
    console.log('📥 Body recebido:', JSON.stringify(body, null, 2));

    const { nome, email, data_nascimento, hora_nascimento, local_nascimento, noTime } = body;

    // Validações
    if (!nome?.trim() || nome.trim().length < 3) {
      console.log('❌ Validação: Nome inválido');
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    }

    if (!email?.includes('@')) {
      console.log('❌ Validação: Email inválido');
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (!data_nascimento) {
      console.log('❌ Validação: Data inválida');
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }

    // Calcular
    const signo = calcularSigno(data_nascimento);
    const numeroVida = calcularNumeroVida(data_nascimento);
    console.log('🔢 Calculado - Signo:', signo, 'Número:', numeroVida);

    // Dados para inserir
    const dadosInsert = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      data_nascimento,
      hora_nascimento: noTime ? null : (hora_nascimento || null),
      local_nascimento: local_nascimento || null,
      signo,
      numero_vida: numeroVida,
      status: 'pendente',
      payment_status: 'pending'
    };

    console.log('💾 Tentando inserir:', JSON.stringify(dadosInsert, null, 2));

    // Inserir
    const { data, error } = await supabase
      .from('analises')
      .insert([dadosInsert])
      .select()
      .single();

    if (error) {
      console.error('❌ ERRO SUPABASE:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Erro ao salvar no banco',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('✅ SUCESSO! ID:', data.id);

    return NextResponse.json({ 
      success: true, 
      id: data.id 
    });

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}