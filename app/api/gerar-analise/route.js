import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularPlanetas, calcularAscendente, calcularAnoPessoal, calcularNumeroAlma, calcularNumeroExpressao } from '@/lib/calculos';
import { gerarPreviewIA, gerarDiagnosticoIA, gerarAmorIA, gerarArquetiposIA, gerarPlano7IA, gerarInterpretacaoTarotIA } from '@/lib/ia';
import { buildDiagnosticoCtx, buildAmorCtx, buildArquetiposCtx, buildPlano7Ctx } from '@/lib/manualgenerator';
import { sortearCarta, TAROT_PROMPTS_EN } from '@/lib/tarot';

// Gera imagem via Pollinations.ai, sobe pro Supabase Storage, retorna URL pública
async function gerarImagemTarot(cartaSorteada, analiseId, supabaseUrl, serviceRoleKey) {
  const cardPrompt = TAROT_PROMPTS_EN[cartaSorteada.nome] || `mystical tarot symbolism ${cartaSorteada.nome} card`;
  const energySuffix = cartaSorteada.invertida
    ? ', reversed shadowy energy, darker atmospheric tones, descending cosmic forces'
    : ', radiant upright energy, ascending golden light, celestial power';
  const styleBase = 'mystical tarot card illustration, deep purple and gold cosmic background, ethereal magical atmosphere, ornate decorative borders, ancient esoteric art style, dramatic atmospheric lighting, no text, no words, no letters, no numbers, no writing';

  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${cardPrompt}, ${styleBase}${energySuffix}`)}?width=1200&height=630&nologo=true&model=flux`;

  const imgRes = await fetch(pollinationsUrl, { signal: AbortSignal.timeout(60000) });
  if (!imgRes.ok) throw new Error(`Pollinations status ${imgRes.status}`);

  const imgBuffer = await imgRes.arrayBuffer();
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { error: uploadError } = await supabaseAdmin.storage
    .from('imagens-ia')
    .upload(`og-${analiseId}.jpg`, imgBuffer, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

  const { data: urlData } = supabaseAdmin.storage.from('imagens-ia').getPublicUrl(`og-${analiseId}.jpg`);
  return urlData.publicUrl;
}

// Geocoding via Nominatim (OpenStreetMap) — gratuito, sem API key
// Retorna { lat, lon } ou null em caso de falha
async function geocodeLocal(localNascimento) {
  if (!localNascimento?.trim()) return null;
  try {
    const q   = encodeURIComponent(localNascimento.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IntuitiveConcept/1.0 conceptintuitive@gmail.com' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    return isNaN(lat) || isNaN(lon) ? null : { lat, lon };
  } catch {
    return null;
  }
}

// Heurística de UTC offset para o Brasil.
// Brasil padrão: UTC-3. Historicamente, estados do Sul/Sudeste/Centro-Oeste
// observaram horário de verão (UTC-2) de novembro a fevereiro até 2019.
function brasilUtcOffset(month) {
  return [11, 12, 1, 2].includes(month) ? -2 : -3;
}

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
    const body = await request.json();
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'ENV do Supabase não configurada', hasUrl: !!supabaseUrl, hasKey: !!supabaseKey },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!nome?.trim() || nome.trim().length < 3) {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    }
    if (!email?.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!data_nascimento) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }

    const signo      = calcularSigno(data_nascimento);
    const numeroVida = calcularNumeroVida(data_nascimento);
    const anoPessoal      = calcularAnoPessoal(data_nascimento);
    const numeroAlma      = calcularNumeroAlma(nome);
    const numeroExpressao = calcularNumeroExpressao(nome);

    let planetas = null;
    try {
      planetas = calcularPlanetas(data_nascimento, noTime ? null : hora_nascimento);
    } catch (_) {}

    // Geocoding (rápido, 5s timeout) — necessário para signoAscendente no insert
    let coords = null;
    let signoAscendente = null;
    try {
      const [, m] = data_nascimento.split('-').map(Number);
      const utcOffset = brasilUtcOffset(m);
      coords = await geocodeLocal(local_nascimento);
      if (coords && !noTime && hora_nascimento) {
        signoAscendente = calcularAscendente(data_nascimento, hora_nascimento, coords.lat, coords.lon, utcOffset);
      }
    } catch (_) {}

    const cartaSorteada = sortearCarta();

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
      numero_vida:       numeroVida,
      ano_pessoal:       anoPessoal      ?? null,
      numero_alma:       numeroAlma      ?? null,
      numero_expressao:  numeroExpressao ?? null,
      signo_lua:        planetas?.signoLua        ?? null,
      signo_venus:      planetas?.signoVenus      ?? null,
      signo_marte:      planetas?.signoMarte      ?? null,
      signo_nodo:       planetas?.signoNodo       ?? null,
      signo_mercurio:   planetas?.signoMercurio   ?? null,
      signo_ascendente: signoAscendente           ?? null,
      lua_cuspide:      planetas?.luaCuspide      ?? null,
      latitude:         coords?.lat               ?? null,
      longitude:        coords?.lon               ?? null,
      carta_tarot: JSON.stringify(cartaSorteada),
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

    const analiseId = data[0].id;
    const rowCtx = { ...dadosInsert, id: analiseId };

    // Geração de IA em background — não bloqueia a resposta ao cliente
    ;(async () => {
      try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const [previewR, diagnosticoR, amorR, arquetiposR, plano7R, tarotR, imagemR] = await Promise.allSettled([
          gerarPreviewIA({
            signo,
            signoLua:   planetas?.signoLua   ?? null,
            signoVenus: planetas?.signoVenus ?? null,
            signoMarte: planetas?.signoMarte ?? null,
            numN:       numeroVida,
          }),
          gerarDiagnosticoIA(buildDiagnosticoCtx(rowCtx)),
          gerarAmorIA(buildAmorCtx(rowCtx)),
          gerarArquetiposIA(buildArquetiposCtx(rowCtx)),
          gerarPlano7IA(buildPlano7Ctx(rowCtx)),
          gerarInterpretacaoTarotIA({
            carta:     cartaSorteada,
            invertida: cartaSorteada.invertida,
            signo,
            numN:      numeroVida,
            objetivo:  objetivo_principal || '',
            firstName: nome.trim().split(' ')[0],
          }),
          serviceRoleKey
            ? gerarImagemTarot(cartaSorteada, analiseId, supabaseUrl, serviceRoleKey)
            : Promise.reject(new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')),
        ]);

        const extras = {};
        const preview     = previewR.status     === 'fulfilled' ? previewR.value     : null;
        const diagnostico = diagnosticoR.status === 'fulfilled' ? diagnosticoR.value : null;
        const amor        = amorR.status        === 'fulfilled' ? amorR.value        : null;
        const arquetipos  = arquetiposR.status  === 'fulfilled' ? arquetiposR.value  : null;
        const plano7      = plano7R.status      === 'fulfilled' ? plano7R.value      : null;
        const tarot       = tarotR.status       === 'fulfilled' ? tarotR.value       : null;
        const imagemUrl   = imagemR.status      === 'fulfilled' ? imagemR.value      : null;

        if (preview)     extras.preview_gerado              = preview;
        if (diagnostico) extras.diagnostico_gerado          = JSON.stringify(diagnostico);
        if (amor)        extras.amor_gerado                 = JSON.stringify(amor);
        if (arquetipos)  extras.arquetipos_gerado           = JSON.stringify(arquetipos);
        if (plano7)      extras.plano7_gerado               = JSON.stringify(plano7);
        if (tarot)       extras.carta_tarot_interpretacao   = JSON.stringify(tarot);
        if (imagemUrl)   extras.imagem_ia_url               = imagemUrl;

        if (imagemR.status === 'rejected') {
          console.error('[Pollinations] falhou:', imagemR.reason?.message || imagemR.reason);
        }

        if (Object.keys(extras).length) {
          await supabase.from('analises').update(extras).eq('id', analiseId);
          console.log('[IA] salvos:', Object.keys(extras).join(', '));
        }
      } catch (e) {
        console.error('[IA background] falhou:', e?.message || e);
      }
    })();

    return NextResponse.json({ success: true, id: analiseId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}