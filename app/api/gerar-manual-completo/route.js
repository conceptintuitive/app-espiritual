import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildDiagnosticoCtx, buildAmorCtx, buildTipoPessoaCtx, buildPlano7Ctx,
  buildArquetiposCtx, buildPontoCegoCtx, buildBloqueiosCtx, buildDinheiroCtx,
  buildRituaisCtx, buildObjetivoCtx, buildLeituraCtx, buildCalendarioCtx,
  buildFechamentoCtx, buildMapaCtx,
} from '@/lib/manualgenerator';
import {
  gerarDiagnosticoIA, gerarAmorIA, gerarTipoPessoaIA, gerarPlano7IA,
  gerarArquetiposIA, gerarPontoCegoIA, gerarBloqueiosIA, gerarDinheiroIA,
  gerarRituaisIA, gerarObjetivoIA, gerarLeituraIA, gerarCalendarioIA,
  gerarFechamentoIA, gerarSinteseIA,
} from '@/lib/ia';

export const runtime = 'nodejs';
export const maxDuration = 300;

const CAMPOS = [
  { col: 'sintese_gerada',     build: buildMapaCtx,        gerar: gerarSinteseIA },
  { col: 'diagnostico_gerado', build: buildDiagnosticoCtx, gerar: gerarDiagnosticoIA },
  { col: 'tipo_pessoa_gerado', build: buildTipoPessoaCtx,  gerar: gerarTipoPessoaIA },
  { col: 'arquetipos_gerado',  build: buildArquetiposCtx,  gerar: gerarArquetiposIA },
  { col: 'amor_gerado',        build: buildAmorCtx,        gerar: gerarAmorIA },
  { col: 'objetivo_gerado',    build: buildObjetivoCtx,    gerar: gerarObjetivoIA },
  { col: 'leitura_gerada',     build: buildLeituraCtx,     gerar: gerarLeituraIA },
  { col: 'plano7_gerado',      build: buildPlano7Ctx,      gerar: gerarPlano7IA },
  { col: 'ponto_cego_gerado',  build: buildPontoCegoCtx,   gerar: gerarPontoCegoIA },
  { col: 'bloqueios_gerado',   build: buildBloqueiosCtx,   gerar: gerarBloqueiosIA },
  { col: 'dinheiro_gerado',    build: buildDinheiroCtx,    gerar: gerarDinheiroIA },
  { col: 'rituais_gerado',     build: buildRituaisCtx,     gerar: gerarRituaisIA },
  { col: 'calendario_gerado',  build: buildCalendarioCtx,  gerar: gerarCalendarioIA },
  { col: 'fechamento_gerado',  build: buildFechamentoCtx,  gerar: gerarFechamentoIA },
];

export async function POST(request) {
  try {
    const { analiseId } = await request.json();
    if (!analiseId) {
      return NextResponse.json({ error: 'analiseId obrigatório' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data: analise, error: fetchErr } = await supabase
      .from('analises')
      .select(`
        nome, signo, numero_vida, objetivo_principal, relacao_status, trabalho_status,
        signo_lua, signo_venus, signo_marte, signo_nodo, signo_mercurio, signo_ascendente,
        ano_pessoal, numero_alma, numero_expressao, payment_status,
        sintese_gerada, diagnostico_gerado, amor_gerado, tipo_pessoa_gerado,
        plano7_gerado, arquetipos_gerado, ponto_cego_gerado, bloqueios_gerado,
        dinheiro_gerado, rituais_gerado, objetivo_gerado, leitura_gerada,
        calendario_gerado, fechamento_gerado
      `)
      .eq('id', analiseId)
      .single();

    if (fetchErr || !analise) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 });
    }

    if (analise.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Pagamento não confirmado' }, { status: 403 });
    }

    const faltando = CAMPOS.filter(({ col }) => !analise[col]);
    if (faltando.length === 0) {
      return NextResponse.json({ success: true, generated: [] });
    }

    console.log(`[gerar-manual-completo] ${analiseId} — gerando ${faltando.length} seções: ${faltando.map(f => f.col).join(', ')}`);

    const generated = [];

    // Cada tarefa gera e salva independentemente assim que termina
    await Promise.all(
      faltando.map(async ({ col, build, gerar }) => {
        try {
          const result = await gerar(build(analise));
          if (!result) {
            console.warn(`[gerar-manual-completo] ${col} retornou null`);
            return;
          }
          const { error: saveErr } = await supabase
            .from('analises')
            .update({ [col]: JSON.stringify(result) })
            .eq('id', analiseId);
          if (saveErr) {
            console.error(`[gerar-manual-completo] falha ao salvar ${col}:`, saveErr.message);
            return;
          }
          generated.push(col);
          console.log(`[gerar-manual-completo] ✅ ${col} salvo`);
        } catch (err) {
          console.error(`[gerar-manual-completo] ${col} erro:`, err?.message);
        }
      })
    );

    console.log(`[gerar-manual-completo] concluído — ${generated.length}/${faltando.length} gerados`);
    return NextResponse.json({ success: true, generated });
  } catch (err) {
    console.error('[gerar-manual-completo] erro geral:', err?.message);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
