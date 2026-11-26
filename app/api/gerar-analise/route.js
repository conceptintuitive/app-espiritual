import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularPlanetas, calcularAscendente, calcularSignoSolar, calcularAnoPessoal, calcularNumeroAlma, calcularNumeroExpressao, calcularNumeroVida } from '@/lib/calculos';
import { gerarPreviewIA, gerarDiagnosticoIA, gerarAmorIA, gerarArquetiposIA, gerarPlano7IA, gerarInterpretacaoTarotIA } from '@/lib/ia';
import { buildDiagnosticoCtx, buildAmorCtx, buildArquetiposCtx, buildPlano7Ctx } from '@/lib/manualgenerator';
import { sortearCarta, TAROT_PROMPTS_EN } from '@/lib/tarot';
import { sendMetaLead, sendMetaStartTrial } from '@/lib/meta';
import { salvarAtribuicao } from '@/lib/ga4';
import { emailValido } from '@/lib/emailValidacao';
import { FUSOS_BR } from '@/lib/fusoBR';
import { utcOffsetHoras } from '@/lib/sky';
import { fusoPorCoordenada } from '@/lib/fusoPorCoordenada';
import { admin as adminSeuDia } from '@/lib/seuDiaServidor';
import { cadastrarSeuDiaDoQuiz, dadosDoQuiz } from '@/lib/seuDiaQuiz';
import { gravarUtmNoPerfil } from '@/lib/utmSocialServidor';
import { TESTE_SEU_DIA_ATIVO } from '@/lib/testeSeuDiaChave';

