/**
 * Script de teste local para a geração de diagnóstico via Groq.
 * Simula o que o webhook faz após payment_status='paid'.
 *
 * Uso:
 *   node scripts/test-ia.mjs <analise_id>
 *
 * Pré-requisitos:
 *   - GROQ_API_KEY no .env.local
 *   - coluna diagnostico_gerado criada no Supabase
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Carregar .env.local manualmente (sem depender do dotenv) ─────────────────
const envPath = resolve(process.cwd(), '.env.local');
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim();
  }
} catch {
  console.error('⚠️  .env.local não encontrado — certifique-se de estar na raiz do projeto');
  process.exit(1);
}

const analiseId = process.argv[2];
if (!analiseId) {
  console.error('Uso: node scripts/test-ia.mjs <analise_id>');
  process.exit(1);
}

// ── Verificar ANTHROPIC_API_KEY ─────────────────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY não encontrada no .env.local');
  process.exit(1);
}

// ── Imports dinâmicos (ES modules) ──────────────────────────────────────────
const { createClient } = await import('@supabase/supabase-js');
const { buildDiagnosticoCtx, buildAmorCtx, buildTipoPessoaCtx, buildPlano7Ctx, buildArquetiposCtx, buildPontoCegoCtx, buildBloqueiosCtx, buildDinheiroCtx, buildRituaisCtx, buildObjetivoCtx, buildLeituraCtx, buildCalendarioCtx, buildFechamentoCtx, buildMapaCtx } = await import('../lib/manualgenerator.js');
const { gerarDiagnosticoIA, gerarAmorIA, gerarTipoPessoaIA, gerarPlano7IA, gerarArquetiposIA, gerarPontoCegoIA, gerarBloqueiosIA, gerarDinheiroIA, gerarRituaisIA, gerarObjetivoIA, gerarLeituraIA, gerarCalendarioIA, gerarFechamentoIA, gerarSinteseIA } = await import('../lib/ia.js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Buscar dados da análise ──────────────────────────────────────────────────
console.log(`\n🔍 Buscando analise ${analiseId}...`);
const { data: analise, error: fetchErr } = await supabase
  .from('analises')
  .select('nome, signo, numero_vida, objetivo_principal, relacao_status, trabalho_status, signo_lua, signo_venus, signo_marte, signo_nodo, signo_mercurio, signo_ascendente')
  .eq('id', analiseId)
  .single();

if (fetchErr || !analise) {
  console.error('❌  Análise não encontrada:', fetchErr?.message);
  process.exit(1);
}

console.log(`✅ Perfil: ${analise.nome} | ${analise.signo} | Nº ${analise.numero_vida}`);
console.log(`   Objetivo: ${analise.objetivo_principal || '—'}`);
console.log(`   Lua: ${analise.signo_lua || '—'} | Vênus: ${analise.signo_venus || '—'} | Marte: ${analise.signo_marte || '—'} | Nodo: ${analise.signo_nodo || '—'}`);
console.log(`   Mercúrio: ${analise.signo_mercurio || '—'} | Ascendente: ${analise.signo_ascendente || '—'}`);

// ── Construir ctx e chamar Groq ──────────────────────────────────────────────
console.log('\n⏳ Chamando Groq em 3 lotes...');
const start = Date.now();

// Lote 1 — 4 chamadas HEAVY
console.log('📦 Lote 1: Diagnóstico, Tipo de Pessoa, Arquétipos, Síntese');
const [diagnostico, tipoPessoa, arquetipos, sintese] = await Promise.all([
  gerarDiagnosticoIA(buildDiagnosticoCtx(analise)),
  gerarTipoPessoaIA(buildTipoPessoaCtx(analise)),
  gerarArquetiposIA(buildArquetiposCtx(analise)),
  gerarSinteseIA(buildMapaCtx(analise)),
]);
console.log('⏸  Aguardando 15s...');
await new Promise(r => setTimeout(r, 15000));

// Lote 2 — 3 chamadas HEAVY
console.log('📦 Lote 2: Amor, Objetivo, Leitura');
const [amor, objetivo, leitura] = await Promise.all([
  gerarAmorIA(buildAmorCtx(analise)),
  gerarObjetivoIA(buildObjetivoCtx(analise)),
  gerarLeituraIA(buildLeituraCtx(analise)),
]);
console.log('⏸  Aguardando 15s...');
await new Promise(r => setTimeout(r, 15000));

// Lote 3a — 4 chamadas LIGHT
console.log('📦 Lote 3a: Plano7, PontoCego, Bloqueios, Dinheiro');
const [plano7, pontoCego, bloqueios, dinheiro] = await Promise.all([
  gerarPlano7IA(buildPlano7Ctx(analise)),
  gerarPontoCegoIA(buildPontoCegoCtx(analise)),
  gerarBloqueiosIA(buildBloqueiosCtx(analise)),
  gerarDinheiroIA(buildDinheiroCtx(analise)),
]);
console.log('⏸  Aguardando 15s...');
await new Promise(r => setTimeout(r, 15000));

// Lote 3b — 3 chamadas LIGHT
console.log('📦 Lote 3b: Rituais, Calendário, Fechamento');
const [rituais, calendario, fechamento] = await Promise.all([
  gerarRituaisIA(buildRituaisCtx(analise)),
  gerarCalendarioIA(buildCalendarioCtx(analise)),
  gerarFechamentoIA(buildFechamentoCtx(analise)),
]);

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`✅ Gerado em ${elapsed}s\n`);

if (sintese) {
  console.log('── SÍNTESE INTEGRADA ──');
  console.log('body:', sintese.body?.slice(0, 200) + '...\n');
} else {
  console.warn('⚠️  Síntese retornou null');
}

if (diagnostico) {
  console.log('── DIAGNÓSTICO ──');
  console.log('combinacao:', diagnostico.combinacao.slice(0, 180) + '...');
  console.log('frase:', `"${diagnostico.frase_diagnostico}"\n`);
} else {
  console.warn('⚠️  Diagnóstico retornou null');
}

if (amor) {
  console.log('── AMOR ──');
  console.log('headline:', amor.headline);
  console.log('pattern:', amor.pattern.slice(0, 160) + '...');
  console.log('whatToStop[0]:', amor.whatToStop?.[0], '\n');
} else {
  console.warn('⚠️  Amor retornou null');
}

if (tipoPessoa) {
  console.log('── TIPO DE PESSOA ──');
  console.log('body:', tipoPessoa.body.slice(0, 160) + '...\n');
} else {
  console.warn('⚠️  Tipo de Pessoa retornou null');
}

if (plano7) {
  console.log('── PLANO 7 DIAS ──');
  console.log('headline:', plano7.headline);
  console.log('days[0]:', plano7.days?.[0]);
  console.log('rituals[0]:', plano7.rituals?.[0], '\n');
} else {
  console.warn('⚠️  Plano 7 Dias retornou null');
}

if (arquetipos) {
  console.log('── ARQUÉTIPOS ──');
  console.log('Dominante:', arquetipos.dominante?.nome);
  console.log('Emocional:', arquetipos.emocional?.nome);
  console.log('Sombra:   ', arquetipos.sombra?.nome);
  console.log('Dominante frase:', `"${arquetipos.dominante?.frase}"\n`);
} else {
  console.warn('⚠️  Arquétipos retornou null');
}

if (pontoCego) {
  console.log('── PONTO CEGO ──');
  console.log('body:', pontoCego.body?.slice(0, 160) + '...');
  console.log('frase:', `"${pontoCego.frase}"\n`);
} else { console.warn('⚠️  Ponto Cego retornou null'); }

if (bloqueios) {
  console.log('── BLOQUEIOS ──');
  console.log('note:', bloqueios.note?.slice(0, 100) + '...');
  console.log('items[0]:', bloqueios.items?.[0]?.split('\n')[0], '\n');
} else { console.warn('⚠️  Bloqueios retornou null'); }

if (dinheiro) {
  console.log('── DINHEIRO ──');
  console.log('headline:', dinheiro.headline?.slice(0, 140) + '...');
  console.log('blocks[0]:', dinheiro.blocks?.[0], '\n');
} else { console.warn('⚠️  Dinheiro retornou null'); }

if (rituais) {
  console.log('── RITUAIS ──');
  console.log('Ritual 1:', rituais.rituals?.[0]?.nome);
  console.log('Ritual 2:', rituais.rituals?.[1]?.nome);
  console.log('Ritual 3:', rituais.rituals?.[2]?.nome, '\n');
} else { console.warn('⚠️  Rituais retornou null'); }

if (objetivo) {
  console.log('── OBJETIVO DO CICLO ──');
  console.log('title:', objetivo.title);
  console.log('body:', objetivo.body?.slice(0, 160) + '...\n');
} else { console.warn('⚠️  Objetivo retornou null'); }

if (leitura) {
  console.log('── LEITURA INTEGRADA ──');
  console.log('body:', leitura.body?.slice(0, 160) + '...\n');
} else { console.warn('⚠️  Leitura retornou null'); }

if (calendario) {
  console.log('── CALENDÁRIO 30 DIAS ──');
  console.log('Semana 1:', calendario.weeks?.[0]?.week);
  console.log('Dia 1:', calendario.weeks?.[0]?.days?.[0], '\n');
} else { console.warn('⚠️  Calendário retornou null'); }

if (fechamento) {
  console.log('── FECHAMENTO ──');
  console.log('body:', fechamento.body?.slice(0, 160) + '...');
  console.log('mantra:', `"${fechamento.mantra}"\n`);
} else { console.warn('⚠️  Fechamento retornou null'); }

if (!diagnostico && !amor && !tipoPessoa && !plano7 && !arquetipos && !pontoCego && !bloqueios && !dinheiro && !rituais && !objetivo && !leitura && !calendario && !fechamento) {
  console.error('❌  Todas as chamadas falharam — verifique GROQ_API_KEY');
  process.exit(1);
}

// ── Salvar no Supabase ───────────────────────────────────────────────────────
const updates = {};
if (sintese)      updates.sintese_gerada     = JSON.stringify(sintese);
if (diagnostico) updates.diagnostico_gerado = JSON.stringify(diagnostico);
if (amor)        updates.amor_gerado         = JSON.stringify(amor);
if (tipoPessoa)  updates.tipo_pessoa_gerado  = JSON.stringify(tipoPessoa);
if (plano7)      updates.plano7_gerado        = JSON.stringify(plano7);
if (arquetipos)  updates.arquetipos_gerado    = JSON.stringify(arquetipos);
if (pontoCego)   updates.ponto_cego_gerado    = JSON.stringify(pontoCego);
if (bloqueios)   updates.bloqueios_gerado      = JSON.stringify(bloqueios);
if (dinheiro)    updates.dinheiro_gerado        = JSON.stringify(dinheiro);
if (rituais)     updates.rituais_gerado          = JSON.stringify(rituais);
if (objetivo)    updates.objetivo_gerado          = JSON.stringify(objetivo);
if (leitura)     updates.leitura_gerada            = JSON.stringify(leitura);
if (calendario)  updates.calendario_gerado          = JSON.stringify(calendario);
if (fechamento)  updates.fechamento_gerado           = JSON.stringify(fechamento);

console.log('💾 Salvando no banco:', Object.keys(updates).join(', '));
const { error: saveErr } = await supabase
  .from('analises')
  .update(updates)
  .eq('id', analiseId);

if (saveErr) {
  console.error('❌  Falha ao salvar:', saveErr.message);
  process.exit(1);
}

console.log('✅ Salvo com sucesso!');
console.log('\nPróximos passos:');
console.log(`  1. Acesse o Supabase e confirme que diagnostico_gerado foi preenchido`);
console.log(`  2. No SQL Editor, rode:`);
console.log(`     UPDATE analises SET payment_status = 'paid' WHERE id = '${analiseId}';`);
console.log(`  3. Acesse: http://localhost:3000/manual/${analiseId}`);
