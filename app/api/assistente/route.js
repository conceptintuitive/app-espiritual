import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { responderPergunta } from '@/lib/assistente';

export const runtime = 'nodejs';

const LIMITE_GRATIS = 3;
const LIMITE_DIARIO_PAGO = 30;
const HISTORICO_MAX = 8;

export async function POST(req) {
  try {
    const { analiseId, pergunta } = await req.json();
    const perguntaTrim = (pergunta || '').toString().trim();

    if (!analiseId || !perguntaTrim) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }
    if (perguntaTrim.length > 500) {
      return NextResponse.json({ error: 'Pergunta muito longa.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuração ausente.' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { data: analise, error: analiseErr } = await supabase
      .from('analises')
      .select('id, nome, signo, signo_lua, signo_ascendente, signo_venus, signo_marte, numero_vida, numero_alma, numero_expressao, ano_pessoal, objetivo_principal, payment_status')
      .eq('id', analiseId)
      .single();

    if (analiseErr || !analise) {
      return NextResponse.json({ error: 'Análise não encontrada.' }, { status: 404 });
    }

    const pago = analise.payment_status === 'paid';

    if (pago) {
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('chat_mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('analise_id', analiseId)
        .eq('role', 'user')
        .gte('created_at', inicioHoje.toISOString());
      if ((count ?? 0) >= LIMITE_DIARIO_PAGO) {
        return NextResponse.json(
          { error: 'Você atingiu o limite de perguntas de hoje. Volta amanhã!' },
          { status: 429 }
        );
      }
    } else {
      const { count } = await supabase
        .from('chat_mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('analise_id', analiseId)
        .eq('role', 'user');
      if ((count ?? 0) >= LIMITE_GRATIS) {
        return NextResponse.json(
          { error: 'limite_gratis', perguntasRestantes: 0 },
          { status: 403 }
        );
      }
    }

    const { data: historicoRows } = await supabase
      .from('chat_mensagens')
      .select('role, content')
      .eq('analise_id', analiseId)
      .order('created_at', { ascending: false })
      .limit(HISTORICO_MAX);
    const historico = (historicoRows || []).reverse();

    await supabase.from('chat_mensagens').insert({ analise_id: analiseId, role: 'user', content: perguntaTrim });

    const resposta = await responderPergunta({ perfil: analise, historico, pergunta: perguntaTrim });
    if (!resposta) {
      return NextResponse.json({ error: 'Não consegui responder agora. Tenta de novo em instantes.' }, { status: 502 });
    }

    await supabase.from('chat_mensagens').insert({ analise_id: analiseId, role: 'assistant', content: resposta });

    let perguntasRestantes = null;
    if (!pago) {
      const { count: novaContagem } = await supabase
        .from('chat_mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('analise_id', analiseId)
        .eq('role', 'user');
      perguntasRestantes = Math.max(0, LIMITE_GRATIS - (novaContagem ?? 0));
    }

    return NextResponse.json({ resposta, perguntasRestantes });
  } catch (error) {
    console.error('❌ Erro no assistente:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