// Monta URL da Pollinations.ai a partir da carta sorteada.
// A URL é estável e cacheada — o browser carrega direto, sem precisar de upload nem API key.
function buildPollinationsUrl(cartaSorteada) {
  const cardPrompt = TAROT_PROMPTS_EN[cartaSorteada.nome] || `mystical tarot symbolism ${cartaSorteada.nome} card`;
  const energySuffix = cartaSorteada.invertida
    ? ', reversed shadowy energy, darker atmospheric tones, descending cosmic forces'
    : ', radiant upright energy, ascending golden light, celestial power';
  const styleBase = 'mystical tarot card illustration, deep purple and gold cosmic background, ethereal magical atmosphere, ornate decorative borders, ancient esoteric art style, dramatic atmospheric lighting, no text, no words, no letters, no numbers, no writing';
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${cardPrompt}, ${styleBase}${energySuffix}`)}?width=1200&height=630&nologo=true&model=flux`;
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

// Município escolhido no autocomplete do quiz (lib/municipios.js). Valida tudo
// — vem do browser — e devolve null se qualquer campo estiver fora do esperado
// (aí o fluxo cai no geocoding por texto, como antes).
function municipioDoBody({ municipio_ibge, latitude, longitude, fuso_iana }) {
  const ibge = Number(municipio_ibge);
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isInteger(ibge) || ibge < 1100000 || ibge > 5399999) return null;
  // Caixa que cobre o território brasileiro (inclui Noronha e ilhas oceânicas)
  if (!(lat >= -34 && lat <= 5.5 && lon >= -74.5 && lon <= -28.5)) return null;
  if (!FUSOS_BR.has(fuso_iana)) return null;
  return { ibge, lat, lon, tz: fuso_iana };
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

export async function POST(request) {
  try {
    // Único ponto do fluxo grátis onde a requisição vem direto do navegador
    // do cliente — usado pro evento Lead da Meta Conversions API abaixo.
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;

    const body = await request.json();
    const {
      nome,
      email,
      telefone,
      data_nascimento,
      hora_nascimento,
      local_nascimento,
      noTime,
      objetivo_principal,
      relacao_status,
      trabalho_status,
    } = body;
    const municipio = municipioDoBody(body);

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
    if (!emailValido(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!data_nascimento) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }

    let signo        = calcularSigno(data_nascimento); // reserva; o Sol real entra abaixo
    const numeroVida = calcularNumeroVida(data_nascimento);
    const anoPessoal      = calcularAnoPessoal(data_nascimento);
    const numeroAlma      = calcularNumeroAlma(nome);
    const numeroExpressao = calcularNumeroExpressao(nome);

    const temHora = !noTime && !!hora_nascimento;

    // Geocoding (rápido, 5s timeout) — necessário para signoAscendente no insert
    let coords = null;
    try {
      // Com município do autocomplete, as coordenadas já vêm prontas (IBGE) —
      // não precisa do Nominatim (mais rápido e sem erro de geocoding).
      coords = municipio ? { lat: municipio.lat, lon: municipio.lon } : await geocodeLocal(local_nascimento);
    } catch (_) {}

    // Offset real do nascimento (fuso IANA com horário de verão histórico por
    // estado), calculado UMA vez e usado em tudo: planetas, Ascendente e — via
    // utc_offset_nascimento gravado — Human Design e Compatibilidade, que são
    // recalculados a cada visita. Fuso: município do autocomplete → município
    // mais próximo das coordenadas (texto livre) → horário de Brasília (sem
    // cidade). Sem hora: null, e tudo segue o cálculo legado.
    let utcOffset = null;
    if (temHora) {
      try {
        const tz = municipio?.tz || (coords ? fusoPorCoordenada(coords.lat, coords.lon) : 'America/Sao_Paulo');
        utcOffset = utcOffsetHoras({ data: data_nascimento, hora: hora_nascimento, tz });
      } catch (_) {}
    }

    // Signo solar pela posição real do Sol (a tabela fixa erra quem nasceu no
    // dia da troca de signo). Só análises novas: o signo já gravado não muda.
    try {
      signo = calcularSignoSolar(data_nascimento, temHora ? hora_nascimento : null, utcOffset) || signo;
    } catch (_) {}

    let planetas = null;
    try {
      planetas = calcularPlanetas(data_nascimento, temHora ? hora_nascimento : null, utcOffset);
    } catch (_) {}

    let signoAscendente = null;
    try {
      if (coords && temHora && utcOffset !== null) {
        signoAscendente = calcularAscendente(data_nascimento, hora_nascimento, coords.lat, coords.lon, utcOffset);
      }
    } catch (_) {}

    const cartaSorteada = sortearCarta();
    const imagemIaUrl   = buildPollinationsUrl(cartaSorteada);

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
      carta_tarot:   JSON.stringify(cartaSorteada),
      imagem_ia_url: imagemIaUrl,
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

    // Geração de IA em background — roda após a resposta ser enviada ao cliente,
    // sem risco da Vercel encerrar a function no meio (after() garante a execução)
    after(async () => {
      // "Quero receber meu dia às 7h por e-mail" (etapa 4, vem marcado): cria o
      // perfil do Seu Dia com os dados do quiz e começa o teste de 7 dias
      // (lib/seuDiaQuiz.js; service role, a tabela não tem policy). Best effort.
      if (body?.seu_dia === true) {
        try {
          const r = await cadastrarSeuDiaDoQuiz({
            sb: adminSeuDia(),
            email: email.trim().toLowerCase(),
            dados: dadosDoQuiz({ nome, data: data_nascimento, hora: temHora ? hora_nascimento : null, municipio, localTexto: local_nascimento }),
            testeAtivo: TESTE_SEU_DIA_ATIVO,
          });
          if (!r.ok) console.error('⚠️ Seu Dia do quiz não criado:', r.motivo);
          else if (r.aviso) console.error('⚠️ Seu Dia do quiz:', r.aviso);
          // Conta nova ou teste que começou agora: a UTM da chegada vai pro perfil (0031).
          if (r.ok && (r.novo || r.comecouTeste) && body?.atribuicao) {
            const u = await gravarUtmNoPerfil(adminSeuDia(), email.trim().toLowerCase(), body.atribuicao);
            if (!u.ok && u.motivo !== 'sem utm') console.error('⚠️ UTM no perfil do Seu Dia:', u.motivo);
          }
          // O teste de 7 dias começou agora: StartTrial pra Meta (Conversions API, 1x por pessoa).
          if (r.ok && r.comecouTeste) {
            await sendMetaStartTrial({
              email: email.trim().toLowerCase(),
              phone: telefone?.trim() || null,
              clientIp,
              userAgent,
              atribuicao: body?.atribuicao ?? null,
              origem: 'quiz',
            });
          }
        } catch (e) {
          console.error('⚠️ Seu Dia do quiz não criado:', e?.message);
        }
      }

      // Telefone fica de fora do insert crítico acima de propósito — um insert
      // com coluna inexistente falha inteiro no Postgres, e essa é a rota que
      // roda em toda submissão do formulário grátis. Update separado e best
      // effort, então se a migração da coluna ainda não rodou, só o telefone
      // fica sem salvar (e o Lead da Meta sai sem "ph"), nada mais quebra.
      // municipio_ibge/fuso_iana (migração 0015) seguem o mesmo padrão do
      // telefone: update separado e best effort, pra o insert crítico nunca
      // falhar se a migração ainda não tiver rodado.
      // utc_offset_nascimento (migração 0016): o offset usado nos planetas e
      // no Ascendente acima. Human Design e Compatibilidade são recalculados a
      // cada visita e leem esse valor; sem ele (registros antigos, ou migração
      // ainda não rodada) caem no cálculo legado. Por isso a 0016 precisa
      // rodar ANTES deste código entrar em produção — senão o signo_lua salvo
      // (fuso real) e o recalculado na Compatibilidade (legado) divergem.
      if (utcOffset !== null) {
        const { error: offErr } = await supabase
          .from('analises')
          .update({ utc_offset_nascimento: utcOffset })
          .eq('id', analiseId);
        if (offErr) {
          console.error('⚠️ Não foi possível salvar utc_offset_nascimento (migração 0016 rodou?):', offErr.message);
        }
      }

      // Atribuição do Google Ads (migração 0023, lib/atribuicao.js): client_id,
      // session_id e gclid da visita do quiz, só com aceite de cookies. Mesmo
      // padrão best effort; cada checkout regrava com a sessão da compra.
      if (body?.atribuicao) await salvarAtribuicao(supabase, analiseId, body.atribuicao);

      if (municipio) {
        const { error: munErr } = await supabase
          .from('analises')
          .update({ municipio_ibge: municipio.ibge, fuso_iana: municipio.tz })
          .eq('id', analiseId);
        if (munErr) {
          console.error('⚠️ Não foi possível salvar municipio_ibge/fuso_iana (migração 0015 rodou?):', munErr.message);
        }
      }

      if (telefone?.trim()) {
        const { error: telErr } = await supabase
          .from('analises')
          .update({ telefone: telefone.trim() })
          .eq('id', analiseId);
        if (telErr) {
          console.error('⚠️ Não foi possível salvar telefone (coluna existe?):', telErr.message);
        }
      }

      // Lead pra Meta Conversions API — mesmo padrão do Purchase nos webhooks
      // de pagamento.
      await sendMetaLead({
        email: email.trim().toLowerCase(),
        phone: telefone?.trim() || null,
        analiseId,
        clientIp,
        userAgent,
        // fbc/fbp (clique do anúncio e cookie do Pixel), só com aceite de cookies
        atribuicao: body?.atribuicao ?? null,
      });

      try {
        const [previewR, diagnosticoR, amorR, arquetiposR, plano7R, tarotR] = await Promise.allSettled([
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
        ]);

        const extras = {};
        const preview     = previewR.status     === 'fulfilled' ? previewR.value     : null;
        const diagnostico = diagnosticoR.status === 'fulfilled' ? diagnosticoR.value : null;
        const amor        = amorR.status        === 'fulfilled' ? amorR.value        : null;
        const arquetipos  = arquetiposR.status  === 'fulfilled' ? arquetiposR.value  : null;
        const plano7      = plano7R.status      === 'fulfilled' ? plano7R.value      : null;
        const tarot       = tarotR.status       === 'fulfilled' ? tarotR.value       : null;

        if (preview)     extras.preview_gerado              = preview;
        if (diagnostico) extras.diagnostico_gerado          = JSON.stringify(diagnostico);
        if (amor)        extras.amor_gerado                 = JSON.stringify(amor);
        if (arquetipos)  extras.arquetipos_gerado           = JSON.stringify(arquetipos);
        if (plano7)      extras.plano7_gerado               = JSON.stringify(plano7);
        if (tarot)       extras.carta_tarot_interpretacao   = JSON.stringify(tarot);

        if (Object.keys(extras).length) {
          await supabase.from('analises').update(extras).eq('id', analiseId);
          console.log('[IA] salvos:', Object.keys(extras).join(', '));
        }
      } catch (e) {
        console.error('[IA background] falhou:', e?.message || e);
      }
    });

    return NextResponse.json({ success: true, id: analiseId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}