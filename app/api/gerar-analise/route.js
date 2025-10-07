import { createClient } from '@supabase/supabase-js';
import { calcularNumeroVida, calcularSigno, SIGNIFICADOS_NUMEROS, PERFIS_SIGNOS } from '@/lib/calculos';
import { gerarAnaliseEspiritual } from '@/lib/ia';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, email, dataNascimento, horaNascimento, cidade } = body;

    // Validações
    if (!nome || !email || !dataNascimento) {
      return NextResponse.json(
        { error: 'Por favor, preencha todos os campos obrigatórios' },
        { status: 400 }
      );
    }

    // Processar data (formato: DD/MM/AAAA)
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    
    // Validar data
    if (!dia || !mes || !ano || dia > 31 || mes > 12) {
      return NextResponse.json(
        { error: 'Data inválida. Use o formato DD/MM/AAAA' },
        { status: 400 }
      );
    }

    // Calcular
    const numeroVida = calcularNumeroVida(dataNascimento);
    const signo = calcularSigno(dia, mes);
    const significado = SIGNIFICADOS_NUMEROS[numeroVida];
    const perfilSigno = PERFIS_SIGNOS[signo];

    console.log('Gerando análise para:', nome, signo, numeroVida);

    // Gerar análise com IA
    const analiseCompleta = await gerarAnaliseEspiritual({
      nome,
      signo,
      numeroVida,
      significado,
      perfilSigno
    });

    console.log('Análise gerada com sucesso!');

    // Salvar no banco
    const { data, error } = await supabase
      .from('analises')
      .insert([{
        nome,
        email,
        data_nascimento: dataNascimento,
        hora_nascimento: horaNascimento || null,
        cidade: cidade || null,
        signo,
        numero_vida: numeroVida,
        analise_completa: analiseCompleta
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar no banco:', error);
      throw error;
    }

    console.log('Análise salva no banco, ID:', data.id);

    return NextResponse.json({
      success: true,
      analiseId: data.id,
      signo,
      numeroVida,
      significado: significado.titulo
    });

  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro ao processar análise. Tente novamente.' },
      { status: 500 }
    );
  }
}