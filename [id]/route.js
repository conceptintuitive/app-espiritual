import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('analises')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analise: data
    });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar análise' },
      { status: 500 }
    );
  }
}