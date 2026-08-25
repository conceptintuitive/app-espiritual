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

// Onda 1: Síntese + Diagnóstico geram primeiro. Delas extraímos um resumo do
// insight central já dito, que alimenta a Onda 2 — assim as 12 seções
// restantes sabem o que já foi coberto e não convergem todas pro mesmo
// padrão óbvio (ex: "racionaliza em vez de sentir") derivado dos mesmos dados.
const CAMPOS_ONDA1 = [
  { col: 'sintese_gerada',     build: buildMapaCtx,        gerar: gerarSinteseIA },
  { col: 'diagnostico_gerado', build: buildDiagnosticoCtx, gerar: gerarDiagnosticoIA },
];

const CAMPOS_ONDA2 = [
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

const CAMPOS = [...CAMPOS_ONDA1, ...CAMPOS_ONDA2];

function truncar(texto, maxChars) {
  const t = (texto || '').toString().trim();
  if (t.length <= maxChars) return t;
  const cut = t.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

// Monta o "já foi dito" a partir do que Síntese + Diagnóstico realmente
// geraram (ou do que já estava salvo, se essas duas já existiam antes desta
// rodada) — nunca uma chamada de IA extra só para resumir.
function montarResumoAnterior({ sintese, diagnostico }) {
  return [
    sintese?.body ? truncar(sintese.body, 220) : null,
    diagnostico?.frase_diagnostico || null,
    diagnostico?.conflito_central ? truncar(diagnostico.conflito_central, 220) : null,
  ].filter(Boolean).join(' ');
}

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

    const faltandoOnda1 = CAMPOS_ONDA1.filter(({ col }) => !analise[col]);
    const faltandoOnda2 = CAMPOS_ONDA2.filter(({ col }) => !analise[col]);
    const faltando = [...faltandoOnda1, ...faltandoOnda2];
    if (faltando.length === 0) {
      return NextResponse.json({ success: true, generated: [] });
    }

    console.log(`[gerar-manual-completo] ${analiseId} — gerando ${faltando.length} seções: ${faltando.map(f => f.col).join(', ')}`);

    const generated = [];
    const resultadosOnda1 = {};

    // Gera e salva uma seção; devolve o resultado (ou null em falha) pra
    // quem precisar reaproveitar (só a Onda 1 é reaproveitada, na Onda 2).
    async function gerarESalvar({ col, build, gerar }, ctxRow) {
      try {
        const result = await gerar(build(ctxRow));
        if (!result) {
          console.warn(`[gerar-manual-completo] ${col} retornou null`);
          return null;
        }
        const { error: saveErr } = await supabase
          .from('analises')
          .update({ [col]: JSON.stringify(result) })
          .eq('id', analiseId);
        if (saveErr) {
          console.error(`[gerar-manual-completo] falha ao salvar ${col}:`, saveErr.message);
          return null;
        }
        generated.push(col);
        console.log(`[gerar-manual-completo] ✅ ${col} salvo`);
        return result;
      } catch (err) {
        console.error(`[gerar-manual-completo] ${col} erro:`, err?.message);
        return null;
      }
    }

    function parseSalvo(raw) {
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    }

    // Onda 1 — Síntese + Diagnóstico primeiro, em paralelo entre si
    if (faltandoOnda1.length > 0) {
      await Promise.all(
        faltandoOnda1.map((campo) =>
          gerarESalvar(campo, analise).then((result) => { resultadosOnda1[campo.col] = result; })
        )
      );
    }

    // As outras 12 seções recebem um resumo do que a Onda 1 já disse (recém
    // gerado agora, ou já salvo de uma rodada anterior) pra não convergir
    // todas no mesmo insight central.
    const sintese = resultadosOnda1['sintese_gerada'] ?? parseSalvo(analise.sintese_gerada);
    const diagnostico = resultadosOnda1['diagnostico_gerado'] ?? parseSalvo(analise.diagnostico_gerado);
    const resumoAnterior = montarResumoAnterior({ sintese, diagnostico });

    // Onda 2 — as 12 seções restantes, em paralelo entre si
    if (faltandoOnda2.length > 0) {
      const analiseComResumo = { ...analise, __resumoAnterior: resumoAnterior };
      await Promise.all(faltandoOnda2.map((campo) => gerarESalvar(campo, analiseComResumo)));
    }

    console.log(`[gerar-manual-completo] concluído — ${generated.length}/${faltando.length} gerados`);
    return NextResponse.json({ success: true, generated });
  } catch (err) {
    console.error('[gerar-manual-completo] erro geral:', err?.message);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
