import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const soma =
    String(p.y).split('').reduce((a, b) => a + Number(b), 0) +
    String(p.m).split('').reduce((a, b) => a + Number(b), 0) +
    String(p.d).split('').reduce((a, b) => a + Number(b), 0);
  return reduzirNumero(soma);
}

export async function POST(request) {
  try {
   const body = await request.json(); // ✅ FIX 1: define body
   
const {
  nome,
  email,
  data_nascimento,
  hora_nascimento,
  local_nascimento,
  noTime,
  objetivo_principal,
  relacao_status,
  trabalho_status,
} = body;

    // 👇 AQUI
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('SUPABASE_URL ok?', !!supabaseUrl);
    console.log('SUPABASE_KEY ok?', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'ENV do Supabase não configurada', hasUrl: !!supabaseUrl, hasKey: !!supabaseKey },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('SUPABASE_URL:', supabaseUrl?.slice(0, 40) + '...');

// teste simples de rede
try {
  const r = await fetch(supabaseUrl + '/rest/v1/', {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  console.log('PING SUPABASE STATUS:', r.status);
} catch (e) {
  console.log('PING SUPABASE FALHOU:', e?.message || e);
  return NextResponse.json(
    { error: 'Falha de rede ao acessar Supabase', details: e?.message || String(e) },
    { status: 500 }
  );
}

    // ✅ 3) validações (agora nome/email/data existem)
    if (!nome?.trim() || nome.trim().length < 3) {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    }
    if (!email?.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!data_nascimento) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }

    // Calcular
    const signo = calcularSigno(data_nascimento);
    const numeroVida = calcularNumeroVida(data_nascimento);

    const dadosInsert = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      data_nascimento,
      hora_nascimento: noTime ? null : (hora_nascimento || null),
      local_nascimento: local_nascimento || null,

      objetivo_principal: objetivo_principal || null,
      relacao_status: relacao_status || null,
      trabalho_status: trabalho_status || null,

      signo,
      numero_vida: numeroVida,
      status: 'pendente',
      payment_status: 'pending',
    };

 const { data, error } = await supabase
      .from('analises')
      .insert(dadosInsert)
      .select('id');

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao salvar no banco', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}