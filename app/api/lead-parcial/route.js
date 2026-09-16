import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Captura silenciosa do e-mail da Etapa 4 do quiz (ver onBlur em app/page.js),
// mesmo que a pessoa não conclua a submissão. Só grava — nenhum e-mail de
// remarketing é disparado a partir daqui.
export async function POST(request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();
    const nome = body?.nome?.trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'ENV do Supabase não configurada' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('leads_parciais')
      .upsert(
        { email, nome, updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      );

    if (error) {
      // Best-effort — se a tabela ainda não existir (migration 0009 não rodada),
      // só loga; a captura parcial não pode quebrar o quiz.
      console.error('⚠️ Não foi possível salvar lead parcial (tabela existe?):', error.message);
      return NextResponse.json({ error: 'Erro ao salvar', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro em /api/lead-parcial:', err?.message);
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 });
  }
}
